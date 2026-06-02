import requests

def test():
    headers = {
        'x-ig-app-id': '936619743392459',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    r = requests.get('https://www.instagram.com/api/v1/users/web_profile_info/?username=astrotalk', headers=headers)
    print(r.status_code)
    try:
        data = r.json()
        count = data['data']['user']['edge_followed_by']['count']
        print(f"Exact count: {count}")
    except:
        print(r.text[:200])

test()
