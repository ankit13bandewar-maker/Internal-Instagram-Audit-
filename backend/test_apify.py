from apify_service import scrape_latest_15_posts

def test(handle):
    try:
        posts = scrape_latest_15_posts(f"https://www.instagram.com/{handle}")
        print(f"{handle}: {len(posts)} posts")
    except Exception as e:
        print(f"{handle}: Error - {e}")

test("premastrologer")
test("dr.jai.madan")
test("dr.aartidahiya")
test("tarot_reader_nidhi")
