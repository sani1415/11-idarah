"""
Tamirat expense fix — re-import from updated Excel
(format changed: col A now Hijri month, col B now Hijri day)
"""
import openpyxl, sys, io, unicodedata
from datetime import date, datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

EXCEL_PATH = r'C:\Users\sanim\Downloads\মাতবাখ-মাদরাসা-৪৭-৪৮.xlsx'

def nfc(s):
    return unicodedata.normalize('NFC', str(s)).replace('\u200c','').replace('\u200d','').strip()

def str_val(v):
    if v is None: return None
    s = nfc(str(v)).strip()
    return s if s else None

def num_val(v):
    if v is None: return None
    try:
        f = float(str(v).replace(',',''))
        return f if f != 0 else None
    except: return None

MONTH_ALIAS = {
    'রামাযান':'রমজান','রমাযান':'রমজান','রমযান':'রমজান','রামজান':'রমজান',
    'যিলকদ':'জিলকদ','যিলক্বদ':'জিলকদ','যুলকদ':'জিলকদ',
    'জিলকাদ':'জিলকদ','জিলক্বদ':'জিলকদ','জুলকদ':'জিলকদ',
    'যিলহাজ':'জিলহজ','যিলহজ':'জিলহজ','যুলহজ':'জিলহজ',
    'জিলহাজ':'জিলহজ','জুলহজ':'জিলহজ',
    'মুহার্‌রম':'মুহাররম','মুহার্রম':'মুহাররম',
    'রজব':'রজব','শাবান':'শাবান','শাওয়াল':'শাওয়াল',
    'সফর':'সফর','মুহাররম':'মুহাররম',
    'রমজান':'রমজান','জিলকদ':'জিলকদ','জিলহজ':'জিলহজ',
}
MONTH_NUM = {
    'মুহাররম':1,'সফর':2,'রবিউল আউয়াল':3,'রবিউস সানি':4,
    'জুমাদাল উলা':5,'জুমাদাল উখরা':6,'রজব':7,'শাবান':8,
    'রমজান':9,'শাওয়াল':10,'জিলকদ':11,'জিলহজ':12,
}
_ALIAS_NFC = {nfc(k): v for k, v in MONTH_ALIAS.items()}
_NUM_NFC   = {nfc(k): v for k, v in MONTH_NUM.items()}

def norm_month(m):
    if not m: return None
    s = nfc(str(m).strip()).rstrip(':;।')
    if s in _ALIAS_NFC: return _ALIAS_NFC[s]
    if s in _NUM_NFC: return s
    return None

def hijri_year(month_name):
    n = MONTH_NUM.get(month_name, 0)
    return '1447' if n >= 9 else '1448'

def to_en_digits(s):
    if s is None:
        return ''
    out = []
    for ch in str(s).strip():
        if '\u09e6' <= ch <= '\u09ef':
            out.append(str(ord(ch) - ord('\u09e6')))
        elif '\u0660' <= ch <= '\u0669':
            out.append(str(ord(ch) - ord('\u0660')))
        elif '\u06f0' <= ch <= '\u06f9':
            out.append(str(ord(ch) - ord('\u06f0')))
        elif ch.isdigit():
            out.append(ch)
    return ''.join(out)

def parse_hijri_day_cell(v):
    if v is None or v == '':
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        try:
            i = int(v)
            return i if 1 <= i <= 30 else None
        except (ValueError, TypeError, OverflowError):
            return None
    raw = nfc(str(v).strip())
    if not raw:
        return None
    for sep in ['/', '-', '।']:
        if sep in raw:
            bits = [b.strip() for b in raw.replace('।', '.').split(sep) if str(b).strip()]
            for b in reversed(bits):
                s2 = to_en_digits(b)
                if not s2 or len(s2) > 2:
                    continue
                try:
                    i = int(s2)
                    if 1 <= i <= 30:
                        return i
                except ValueError:
                    pass
    s = to_en_digits(raw)
    if not s:
        return None
    try:
        i = int(s)
        if 1 <= i <= 30:
            return i
    except ValueError:
        pass
    return None

_counter = [10000]
def gen_id(prefix):
    _counter[0] += 1
    return f"{prefix}{_counter[0]:05d}"

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
ws = wb['তামীরাত-খরচ']

rows = []
skipped = 0
for rno, row in enumerate(ws.iter_rows(min_row=5, values_only=True), start=5):
    month_raw = str_val(row[0])
    day_raw   = row[1]
    project   = str_val(row[2])
    desc      = str_val(row[3])
    qty       = num_val(row[4])
    unit      = str_val(row[5])
    unit_price= num_val(row[6])
    amount    = num_val(row[7])
    supplier  = str_val(row[9])

    if not amount:
        skipped += 1
        continue
    month = norm_month(month_raw)
    if not month:
        print(f"  SKIP row {rno}: unrecognized month {month_raw!r}")
        skipped += 1
        continue
    day = parse_hijri_day_cell(day_raw)

    rows.append({
        'id': gen_id('exp-tm-'),
        'account': 'tamirat',
        'hijri_year': hijri_year(month),
        'month': month,
        'day': day,
        'description': desc or '',
        'category': project,
        'quantity': qty,
        'unit': unit,
        'unit_price': unit_price,
        'amount': amount,
        'supplier': supplier,
        'source_row': rno,
    })

print(f"Found {len(rows)} tamirat expense rows (skipped {skipped})")
print("\nSample rows:")
for r in rows[:5]:
    print(f"  {r['month']} {r['day']} | {r['description'][:30]:30} | {r['amount']:>10} | {r['supplier']}")
print("...")
for r in rows[-3:]:
    print(f"  {r['month']} {r['day']} | {r['description'][:30]:30} | {r['amount']:>10} | {r['supplier']}")

# Month summary
from collections import Counter
mc = Counter(r['month'] for r in rows)
print("\nMonth breakdown:", dict(mc))
print("Total amount:", sum(r['amount'] for r in rows))

# Generate SQL
def q(v):
    if v is None: return 'NULL'
    return "'" + str(v).replace("'","''") + "'"

out = []
out.append('-- তামীরাত-খরচ re-import (Hijri date format fix)')
out.append('-- Step 1: delete old tamirat expenses')
out.append("DELETE FROM public.mdr_account_expenses WHERE account = 'tamirat';")
out.append('')

cols = '(id, account, hijri_year, month, day, description, category, quantity, unit, unit_price, amount, supplier, source_sheet, source_row)'

def nullable(v):
    return 'NULL' if v is None else str(v)

BATCH = 100
for b in range(0, len(rows), BATCH):
    batch = rows[b:b+BATCH]
    vals = []
    for r in batch:
        vals.append(
            f"({q(r['id'])},'tamirat',{q(r['hijri_year'])},{q(r['month'])},"
            f"{nullable(r['day'])},"
            f"{q(r['description'])},{q(r['category'])},"
            f"{nullable(r['quantity'])},"
            f"{q(r['unit'])},"
            f"{nullable(r['unit_price'])},"
            f"{r['amount']},{q(r['supplier'])},"
            f"{q('তামীরাত-খরচ')},{r['source_row']})"
        )
    out.append(f"INSERT INTO public.mdr_account_expenses {cols} VALUES")
    out.append(',\n'.join(vals) + ';')
    out.append('')

out.append('-- Verify')
out.append("SELECT account, month, count(*), sum(amount) FROM mdr_account_expenses WHERE account='tamirat' GROUP BY account, month ORDER BY month;")

sql = '\n'.join(out)
with open('tools/tamirat_fix.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print(f"\nSQL written to tools/tamirat_fix.sql ({len(rows)} rows)")
