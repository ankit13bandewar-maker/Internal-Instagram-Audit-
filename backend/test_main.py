import asyncio
from main import get_dashboard_intelligence
from fastapi import BackgroundTasks

try:
    bg_tasks = BackgroundTasks()
    res = get_dashboard_intelligence(bg_tasks, "https://www.instagram.com/nasa")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
