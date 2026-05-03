import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "migrations" / "017_mdr_import_seed.sql"

MADRASAH = ROOT / "idarahco_madrasah (1).sql"
MOKTOB = ROOT / "idarahco_moktob (2).sql"


def parse_values(sql):
    rows = []
    row = None
    val = []
    in_quote = False
    escaped = False
    i = 0
    while i < len(sql):
        ch = sql[i]
        if row is None:
            if ch == "(":
                row = []
                val = []
            i += 1
            continue
        if in_quote:
            if escaped:
                val.append(ch)
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == "'":
                in_quote = False
            else:
                val.append(ch)
        else:
            if ch == "'":
                in_quote = True
            elif ch == ",":
                raw = "".join(val).strip()
                row.append(None if raw.upper() == "NULL" else raw)
                val = []
            elif ch == ")":
                raw = "".join(val).strip()
                row.append(None if raw.upper() == "NULL" else raw)
                rows.append(row)
                row = None
                val = []
            else:
                val.append(ch)
        i += 1
    return rows


def extract_table(path, table):
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"INSERT INTO `" + re.escape(table) + r"` \(([^)]*)\) VALUES\s*(.*?);", re.S)
    cols = None
    rows = []
    for match in pattern.finditer(text):
        cols = [c.strip().strip("`") for c in match.group(1).split(",")]
        rows.extend(parse_values(match.group(2)))
    return cols or [], [dict(zip(cols, row)) for row in rows]


BN_DIGITS = {chr(0x09E6 + i): str(i) for i in range(10)}


def first_digit(value):
    for ch in str(value or ""):
        if ch in BN_DIGITS:
            return BN_DIGITS[ch]
        if ch.isdigit():
            return ch
    return ""


def kitab_class_from_roll(roll):
    r = str(roll or "").strip()
    if r.startswith("ই"):
        return "kitab_iyada"
    if r.startswith("হ"):
        r = r[1:]
    digit = first_digit(r)
    return {
        "1": "kitab_y1",
        "2": "kitab_y2",
        "3": "kitab_y3",
        "4": "kitab_y4",
        "5": "kitab_y5",
        "6": "kitab_y6",
        "7": "kitab_y7",
    }.get(digit, "kitab_y1")


def maktab_class_from_name(name):
    return {
        "প্রথম শ্রেণি": "maktab_y1",
        "দ্বিতীয় শ্রেণি": "maktab_y2",
        "তৃতীয় শ্রেণি": "maktab_y3",
        "চতুর্থ শ্রেণি": "maktab_y4",
        "পঞ্চম শ্রেণি": "maktab_y5",
    }.get(str(name or "").strip(), "maktab_y1")


def sql_str(value):
    if value is None or value == "":
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_int(value):
    try:
        return str(int(value))
    except (TypeError, ValueError):
        return "null"


def candidate_values(row, source, division_code, class_code):
    old_status = row.get("status")
    return "(" + ", ".join(
        [
            sql_str(source),
            sql_str(row.get("id")),
            sql_str(row.get("name")),
            sql_str(row.get("fatherName")),
            sql_str(row.get("mobileNumber")),
            sql_str(row.get("district")),
            sql_str(row.get("upazila")),
            sql_str(division_code),
            sql_str(class_code),
            sql_str(row.get("class")),
            sql_str(row.get("rollNumber")),
            sql_str(old_status),
            sql_int(row.get("current_score")),
            "true" if str(row.get("rollNumber") or "").strip().startswith("হ") else "false",
        ]
    ) + ")"


def book_values(row, source, class_code):
    return "(" + ", ".join(
        [
            sql_str(class_code),
            sql_str(row.get("book_name")),
            sql_int(row.get("total_pages")),
            sql_str(source),
            sql_str(row.get("id")),
        ]
    ) + ")"


def main():
    mad_students = extract_table(MADRASAH, "students")[1]
    mad_books = extract_table(MADRASAH, "books")[1]
    mok_students = extract_table(MOKTOB, "students")[1]
    mok_books = extract_table(MOKTOB, "books")[1]

    old_mad_book_class = {
        "2": "kitab_y1",
        "3": "kitab_y2",
        "4": "kitab_y3",
        "5": "kitab_y4",
        "6": "kitab_y5",
        "7": "kitab_y6",
        "8": "kitab_y7",
        "9": "kitab_iyada",
    }
    old_mok_book_class = {
        "1": "maktab_y1",
        "2": "maktab_y2",
        "3": "maktab_y3",
        "4": "maktab_y4",
        "5": "maktab_y5",
    }

    candidates = []
    for row in mad_students:
        candidates.append(candidate_values(row, "madrasah_backup", "kitab", kitab_class_from_roll(row.get("rollNumber"))))
    for row in mok_students:
        candidates.append(candidate_values(row, "moktob_backup", "maktab", maktab_class_from_name(row.get("class"))))

    books = []
    for row in mad_books:
        class_code = old_mad_book_class.get(str(row.get("class_id") or ""))
        if class_code:
            books.append(book_values(row, "madrasah_backup", class_code))
    for row in mok_books:
        class_code = old_mok_book_class.get(str(row.get("class_id") or ""))
        if class_code:
            books.append(book_values(row, "moktob_backup", class_code))

    lines = [
        "-- 017_mdr_import_seed.sql",
        "-- Seed import candidates and books from the old Madrasa/Moktob backups.",
        "-- Permanent student IDs are intentionally not inserted here.",
        "",
        "insert into public.mdr_student_import_candidates (",
        "  source, old_student_id, name, guardian_name, guardian_phone, district, upazila,",
        "  division_code, class_code, old_class_name, old_roll, old_status, old_score, suggested_is_hifz",
        ") values",
        ",\n".join(candidates),
        "on conflict (source, old_student_id) do nothing;",
        "",
        "insert into public.mdr_books (class_id, name, total_pages, import_source, old_book_id)",
        "select c.id, v.name, v.total_pages, v.import_source, v.old_book_id",
        "from (values",
        ",\n".join(books),
        ") as v(class_code, name, total_pages, import_source, old_book_id)",
        "join public.mdr_classes c on c.code = v.class_code",
        "where not exists (",
        "  select 1 from public.mdr_books b",
        "  where b.import_source = v.import_source and b.old_book_id = v.old_book_id",
        ");",
        "",
    ]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print({"candidates": len(candidates), "books": len(books), "output": str(OUT)})


if __name__ == "__main__":
    main()
