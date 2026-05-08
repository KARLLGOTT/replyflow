from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models import User, SalesScript
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/scripts", tags=["Scripts"])

# ===== SCHEMAS =====
class ScriptCreate(BaseModel):
    name: str
    category: str
    template: str

class ScriptUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    template: Optional[str] = None
    is_active: Optional[bool] = None

class ScriptResponse(BaseModel):
    id: int
    name: str
    category: str
    template: str
    is_active: bool
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===== СТАНДАРТНІ СКРИПТИ =====
DEFAULT_SCRIPTS_UK = [
    {
        "name": "Привітання",
        "category": "greeting",
        "template": "Вітаю! Радий вас вітати. Чим можу допомогти? Розкажіть, що вас цікавить."
    },
    {
        "name": "Заперечення 'Дорого'",
        "category": "objection",
        "template": "Розумію ваше занепокоєння щодо ціни. Давайте подивимося, яку цінність ви отримуєте. Скільки ви втрачаєте зараз, не маючи цього рішення?"
    },
    {
        "name": "Заперечення 'Подумаю'",
        "category": "objection",
        "template": "Звичайно, подумайте. Які критерії для вас найважливіші? Я можу підготувати додаткову інформацію."
    },
    {
        "name": "Запит ціни",
        "category": "price_request",
        "template": "У нас є кілька тарифів: Free - $0, Starter - $9/міс, Professional - $29/міс, Business - $79/міс. Який варіант вам ближче?"
    },
    {
        "name": "Завершення угоди",
        "category": "closing",
        "template": "Чудово! Давайте оформимо. Що вам зручніше: картка чи PayPal?"
    },
    {
        "name": "Скарга/проблема",
        "category": "complaint",
        "template": "Перепрошую за незручності. Давайте розберемося. Якщо не допоможе — я підключу технічну підтримку."
    },
]

DEFAULT_SCRIPTS_EN = [
    {
        "name": "Greeting",
        "category": "greeting",
        "template": "Hello! Glad to welcome you. How can I help you? Tell me what interests you."
    },
    {
        "name": "Objection 'Expensive'",
        "category": "objection",
        "template": "I understand your concern about the price. Let's look at the value you get. How much are you losing now without this solution?"
    },
    {
        "name": "Objection 'I'll think about it'",
        "category": "objection",
        "template": "Of course, think about it. What criteria are most important to you? I can prepare additional information."
    },
    {
        "name": "Price request",
        "category": "price_request",
        "template": "We have several plans: Free - $0, Starter - $9/month, Professional - $29/month, Business - $79/month. Which option suits you best?"
    },
    {
        "name": "Closing the deal",
        "category": "closing",
        "template": "Great! Let's proceed. What is more convenient for you: card or PayPal?"
    },
    {
        "name": "Complaint/Problem",
        "category": "complaint",
        "template": "Sorry for the inconvenience. Let's figure it out. If it doesn't help, I'll connect technical support."
    },
]

# ===== ЭНДПОИНТЫ =====

@router.get("/")
def get_scripts(
    language: str = "uk",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    default_scripts = db.query(SalesScript).filter(
        SalesScript.is_default == True,
        SalesScript.is_active == True,
        SalesScript.language == language
    ).all()
    
    user_scripts = db.query(SalesScript).filter(
        SalesScript.user_id == current_user.id,
        SalesScript.is_default == False,
        SalesScript.is_active == True,
        SalesScript.language == language
    ).all()
    
    return default_scripts + user_scripts

@router.post("/", response_model=ScriptResponse)
def create_script(
    script: ScriptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать свой скрипт (только Professional и Business)"""
    if current_user.subscription_plan not in ["professional", "business"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Создание своих скриптов доступно на тарифах Professional и Business"
        )
    
    new_script = SalesScript(
        user_id=current_user.id,
        name=script.name,
        category=script.category,
        template=script.template,
        is_active=True,
        is_default=False
    )
    db.add(new_script)
    db.commit()
    db.refresh(new_script)
    return new_script

@router.put("/{script_id}", response_model=ScriptResponse)
def update_script(
    script_id: int,
    script: ScriptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить свой скрипт"""
    db_script = db.query(SalesScript).filter(SalesScript.id == script_id).first()
    if not db_script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if db_script.user_id != current_user.id and not db_script.is_default:
        raise HTTPException(status_code=403, detail="Not your script")
    if db_script.is_default:
        raise HTTPException(status_code=403, detail="Cannot edit default scripts")
    
    if script.name is not None:
        db_script.name = script.name
    if script.category is not None:
        db_script.category = script.category
    if script.template is not None:
        db_script.template = script.template
    if script.is_active is not None:
        db_script.is_active = script.is_active
    
    db.commit()
    db.refresh(db_script)
    return db_script

@router.delete("/{script_id}")
def delete_script(
    script_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить свой скрипт"""
    db_script = db.query(SalesScript).filter(SalesScript.id == script_id).first()
    if not db_script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if db_script.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your script")
    if db_script.is_default:
        raise HTTPException(status_code=403, detail="Cannot delete default scripts")
    
    db.delete(db_script)
    db.commit()
    
    return {"status": "ok", "message": "Script deleted"}

@router.post("/init-default")
def init_default_scripts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ініціалізація стандартних скриптів (тільки адмін)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Додаємо українські скрипти
    for script_data in DEFAULT_SCRIPTS_UK:
        existing = db.query(SalesScript).filter(
            SalesScript.name == script_data["name"],
            SalesScript.is_default == True
        ).first()
        if not existing:
            script = SalesScript(
                user_id=current_user.id,
                name=script_data["name"],
                category=script_data["category"],
                template=script_data["template"],
                is_active=True,
                is_default=True
            )
            db.add(script)
    
    # Додаємо англійські скрипти
    for script_data in DEFAULT_SCRIPTS_EN:
        existing = db.query(SalesScript).filter(
            SalesScript.name == script_data["name"],
            SalesScript.is_default == True
        ).first()
        if not existing:
            script = SalesScript(
                user_id=current_user.id,
                name=script_data["name"],
                category=script_data["category"],
                template=script_data["template"],
                is_active=True,
                is_default=True
            )
            db.add(script)
    
    db.commit()
    return {"status": "ok", "message": f"Initialized {len(DEFAULT_SCRIPTS_UK) + len(DEFAULT_SCRIPTS_EN)} default scripts"}