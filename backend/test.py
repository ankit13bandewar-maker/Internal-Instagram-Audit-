import traceback
from main import get_dashboard_intelligence
try:
    get_dashboard_intelligence("https://www.instagram.com/nasa")
except Exception as e:
    traceback.print_exc()
