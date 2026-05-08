def set_refresh_token_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,           # ← для HTTPS
        samesite="lax",        # ← для безопасности
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/users",
    )
    
    # в файле секьюрити заменить эту функцию перед деплоем