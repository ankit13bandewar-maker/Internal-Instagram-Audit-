import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apify_service import _scrape_via_instagram_api

posts = _scrape_via_instagram_api('https://www.instagram.com/adityakundli/')
print(f'Got {len(posts)} posts')
for i, p in enumerate(posts, 1):
    sc = p.get('shortcode', '?')
    pt = p.get('type', '?')
    ts = p.get('timestamp', '')[:10]
    print(f'  [{i}] {sc} | {pt} | {ts}')
