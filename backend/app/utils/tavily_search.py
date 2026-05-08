import os
import re
from typing import Optional, List, Dict, Any

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

USE_REAL_TAVILY = False
tavily_client = None

if TAVILY_API_KEY:
    try:
        from tavily import TavilyClient
        tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
        USE_REAL_TAVILY = True
        print("[INFO] Tavily client initialized")
    except Exception as e:
        print(f"[WARNING] Could not init Tavily: {e}")

def should_search_external(text: str, language: str = "uk") -> bool:
    """Визначає, чи потрібен пошук - якщо користувач просить посилання - завжди шукаємо"""
    if not USE_REAL_TAVILY:
        return False
    
    text_lower = text.lower()
    
    # Якщо користувач прямо просить посилання - ЗАВЖДИ шукаємо
    link_phrases = [
        "дай ссылк", "дай посиланн", "скинь ссылк", "скинь посиланн",
        "покажи ссылк", "покажи посиланн", "ссылки", "посилання",
        "give link", "show link", "send link", "find link", "links"
    ]
    
    for phrase in link_phrases:
        if phrase in text_lower:
            print(f"[SEARCH] User requested links, searching...")
            return True
    
    # Для інших запитів - стандартна логіка
    keywords = [
        "знайди", "найди", "покажи", "дай", "скинь", "відправ",
        "посилання", "ссылки", "посилання на", "де знайти",
        "знайди в інтернеті", "пошукай", "підбери",
        "find", "show", "give", "send", "link", "search",
        "джерела", "источники", "sources", "reference"
    ]
    
    for kw in keywords:
        if kw in text_lower:
            return True
    
    return False

async def search_legislation(query: str, language: str = "uk") -> Optional[List[Dict[str, Any]]]:
    """
    Виконує пошук через Tavily API.
    Повертає список результатів або None.
    """
    if not should_search_external(query, language):
        return None
    
    if not USE_REAL_TAVILY or not tavily_client:
        print("[WARNING] Tavily client not available")
        return None
    
    try:
        # Очищаємо запит від службових слів
        search_query = query.lower()
        
        # Видаляємо слова-команди
        remove_words = [
            'дай', 'знайди', 'покажи', 'скинь', 'посилання', 'ссылки',
            'give', 'find', 'show', 'send', 'link', 'links', 'please',
            'будь ласка', 'пожалуйста'
        ]
        
        for word in remove_words:
            search_query = search_query.replace(word, '')
        
        search_query = ' '.join(search_query.split()).strip()
        
        # ДОДАЄМО УКРАЇНУ, ЯКЩО ЇЇ НЕМАЄ
        if "україн" not in search_query and "украин" not in search_query:
            if language == "uk":
                search_query = f"{search_query} Україна"
            else:
                search_query = f"{search_query} Ukraine"
            print(f"[SEARCH] Added Ukraine to query: {search_query}")
        
        if len(search_query) < 3:
            search_query = query
        
        print(f"[SEARCH] Final query: {search_query}")
        
        # Українські домени для пріоритету
        ukrainian_domains = [
            "olx.ua", "dom.ria.com", "realt.ua", "lun.ua", "dim.ria.com",
            "novostroyki.ua", "m2.ua", "versii.ua", "ua", "com.ua", "org.ua"
        ]
        
        # Російські домени для виключення
        russian_domains = [".ru", ".su", ".rf", "ru.", "su.", "rf."]
        
        # Виконуємо пошук з обмеженнями
        response = tavily_client.search(
            query=search_query,
            search_depth="advanced",
            max_results=5,
            include_domains=ukrainian_domains,
            exclude_domains=russian_domains
        )
        
        if not response or "results" not in response:
            print("[SEARCH] No results")
            return None
        
        # Фільтруємо результати (додаткова перевірка на російські домени)
        results = []
        for r in response["results"][:5]:
            url = r.get("url", "")
            # Пропускаємо російські домени
            if any(rd in url for rd in russian_domains):
                print(f"[SEARCH] Skipping Russian domain: {url}")
                continue
            results.append({
                "title": r.get("title", "Без назви"),
                "url": url,
                "content": r.get("content", "")[:300]
            })
        
        print(f"[SEARCH] Found {len(results)} results (filtered)")
        return results if results else None
        
    except Exception as e:
        print(f"[ERROR] Tavily search failed: {e}")
        return None