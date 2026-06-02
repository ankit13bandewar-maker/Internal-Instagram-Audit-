import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the import
content = re.sub(r'^import supabase_service.*\n', '', content, flags=re.MULTILINE)

def remove_blocks(text, marker):
    lines = text.split('\n')
    out = []
    skip_indent = -1
    for line in lines:
        stripped = line.lstrip()
        indent = len(line) - len(stripped)
        
        if skip_indent != -1:
            if stripped == '' or indent > skip_indent:
                continue
            else:
                skip_indent = -1
                
        if stripped.startswith(marker):
            skip_indent = indent
            continue
            
        out.append(line)
    return '\n'.join(out)

content = remove_blocks(content, 'if db.is_supabase_configured():')

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
