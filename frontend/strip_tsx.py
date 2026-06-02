import re

with open('frontend/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the helper functions block
# Supabase helpers start around line 28 and end before MOCK_PROFILE_DATA
content = re.sub(r'// ─── Supabase helpers.*?// ─── End Supabase helpers ───', '', content, flags=re.DOTALL)
# if they don't have the End comment:
content = re.sub(r'async function supabaseGetCache.*?async function supabaseGetRecent.*?\n}\n', '', content, flags=re.DOTALL)

# 2. Remove states and usage lines
lines = content.split('\n')
out_lines = []
in_supabase_ui_block = False

for line in lines:
    if 'import { createClient } from' in line: continue
    if 'const [supabaseConfigured' in line: continue
    if 'const [cacheEnabled' in line: continue
    if 'const [recentAudits' in line: continue
    if 'const [retrieveLoading' in line: continue
    if 'const [retrieveError' in line: continue
    if 'const [savingToCache' in line: continue
    if 'const [savedToCache' in line: continue
    if 'const [cacheAgeHours' in line: continue
    
    if 'supabaseGetCache(' in line: continue
    if 'supabaseSaveCache(' in line: continue
    if 'supabaseGetRecent(' in line: continue
    if 'setSupabaseConfigured(' in line: continue
    if 'setRecentAudits(' in line: continue
    if 'setRetrieveLoading(' in line: continue
    if 'setRetrieveError(' in line: continue
    if 'setSavingToCache(' in line: continue
    if 'setSavedToCache(' in line: continue
    if 'setCacheAgeHours(' in line: continue
    
    # Strip the Supabase Live pill UI
    if '{supabaseConfigured === null && (' in line:
        in_supabase_ui_block = True
    if '{supabaseConfigured === false && (' in line:
        in_supabase_ui_block = True
    if '{supabaseConfigured === true && (' in line:
        in_supabase_ui_block = True
    
    # Strip the control panel block:
    if 'Database / Caching Controls' in line:
        in_supabase_ui_block = True
    
    # Very crude block removal - better to do it carefully manually
    
    out_lines.append(line)

with open('frontend/app/page.tsx.tmp', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))
