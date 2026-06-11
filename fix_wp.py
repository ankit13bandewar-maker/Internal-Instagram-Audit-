import re

with open("final-wordpress-code.html", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Best/Worst Stats colors
# Current: <span style="color:red"> likes</span> A <span style="color:lightblue"> comments</span>
content = re.sub(
    r'<span style="color:red">\$\{\(bestPost\.likes \|\| 0\)\.toLocaleString\(\)\} likes</span>[^<]+<span style="color:lightblue">\$\{\(bestPost\.comments \|\| 0\)\.toLocaleString\(\)\} comments</span>',
    r' likes &middot;  comments',
    content
)

content = re.sub(
    r'<span style="color:red">\$\{\(worstPost\.likes \|\| 0\)\.toLocaleString\(\)\} likes</span>[^<]+<span style="color:lightblue">\$\{\(worstPost\.comments \|\| 0\)\.toLocaleString\(\)\} comments</span>',
    r' likes &middot;  comments',
    content
)

# Fix 2: Best/Worst Links
content = re.sub(
    r'if\s*\(\s*bestLinkEl\s*\)\s*bestLinkEl\.innerHTML\s*=\s*<a href="\$\{resolvePostUrl\(bestPost\)\}"[^>]+>\$\{resolvePostUrl\(bestPost\)\}</a>;',
    r'''if (bestLinkEl) bestLinkEl.innerHTML = <a href="" target="_blank" style="display:inline-flex;align-items:center;color:var(--accent);text-decoration:none;font-weight:600;font-size:12px;">View Live Post <span class="post-link-btn" style="margin-left: 6px; display:grid; place-items:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></a>;''',
    content
)

content = re.sub(
    r'if\s*\(\s*worstLinkEl\s*\)\s*worstLinkEl\.innerHTML\s*=\s*<a href="\$\{resolvePostUrl\(worstPost\)\}"[^>]+>\$\{resolvePostUrl\(worstPost\)\}</a>;',
    r'''if (worstLinkEl) worstLinkEl.innerHTML = <a href="" target="_blank" style="display:inline-flex;align-items:center;color:var(--accent);text-decoration:none;font-weight:600;font-size:12px;">View Live Post <span class="post-link-btn" style="margin-left: 6px; display:grid; place-items:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></a>;''',
    content
)

# Wait, the search output from final-wordpress-code.html showed it was using: if (bestPostUrlEl) bestPostUrlEl.textContent = resolvePostUrl(bestPost);
# Let's fix that too just in case.
content = content.replace(
    "if (bestPostUrlEl) bestPostUrlEl.textContent = resolvePostUrl(bestPost);",
    "if (bestPostUrlEl) bestPostUrlEl.innerHTML = <a href=\"\" target=\"_blank\" style=\"color:var(--accent);text-decoration:none;\">View Live Post <svg width=\"10\" height=\"10\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"margin-left:4px;\"><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path><polyline points=\"15 3 21 3 21 9\"></polyline><line x1=\"10\" y1=\"14\" x2=\"21\" y2=\"3\"></line></svg></a>;"
)
content = content.replace(
    "if (worstPostUrlEl) worstPostUrlEl.textContent = resolvePostUrl(worstPost);",
    "if (worstPostUrlEl) worstPostUrlEl.innerHTML = <a href=\"\" target=\"_blank\" style=\"color:var(--accent);text-decoration:none;\">View Live Post <svg width=\"10\" height=\"10\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"margin-left:4px;\"><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path><polyline points=\"15 3 21 3 21 9\"></polyline><line x1=\"10\" y1=\"14\" x2=\"21\" y2=\"3\"></line></svg></a>;"
)

# Fix 3: Feed likes rendering
# Replace the red likes section in the feed:
content = re.sub(
    r'<span style="color: red; font-weight: 600;">\$\{\(post\.likes \|\| 0\)\.toLocaleString\(\)\}</span>',
    r'<span style="color: var(--text); font-weight: 600;"></span>',
    content
)
content = re.sub(
    r'<span style="color: red;">[??] </span>',
    r'<span style="color: var(--neg);">? </span>',
    content
)

# Replace the feed links raw url rendering to View Live Post with icon
content = re.sub(
    r'<a href="\$\{resolvePostUrl\(post\)\}" target="_blank" style="color:var\(--aura-accent\);text-decoration:none;font-size:11px;display:inline-flex;align-items:center;margin-top:6px;" title="View Live Post" onclick="event\.stopPropagation\(\)">\s*\$\{resolvePostUrl\(post\)\}\s*</a>',
    r'''<a href="" target="_blank" style="color:var(--accent);text-decoration:none;font-size:11px;display:inline-flex;align-items:center;margin-top:6px;" title="View Live Post" onclick="event.stopPropagation()">View Live Post<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>''',
    content
)

with open("final-wordpress-code.html", "w", encoding="utf-8") as f:
    f.write(content)

print("Applied fixes.")
