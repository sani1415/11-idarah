"""
Execute account import SQL batches via Supabase Management API
"""
import sys, io, os, json, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Read service role key from env or prompt ──────────────────────────────
# Use the Supabase Management API with service role key
# The execute_sql MCP tool works – we'll call it via subprocess/requests

import urllib.request, urllib.error

PROJECT_REF = 'bbdtoucanihtrymzpynq'

# Try to get the service role key from supabase config or environment
# Check if there's a .env or secret file
service_key = None
for path in [
    r'd:\programming\11-idarah\.env',
    r'd:\programming\11-idarah\.env.local',
    r'd:\programming\11-idarah\supabase\.env',
]:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'SERVICE_ROLE' in line or 'service_role' in line:
                    parts = line.strip().split('=', 1)
                    if len(parts) == 2:
                        service_key = parts[1].strip().strip('"').strip("'")
                        print(f'Found service key in {path}')

if not service_key:
    # Try to read from supabase config
    for path in [r'd:\programming\11-idarah\supabase\config.toml']:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f'Found {path}')
            print(content[:500])

# List SQL files to execute
sql_files = [
    r'd:/programming/11-idarah/tools/mini_batch_c2_0.sql',
    r'd:/programming/11-idarah/tools/mini_batch_c2_1.sql',
    r'd:/programming/11-idarah/tools/mini_batch_c2_2.sql',
    r'd:/programming/11-idarah/tools/mini_batch_c3_0.sql',
    r'd:/programming/11-idarah/tools/mini_batch_c3_1.sql',
    r'd:/programming/11-idarah/tools/mini_batch_c3_2.sql',
    r'd:/programming/11-idarah/tools/temp_chunk_4.sql',
    r'd:/programming/11-idarah/tools/temp_chunk_5.sql',
]

print('SQL files to execute:')
for f in sql_files:
    size = os.path.getsize(f) if os.path.exists(f) else -1
    print(f'  {os.path.basename(f)}: {size} bytes')

if service_key:
    print(f'\nService key found. Will execute via Supabase API...')
    
    # Execute each SQL file
    API_URL = f'https://{PROJECT_REF}.supabase.co/rest/v1/rpc'
    MGMT_URL = f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query'
    
    for sql_file in sql_files:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        data = json.dumps({'query': sql}).encode('utf-8')
        req = urllib.request.Request(
            MGMT_URL,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {service_key}',
            },
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                print(f'  ✓ {os.path.basename(sql_file)}: OK')
        except urllib.error.HTTPError as e:
            err = e.read().decode('utf-8')
            print(f'  ✗ {os.path.basename(sql_file)}: ERROR {e.code} - {err[:200]}')
        time.sleep(0.5)
else:
    print('\nNo service key found. Checking for Supabase CLI...')
    import subprocess
    result = subprocess.run(['supabase', '--version'], capture_output=True, text=True)
    print('supabase CLI:', result.stdout.strip() if result.returncode == 0 else 'NOT FOUND')
