import asyncio
from main import get_dashboard_intelligence

try:
    res = get_dashboard_intelligence("https://www.instagram.com/nasa")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
