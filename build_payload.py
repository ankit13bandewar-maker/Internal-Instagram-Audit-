import re
import html

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
        
    # Remove the basic encapsulation since we are using an iframe
    css_content = css_content.replace('body {', 'body { margin: 0; padding: 0; ')
    
    # Read JS
    with open(js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()
        
    # Add iframe auto-resizer to the JS payload
    iframe_resizer_js = """
// IFRAME RESIZER LOGIC
document.addEventListener("DOMContentLoaded", function() {
    const observer = new ResizeObserver(() => {
        window.parent.postMessage({ type: 'audit-resize', height: document.documentElement.scrollHeight + 20 }, '*');
    });
    observer.observe(document.body);
    
    // Also trigger on click/interactions just in case
    document.body.addEventListener("click", () => {
        setTimeout(() => {
            window.parent.postMessage({ type: 'audit-resize', height: document.documentElement.scrollHeight + 20 }, '*');
        }, 100);
    });
});
"""
    js_content += "\n" + iframe_resizer_js
                 
    # Assemble inner HTML for the iframe
    inner_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
{css_content}
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="audit-dashboard-root-wrapper" style="background: #0A0A0E; margin: 0; padding: 0; overflow-x: hidden;">
{body_inner}
<script>
{js_content}
</script>
</body>
</html>
"""
    
    # Escape the inner HTML for the srcdoc attribute
    escaped_inner_html = html.escape(inner_html)
    
    # Assemble the final WordPress widget wrapper
    final_output = f"""
<!-- 
  ==============================================================
  INSTAGRAM AUDIT DASHBOARD - WORDPRESS/ELEMENTOR READY PAYLOAD
  100% Isolated from Theme CSS via Auto-Resizing Iframe
  ==============================================================
-->

<iframe sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation" 
    id="aura-audit-iframe" 
    srcdoc="{escaped_inner_html}" 
    style="width: 100%; min-height: 800px; border: none; background: #0A0A0E; border-radius: 12px; overflow: hidden;" 
    scrolling="no">
</iframe>

<script>
  window.addEventListener("message", function(e) {{
      if (e.data && e.data.type === "audit-resize") {{
          const iframe = document.getElementById("aura-audit-iframe");
          if (iframe) {{
              iframe.style.height = e.data.height + "px";
          }}
      }}
  }});
</script>
"""
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(final_output.strip())
        
    print("Compilation successful with iframe isolation.")

if __name__ == '__main__':
    main()
