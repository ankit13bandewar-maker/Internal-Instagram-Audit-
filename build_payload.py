import re

def main():
    # Paths
    html_path = 'new-ui-ux-frontend/index.html'
    css_path = 'new-ui-ux-frontend/style.css'
    js_path = 'new-ui-ux-frontend/app.js'
    out_path = 'final-wordpress-code.html'
    
    # Read HTML
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Extract body content
    body_match = re.search(r'<body>(.*?)</body>', html_content, re.DOTALL | re.IGNORECASE)
    if body_match:
        body_inner = body_match.group(1)
        # remove scripts from the extracted body if they are there
        body_inner = re.sub(r'<script.*?>.*?</script>', '', body_inner, flags=re.DOTALL | re.IGNORECASE)
    else:
        body_inner = html_content # fallback
        
    # Read CSS
    with open(css_path, 'r', encoding='utf-8') as f:
        css_content = f.read()
        
    # Replace html/body selectors in CSS with the wrapper class to prevent WP overrides
    # (Just a basic encapsulation helper)
    css_content = css_content.replace('body {', '.audit-dashboard-root-wrapper {')
    
    # Read JS
    with open(js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()
        
    # Update API URL as requested (handle both BACKEND_URL and API_URL variations)
    js_content = re.sub(r'const\s+BACKEND_URL\s*=\s*.*?;\n?', '', js_content)
    js_content = re.sub(r'const\s+API_URL\s*=\s*.*?;\n?', '', js_content)
    # Add it at the top
    js_content = 'const BACKEND_URL = "https://client-audit-tool.onrender.com";\n' + \
                 'const API_URL = "https://client-audit-tool.onrender.com/api/audit";\n' + \
                 js_content
                 
    # Assemble
    final_output = f"""
<!-- 
  ==============================================================
  INSTAGRAM AUDIT DASHBOARD - WORDPRESS/ELEMENTOR READY PAYLOAD
  ==============================================================
-->

<div class="audit-dashboard-root-wrapper">
{body_inner}
</div>

<!-- STYLES -->
<style>
{css_content}
</style>

<!-- CDN DEPENDENCIES -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>

<!-- APPLICATION LOGIC -->
<script>
{js_content}
</script>
"""
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(final_output.strip())
        
    print("Compilation successful.")

if __name__ == '__main__':
    main()
