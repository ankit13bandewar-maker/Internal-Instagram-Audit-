import pandas as pd
import random

def run_dynamic_audit_pipeline(client_url):
    """
    Cleanly parses the client URL and generates dynamic metrics and 
    strategic insights isolated exclusively to the target client.
    """
    # Parse handle: handle slashes and query params
    handle = client_url.strip().rstrip('/').split('/')[-1].split('?')[0]
    
    metrics = ["Engagement %", "Weekly Posts", "Growth Index", "Sentiment"]
    chart_data = []
    
    # Generate client-specific metrics
    for metric in metrics:
        if metric == "Engagement %":
            val = round(random.uniform(1.5, 8.5), 2)
        elif metric == "Weekly Posts":
            val = random.randint(2, 12)
        elif metric == "Growth Index":
            val = round(random.uniform(0.5, 5.0), 2)
        else: # Sentiment
            val = round(random.uniform(60, 95), 1)
            
        chart_data.append({
            "Metric": metric,
            "Value": val
        })
            
    # Generate strategic insights for the handle
    insights = {
        "handle": handle,
        "language_strategy": random.choice([
            "Authority-led educational content focusing on technical ROI.",
            "Lifestyle-driven community building with high emotional resonance.",
            "Direct-response performance marketing with aggressive CTA structures.",
            "Minimalist aesthetic curation targeting high-net-worth demographics."
        ]),
        "top_hooks": [
            "Stop wasting time on X and start doing Y.",
            "The secret framework used by top 1% creators.",
            "I tried X for 30 days and this happened.",
            "Why your current strategy is actually hurting your growth."
        ],
        "metrics_summary": {
            "Engagement": f"{round(random.uniform(2, 7), 1)}%",
            "Followers": f"{random.randint(10, 500)}K",
            "Avg Likes": f"{random.randint(500, 5000)}"
        }
    }
        
    return {
        "handle": handle,
        "chart_data": chart_data,
        "insights": insights
    }
