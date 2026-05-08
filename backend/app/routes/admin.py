from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User
from app.schemas import UserRead, UserUpdate
from app.dependencies import get_current_admin
from app.config import config

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ===== ОСНОВНЫЕ ЭНДПОИНТЫ =====

@router.get("/users", response_model=List[UserRead])
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.subscription_plan is not None:
        user.subscription_plan = user_data.subscription_plan
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.is_admin is not None:
        user.is_admin = user_data.is_admin
    if user_data.subscription_end_date is not None:
        user.subscription_end_date = user_data.subscription_end_date
    if user_data.subscription_auto_renew is not None:
        user.subscription_auto_renew = user_data.subscription_auto_renew
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_generations = db.query(User).with_entities(User.total_generations).all()
    total_generations_sum = sum(g[0] for g in total_generations if g[0])
    
    expired_subscriptions = db.query(User).filter(
        User.subscription_plan != "free",
        User.subscription_end_date < datetime.utcnow()
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_generations": total_generations_sum,
        "expired_subscriptions": expired_subscriptions
    }

@router.get("/cost-stats")
def get_cost_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    users = db.query(User).all()
    total_cost = sum(u.total_cost_month for u in users)
    
    return {
        "total_monthly_cost": round(total_cost, 2),
        "users_by_plan": {
            "free": len([u for u in users if u.subscription_plan == "free"]),
            "starter": len([u for u in users if u.subscription_plan == "starter"]),
            "professional": len([u for u in users if u.subscription_plan == "professional"]),
            "business": len([u for u in users if u.subscription_plan == "business"]),
        },
        "top_spenders": [
            {"email": u.email, "username": u.username, "cost": round(u.total_cost_month, 2)} 
            for u in sorted(users, key=lambda x: x.total_cost_month, reverse=True)[:5]
        ]
    }

# ===== УПРАВЛЕНИЕ ПОДПИСКАМИ =====

@router.post("/extend-subscription/{user_id}")
def extend_subscription(
    user_id: int,
    days: int = 30,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.utcnow()
    if user.subscription_end_date and user.subscription_end_date > now:
        new_end_date = user.subscription_end_date + timedelta(days=days)
    else:
        new_end_date = now + timedelta(days=days)
    
    user.subscription_end_date = new_end_date
    db.commit()
    
    return {
        "status": "ok",
        "message": f"Subscription extended to {new_end_date.date()}",
        "user_id": user_id,
        "new_end_date": new_end_date.isoformat()
    }

@router.post("/reset-user-limits/{user_id}")
def reset_user_limits(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.generations_today = 0
    user.last_generation_date = None
    user.total_cost_month = 0
    user.cost_reset_date = datetime.utcnow()
    db.commit()
    
    return {
        "status": "ok",
        "message": f"Limits reset for user {user.email}",
        "user_id": user_id
    }

@router.get("/subscription-info/{user_id}")
def get_subscription_info(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.utcnow()
    is_active = True
    days_left = None
    
    if user.subscription_plan != "free" and user.subscription_end_date:
        if user.subscription_end_date > now:
            days_left = (user.subscription_end_date - now).days
        else:
            is_active = False
            days_left = 0
    
    limits = {"free": 10, "starter": 50, "professional": 150, "business": None}
    
    return {
        "user_id": user.id,
        "email": user.email,
        "subscription_plan": user.subscription_plan,
        "subscription_end_date": user.subscription_end_date.isoformat() if user.subscription_end_date else None,
        "subscription_auto_renew": user.subscription_auto_renew,
        "is_active_subscription": is_active,
        "days_left": days_left,
        "generations_today": user.generations_today,
        "generations_limit": limits.get(user.subscription_plan, 10)
    }

@router.post("/activate-subscription/{user_id}")
def activate_subscription(
    user_id: int,
    plan: str = "starter",
    days: int = 30,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_plans = ["starter", "professional", "business"]
    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {valid_plans}")
    
    user.subscription_plan = plan
    user.subscription_end_date = datetime.utcnow() + timedelta(days=days)
    user.subscription_auto_renew = True
    user.generations_today = 0
    user.total_cost_month = 0
    user.last_generation_date = datetime.utcnow()
    user.cost_reset_date = datetime.utcnow()
    db.commit()
    
    return {
        "status": "ok",
        "message": f"Subscription activated for user {user.email}",
        "user_id": user.id,
        "plan": plan,
        "end_date": user.subscription_end_date.isoformat()
    }

# ===== УПРАВЛЕНИЕ ЦЕНАМИ =====

@router.get("/prices")
def get_prices(
    current_admin: User = Depends(get_current_admin)
):
    return {"prices": config.PRICES}

@router.post("/prices")
def update_prices(
    prices: dict,
    current_admin: User = Depends(get_current_admin)
):
    import os
    from dotenv import set_key
    
    env_path = os.path.join(os.path.dirname(__file__), "../../.env")
    
    for plan, price in prices.items():
        set_key(env_path, f"PRICE_{plan.upper()}", str(price))
    
    return {
        "status": "ok",
        "message": "Prices saved. Restart backend to apply changes.",
        "prices": prices
    }

# ===== УПРАВЛЕНИЕ СКРИПТАМИ =====

@router.get("/scripts")
def get_all_scripts(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    from app.models import SalesScript
    scripts = db.query(SalesScript).all()
    result = []
    for s in scripts:
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_email": s.user.email if s.user else None,
            "name": s.name,
            "category": s.category,
            "template": s.template[:200] + "..." if len(s.template) > 200 else s.template,
            "is_active": s.is_active,
            "is_default": s.is_default,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result

@router.post("/scripts/{script_id}/toggle")
def toggle_script(
    script_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    from app.models import SalesScript
    script = db.query(SalesScript).filter(SalesScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    script.is_active = not script.is_active
    db.commit()
    
    return {"status": "ok", "is_active": script.is_active}

@router.delete("/scripts/{script_id}")
def delete_script(
    script_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    from app.models import SalesScript
    script = db.query(SalesScript).filter(SalesScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if script.is_default:
        raise HTTPException(status_code=403, detail="Cannot delete default scripts")
    
    db.delete(script)
    db.commit()
    
    return {"status": "ok", "message": "Script deleted"}

@router.put("/scripts/{script_id}")
def update_script(
    script_id: int,
    script_data: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    from app.models import SalesScript
    script = db.query(SalesScript).filter(SalesScript.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if "name" in script_data:
        script.name = script_data["name"]
    if "template" in script_data:
        script.template = script_data["template"]
    if "category" in script_data:
        script.category = script_data["category"]
    if "is_active" in script_data:
        script.is_active = script_data["is_active"]
    
    db.commit()
    
    return {"status": "ok", "message": "Script updated"}

# ===== АНАЛИТИКА =====

@router.get("/analytics")
def get_analytics(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    from app.models import Analytics
    total = db.query(Analytics).count()
    items = db.query(Analytics).order_by(Analytics.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": a.id,
                "user_email": a.user_email,
                "subscription_plan": a.subscription_plan,
                "question": a.question[:200] if a.question else None,
                "answer": a.answer[:200] if a.answer else None,
                "model_used": a.model_used,
                "response_time_ms": a.response_time_ms,
                "tokens_used": a.tokens_used,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in items
        ]
    }

@router.get("/analytics/stats")
def get_analytics_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    from app.models import Analytics
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    total_requests = db.query(Analytics).count()
    avg_response_time = db.query(func.avg(Analytics.response_time_ms)).scalar()
    avg_tokens = db.query(func.avg(Analytics.tokens_used)).scalar()
    unique_users = db.query(func.count(func.distinct(Analytics.user_id))).scalar()
    
    # По тарифам
    by_plan = db.query(
        Analytics.subscription_plan, 
        func.count(Analytics.id)
    ).group_by(Analytics.subscription_plan).all()
    
    # Последние 24 часа (исправленный запрос)
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    last_24h = db.query(
        func.date_trunc('hour', Analytics.created_at).label('hour'),
        func.count(Analytics.id).label('count')
    ).filter(
        Analytics.created_at >= twenty_four_hours_ago
    ).group_by(
        func.date_trunc('hour', Analytics.created_at)
    ).order_by(
        func.date_trunc('hour', Analytics.created_at).asc()
    ).all()
    
    # Форматируем результат
    formatted_last_24h = []
    for row in last_24h:
        formatted_last_24h.append({
            "hour": str(row[0]),
            "count": row[1]
        })
    
    return {
        "total_requests": total_requests,
        "avg_response_time_ms": round(avg_response_time, 2) if avg_response_time else 0,
        "avg_tokens": round(avg_tokens, 2) if avg_tokens else 0,
        "unique_users": unique_users or 0,
        "by_plan": [{"plan": p[0] or "unknown", "count": p[1]} for p in by_plan],
        "last_24h": formatted_last_24h
    }