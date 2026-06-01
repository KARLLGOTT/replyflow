#!/usr/bin/env python3
import asyncio
import sys
import os
from pathlib import Path

# Добавляем backend в путь
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from bot import start_polling

if __name__ == "__main__":
    print("Starting bot...")
    asyncio.run(start_polling())
