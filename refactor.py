import re

def process_css(content):
    # 1. Inject variables into :root
    if '--h1-size' not in content:
        root_vars = '''
  /* Typography System */
  --h1-size: 24px;
  --h1-weight: 600;
  --h1-lh: 1.3;
  --h1-ls: -0.01em;

  --h2-size: 14px;
  --h2-weight: 500;
  --h2-lh: 1.4;
  --h2-ls: 0em;
'''
        content = re.sub(r'(--font-b:[^;]+;)', r'\1\n' + root_vars, content)

    # 2. Refactor .tb-title h1
    content = re.sub(
        r'\.tb-title h1\s*\{[^}]+\}',
        r'''.tb-title h1 {
  font-family: var(--font-d);
  font-weight: var(--h1-weight);
  font-size: var(--h1-size);
  line-height: var(--h1-lh);
  letter-spacing: var(--h1-ls);
  margin: 0;
}''',
        content
    )

    # 3. Refactor .sec-head .n
    content = re.sub(
        r'\.sec-head \.n\s*\{[^}]+\}',
        r'''.sec-head .n {
  font-family: var(--font-d);
  font-weight: var(--h1-weight);
  font-size: var(--h1-size);
  line-height: var(--h1-lh);
  letter-spacing: var(--h1-ls);
  display: flex;
  align-items: center;
  gap: 10px;
}''',
        content
    )

    # 4. Refactor .card-h .t
    content = re.sub(
        r'\.card-h \.t\s*\{[^}]+\}',
        r'''.card-h .t {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-b);
  font-weight: var(--h2-weight);
  font-size: var(--h2-size);
  line-height: var(--h2-lh);
  letter-spacing: var(--h2-ls);
  margin: 0;
  padding: 0;
}''',
        content
    )

    # 5. Refactor .card-sub
    content = re.sub(
        r'\.card-sub\s*\{[^}]+\}',
        r'''.card-sub {
  font-family: var(--font-b);
  font-weight: var(--h2-weight);
  font-size: var(--h2-size);
  line-height: var(--h2-lh);
  letter-spacing: var(--h2-ls);
  color: var(--muted);
  margin: -8px 0 16px;
  padding: 0;
}''',
        content
    )
    
    # 6. Refactor .state-title if present
    content = re.sub(
        r'\.state-title\s*\{[^}]+\}',
        r'''.state-title {
  font-family: var(--font-d);
  font-weight: var(--h1-weight);
  font-size: var(--h1-size);
  line-height: var(--h1-lh);
  letter-spacing: var(--h1-ls);
  margin: 0;
}''',
        content
    )
    
    # Also add .main-title just in case
    if '.main-title {' not in content:
        content += '''
.main-title {
  font-family: var(--font-d);
  font-weight: var(--h1-weight);
  font-size: var(--h1-size);
  line-height: var(--h1-lh);
  letter-spacing: var(--h1-ls);
  margin: 0;
}
'''
    return content

# Process style.css
with open("new-ui-ux-frontend/style.css", "r", encoding="utf-8") as f:
    css_content = f.read()

new_css = process_css(css_content)
with open("new-ui-ux-frontend/style.css", "w", encoding="utf-8") as f:
    f.write(new_css)

# Process final-wordpress-code.html
with open("final-wordpress-code.html", "r", encoding="utf-8") as f:
    html_content = f.read()

new_html = process_css(html_content)
with open("final-wordpress-code.html", "w", encoding="utf-8") as f:
    f.write(new_html)

print("Refactored typography successfully.")
