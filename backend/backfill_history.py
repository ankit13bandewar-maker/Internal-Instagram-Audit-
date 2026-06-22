import json
import os
from datetime import datetime, timedelta

base_dir = os.path.dirname(os.path.abspath(__file__))
HISTORY_DB_PATH = os.path.join(base_dir, "data_cache", "history_db.json")

def fill_distribution_gaps(items, audit_year=2026):
    if not items:
        return items
    
    parsed_items = []
    for item in items:
        date_str = item.get("date", "")
        views = item.get("views", 0)
        if views <= 0:
            continue
        try:
            # clean formatting
            clean_date_str = date_str.strip().replace("Wk of ", "")
            # parse date with given year to avoid deprecation warnings/ambiguity
            try:
                dt = datetime.strptime(clean_date_str, "%d/%m/%Y").date()
            except ValueError:
                dt = datetime.strptime(f"{clean_date_str} {audit_year}", "%b %d %Y").date()
            parsed_items.append((dt, views))
        except Exception as e:
            try:
                # Try parsing if date format is slightly different
                dt = datetime.strptime(f"{clean_date_str} {audit_year}", "%b %y %Y").date()
                parsed_items.append((dt, views))
            except Exception:
                print(f"Warning: Could not parse date string '{date_str}': {e}")
                continue
                
    parsed_items.sort(key=lambda x: x[0])
    
    filled = []
    for dt, views in parsed_items:
        filled.append({
            "date": dt.strftime("%d/%m/%Y"),
            "views": views
        })
        
    return filled

def main():
    if not os.path.exists(HISTORY_DB_PATH):
        print(f"Database path not found: {HISTORY_DB_PATH}")
        return
        
    print(f"Loading database from {HISTORY_DB_PATH}...")
    with open(HISTORY_DB_PATH, "r") as f:
        db = json.load(f)
        
    updated_count = 0
    for username, payload in db.items():
        # Get audit year from audited_at if available
        audit_year = 2026
        audited_at = payload.get("audited_at")
        if audited_at:
            try:
                audit_year = int(audited_at[:4])
            except Exception:
                pass
                
        # Fill reels_views_distribution
        if "reels_views_distribution" in payload:
            orig_len = len(payload["reels_views_distribution"])
            payload["reels_views_distribution"] = fill_distribution_gaps(payload["reels_views_distribution"], audit_year)
            new_len = len(payload["reels_views_distribution"])
            if new_len != orig_len:
                print(f"Updated top-level reels_views_distribution for {username}: {orig_len} -> {new_len} items")
                updated_count += 1
                
        if "reach_distribution_data" in payload:
            orig_len = len(payload["reach_distribution_data"])
            payload["reach_distribution_data"] = fill_distribution_gaps(payload["reach_distribution_data"], audit_year)
            new_len = len(payload["reach_distribution_data"])
            if new_len != orig_len:
                print(f"Updated top-level reach_distribution_data for {username}: {orig_len} -> {new_len} items")
                updated_count += 1
                
        # Fill inside client_metrics
        client_metrics = payload.get("client_metrics")
        if isinstance(client_metrics, dict):
            if "reels_views_distribution" in client_metrics:
                orig_len = len(client_metrics["reels_views_distribution"])
                client_metrics["reels_views_distribution"] = fill_distribution_gaps(client_metrics["reels_views_distribution"], audit_year)
                new_len = len(client_metrics["reels_views_distribution"])
                if new_len != orig_len:
                    print(f"Updated client_metrics reels_views_distribution for {username}: {orig_len} -> {new_len} items")
                    updated_count += 1
                    
            if "reach_distribution_data" in client_metrics:
                orig_len = len(client_metrics["reach_distribution_data"])
                client_metrics["reach_distribution_data"] = fill_distribution_gaps(client_metrics["reach_distribution_data"], audit_year)
                new_len = len(client_metrics["reach_distribution_data"])
                if new_len != orig_len:
                    print(f"Updated client_metrics reach_distribution_data for {username}: {orig_len} -> {new_len} items")
                    updated_count += 1
                    
    if updated_count > 0:
        print("Saving updated database...")
        with open(HISTORY_DB_PATH, "w") as f:
            json.dump(db, f, indent=2)
        print("Database updated successfully!")
    else:
        print("No updates were required.")

if __name__ == "__main__":
    main()
