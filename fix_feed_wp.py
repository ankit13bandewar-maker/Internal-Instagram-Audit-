import re

with open("final-wordpress-code.html", "r", encoding="utf-8") as f:
    content = f.read()

# We need to find the specific return block in renderPostsFeedAndDeepDive
start_str = "      return \n        <div class=\"\" data-post-index=\"\">"
# Let's locate the index of start_str
start_idx = content.find(start_str)
if start_idx == -1:
    print("Could not find start_str")
else:
    # Find the end of the template literal
    end_idx = content.find("      ;\n    }).join('');", start_idx)
    if end_idx == -1:
        print("Could not find end_idx")
    else:
        new_block = '''      return 
        <div class="post-row " data-post-index="" style="display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:9px; cursor:pointer;">
          <div class="er up" style="width: 24px; text-align: center; font-family: var(--font-d); font-weight: 600; font-size: 12px; color: var(--pos);"></div>
          <div class="post-lk" style="width: 18px; height: 18px; border-radius: 5px; background: var(--surf3); display: grid; place-items: center; color: var(--faint); font-size: 9px;"></div>
          <div class="pn" style="font-size: 12.5px; color: var(--muted); flex: 1; display: flex; align-items: center; gap: 6px;">
            <div style="display:flex; flex-direction:column; gap:4px; flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:8px;">
                <strong style="color:var(--text); font-size:13px;">Post </strong>
                
                <span style="color:var(--faint);font-weight:500;font-size:11px;">&middot; </span>
              </div>
              <div style="font-size:11.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 300px;">
                
              </div>
            </div>
          </div>
          <div class="likes" style="font-family: var(--font-d); font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 4px; color: var(--muted);">
            <span style="color: var(--neg);">? </span> 
            <a href="" target="_blank" style="color:var(--accent);text-decoration:none;margin-left:8px;display:inline-flex;align-items:center;" title="View Live Post" onclick="event.stopPropagation()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>'''
        
        # We need to include the exact       ; at the end
        new_content = content[:start_idx] + new_block + "\n" + content[end_idx:]
        
        with open("final-wordpress-code.html", "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully replaced feed block.")
