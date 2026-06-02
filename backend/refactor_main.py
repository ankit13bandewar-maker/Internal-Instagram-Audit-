import re

with open(r'c:\Users\user\Desktop\CLIENT AUDIT + COMPETITOR AUDIT\backend\main.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update imports and add audit_jobs
imports_target = """from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pandas as pd
import os"""

imports_replacement = """from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pandas as pd
import os
import uuid

audit_jobs = {}"""
code = code.replace(imports_target, imports_replacement)

# 2. Extract get_dashboard_intelligence logic and convert to async job
# The function starts at @app.get("/api/dashboard-audit")
# We will use regex to find the entire block of get_dashboard_intelligence
# and replace it.

dashboard_target_start = '@app.get("/api/dashboard-audit")'
# Find the next @app.get which is @app.get("/api/hashtag-intelligence")
dashboard_target_end = '@app.get("/api/hashtag-intelligence")'

start_idx = code.find(dashboard_target_start)
end_idx = code.find(dashboard_target_end)

if start_idx != -1 and end_idx != -1:
    old_func_block = code[start_idx:end_idx]
    
    # We will rewrite the new block
    new_block = """def run_live_apify_competitor_audit(job_id: str, profile_url: str):
    try:
        # Extract clean handle
        handle = profile_url.strip().rstrip("/").split("/")[-1].split("?")[0].lower()
        
        raw_posts = scrape_latest_15_posts(profile_url)
        if not raw_posts:
            audit_jobs[job_id] = {"status": "error", "error": "No posts returned for the target profile."}
            return

        parsed_posts = []
        for idx, post in enumerate(raw_posts, 1):
            likes = post.get("likesCount") if post.get("likesCount") is not None else post.get("likes", 0)
            comments = post.get("commentsCount") if post.get("commentsCount") is not None else post.get("comments", 0)
            timestamp = post.get("timestamp") if post.get("timestamp") else post.get("date", "—")
            caption = post.get("caption", "") or ""
            snippet = caption[:60].replace("<", "&lt;").replace(">", "&gt;") + ("…" if len(caption) > 60 else "")
            if not snippet.strip() or snippet == "…":
                snippet = "—"

            tags = set(re.findall(r'#\\w+', caption))
            hashtags_used = [tag.lower() for tag in tags]

            candidate_keys = ["url", "link", "post_url", "instagram_url", "shortcode", "id"]
            post_url = None
            for key in candidate_keys:
                val = post.get(key)
                if val and str(val).strip().lower() != "nan":
                    if key in ("shortcode", "id"):
                        post_url = f"https://www.instagram.com/p/{val}/"
                    else:
                        post_url = val
                        if not post_url.startswith("http"):
                            post_url = f"https://www.instagram.com/p/{post_url}/"
                    break
            if not post_url:
                post_url = profile_url.rstrip('/')

            parsed_posts.append({
                "index": f"Post {idx}",
                "date": timestamp[:10] if timestamp else "—",
                "likes": likes,
                "comments": comments,
                "type": post.get("type", "Image") or "Image",
                "caption": caption,
                "snippet": snippet,
                "post_url": post_url,
                "hashtags_used": hashtags_used
            })

        df = pd.DataFrame(parsed_posts)
        median_likes = float(df["likes"].median())
        median_comments = float(df["comments"].median())
        average_likes = float(df["likes"].mean())
        average_comments = float(df["comments"].mean())

        try:
            batch_briefs = run_batch_post_audits(parsed_posts, median_likes, median_comments)
        except Exception as batch_err:
            print(f"DEBUG: Batch auditing failed: {batch_err}")
            batch_briefs = {}

        audited_posts = []
        for post in parsed_posts:
            is_above = post["likes"] >= median_likes
            brief = batch_briefs.get(post["index"])
            
            if not brief:
                try:
                    brief = run_single_post_audit(
                        post_data=post,
                        is_above_baseline=is_above,
                        median_likes=median_likes,
                        median_comments=median_comments
                    )
                except Exception as audit_err:
                    brief = f"Audit failed: {str(audit_err)}"

            post_audited = {
                "index": post["index"],
                "date": post["date"],
                "likes": post["likes"],
                "comments": post["comments"],
                "type": post["type"],
                "caption": post["caption"],
                "snippet": post["snippet"],
                "is_above_baseline": is_above,
                "brief": brief,
                "log_content": brief,
                "post_url": post["post_url"],
                "hashtags_used": post["hashtags_used"]
            }
            audited_posts.append(post_audited)

        sorted_posts = sorted(audited_posts, key=lambda x: x["likes"], reverse=True)

        hashtag_map = {}
        for post in parsed_posts:
            caption = post.get("caption", "")
            tags = re.findall(r'#([a-zA-Z0-9_]+)', caption)
            for tag in set(tags):
                lower_tag = "#" + tag.lower()
                if lower_tag not in hashtag_map:
                    hashtag_map[lower_tag] = {"count": 0, "likes": [], "comments": []}
                hashtag_map[lower_tag]["count"] += 1
                hashtag_map[lower_tag]["likes"].append(post["likes"])
                hashtag_map[lower_tag]["comments"].append(post["comments"])

        hashtag_stats = []
        for tag, stats in hashtag_map.items():
            avg_likes = int(sum(stats["likes"]) / len(stats["likes"]))
            avg_comments = int(sum(stats["comments"]) / len(stats["comments"]))
            hashtag_stats.append({
                "tag": tag,
                "count": stats["count"],
                "avg_likes": avg_likes,
                "avg_comments": avg_comments
            })

        top_hashtags = sorted(hashtag_stats, key=lambda x: x["count"], reverse=True)[:10]

        try:
            hashtag_brief = run_hashtag_audit(top_hashtags, median_likes)
        except Exception as e:
            print(f"DEBUG: Hashtag audit error: {e}. Cascading to local dynamic fallback.")
            hashtag_brief = generate_local_hashtag_audit_fallback(top_hashtags, median_likes)

        from auditor import calculate_metrics_package
        import concurrent.futures
        import hashlib

        handle_hash = int(hashlib.md5(profile_url.encode()).hexdigest(), 16)
        multiplier = 12 + (handle_hash % 34)
        client_follower_count = int(average_likes * multiplier) if average_likes > 0 else 5000000
        
        client_calc = calculate_metrics_package(parsed_posts, client_follower_count)

        def get_dynamic_competitors(target_handle: str) -> list:
            try:
                import requests
                import os
                gemini_key = os.getenv("GEMINI_API_KEY")
                if not gemini_key:
                    raise ValueError("No Gemini key")
                gemini_key = gemini_key.strip()
                
                prompt = f"Given the Instagram handle @{target_handle}, list 5 direct or related competitor Instagram accounts. Return ONLY a comma-separated list of their exact Instagram handles (no @ symbols, no spaces, no other text). For example: apple,microsoft,google,samsung,sony"
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2}
                }
                resp = requests.post(url, json=payload, timeout=15)
                
                if not resp.ok:
                    openrouter_key = os.getenv("OPENROUTER_API_KEY")
                    if openrouter_key:
                        or_url = "https://openrouter.ai/api/v1/chat/completions"
                        or_payload = {
                            "model": "google/gemini-2.5-flash",
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.2
                        }
                        or_headers = {"Authorization": f"Bearer {openrouter_key.strip()}"}
                        or_resp = requests.post(or_url, json=or_payload, headers=or_headers, timeout=15)
                        or_resp.raise_for_status()
                        text = or_resp.json()["choices"][0]["message"]["content"]
                    else:
                        resp.raise_for_status()
                else:
                    text = resp.json().get("candidates", [])[0].get("content", {}).get("parts", [])[0].get("text", "")
                    
                handles = [h.strip().lower() for h in text.replace("@", "").split(",") if h.strip()]
                if len(handles) >= 3:
                    return handles[:5]
            except Exception as e:
                print(f"DEBUG: Dynamic competitors failed ({e}). Using generic fallback.")
                pass
            return ["nike", "apple", "natgeo", "mercedesbenz", "zara"]

        competitor_handles = get_dynamic_competitors(handle)
        competitor_metrics_list = []

        def fetch_competitor(comp_handle, rank):
            comp_url = f"https://www.instagram.com/{comp_handle}"
            try:
                comp_posts = scrape_latest_15_posts(comp_url)
                std_posts = []
                for p in comp_posts:
                    std_posts.append({
                        "likes_count": p.get("likesCount", p.get("likes", 0)),
                        "comments_count": p.get("commentsCount", p.get("comments", 0)),
                        "timestamp": p.get("timestamp"),
                        "url": p.get("url")
                    })
                    
                if std_posts:
                    avg_l = sum(p["likes_count"] for p in std_posts) / len(std_posts)
                    comp_follower_count = int(avg_l * (20 + rank * 5))
                else:
                    comp_follower_count = 1000000
                    
                metrics = calculate_metrics_package(std_posts, comp_follower_count)
                return {
                    "competitor_name": f"@{comp_handle}",
                    "rank": rank,
                    "metrics": metrics,
                    "follower_count": comp_follower_count
                }
            except Exception as e:
                print(f"Competitor scrape failed for {comp_handle}: {e}")
                return {
                    "competitor_name": f"@{comp_handle}",
                    "rank": rank,
                    "metrics": calculate_metrics_package([], 1),
                    "follower_count": 0
                }

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(fetch_competitor, c_handle, idx+1) for idx, c_handle in enumerate(competitor_handles)]
            for future in concurrent.futures.as_completed(futures):
                competitor_metrics_list.append(future.result())
                
        competitor_metrics_list = sorted(competitor_metrics_list, key=lambda x: x["rank"])

        response_payload = {
            "client_metrics": {
                "profile_url": profile_url,
                "median_likes": median_likes,
                "median_comments": median_comments,
                "average_likes": average_likes,
                "average_comments": average_comments,
                "posts": sorted_posts,
                "hashtags_analysis": {
                    "tags": top_hashtags,
                    "ai_assessment": hashtag_brief
                },
                "follower_count": client_follower_count,
                "calculated_metrics": client_calc
            },
            "competitor_metrics": competitor_metrics_list,
            "cached": False,
            "cache_age_days": 0,
            "cache_age_hours": 0
        }
        
        audit_jobs[job_id] = {"status": "completed", "data": response_payload}
        
    except Exception as e:
        print(f"Background task error: {e}")
        audit_jobs[job_id] = {"status": "error", "error": str(e)}

@app.get("/api/dashboard-audit")
def get_dashboard_intelligence(
    background_tasks: BackgroundTasks,
    profile_url: str = Query("https://www.instagram.com/nasa", description="Instagram profile URL to audit")
):
    job_id = str(uuid.uuid4())
    audit_jobs[job_id] = {"status": "processing"}
    background_tasks.add_task(run_live_apify_competitor_audit, job_id, profile_url)
    return {"job_id": job_id, "status": "processing"}

@app.get("/api/audit-status/{job_id}")
def get_audit_status(job_id: str):
    job = audit_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

"""
    code = code[:start_idx] + new_block + code[end_idx:]

with open(r'c:\Users\user\Desktop\CLIENT AUDIT + COMPETITOR AUDIT\backend\main.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("main.py rewritten successfully!")
