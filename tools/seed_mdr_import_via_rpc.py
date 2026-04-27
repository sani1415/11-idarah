import json
import os
import sys
import urllib.error
import urllib.request

from generate_mdr_import_seed import (
    MADRASAH,
    MOKTOB,
    extract_table,
    kitab_class_from_roll,
    maktab_class_from_name,
)


OLD_MAD_BOOK_CLASS = {
    "2": "kitab_y1",
    "3": "kitab_y2",
    "4": "kitab_y3",
    "5": "kitab_y4",
    "6": "kitab_y5",
    "7": "kitab_y6",
    "8": "kitab_y7",
    "9": "kitab_iyada",
    "10": "kitab_hifz",
}

OLD_MOK_BOOK_CLASS = {
    "1": "maktab_y1",
    "2": "maktab_y2",
    "3": "maktab_y3",
    "4": "maktab_y4",
    "5": "maktab_y5",
}


def as_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def build_payload():
    mad_students = extract_table(MADRASAH, "students")[1]
    mad_books = extract_table(MADRASAH, "books")[1]
    mok_students = extract_table(MOKTOB, "students")[1]
    mok_books = extract_table(MOKTOB, "books")[1]

    candidates = []
    for row in mad_students:
        class_code = kitab_class_from_roll(row.get("rollNumber"))
        candidates.append({
            "source": "madrasah_backup",
            "old_student_id": row.get("id"),
            "name": row.get("name"),
            "guardian_name": row.get("fatherName"),
            "guardian_phone": row.get("mobileNumber"),
            "district": row.get("district"),
            "upazila": row.get("upazila"),
            "division_code": "kitab",
            "class_code": class_code,
            "old_class_name": row.get("class"),
            "old_roll": row.get("rollNumber"),
            "old_status": row.get("status"),
            "old_score": as_int(row.get("current_score")),
            "suggested_is_hifz": class_code == "kitab_hifz",
        })

    for row in mok_students:
        candidates.append({
            "source": "moktob_backup",
            "old_student_id": row.get("id"),
            "name": row.get("name"),
            "guardian_name": row.get("fatherName"),
            "guardian_phone": row.get("mobileNumber"),
            "district": row.get("district"),
            "upazila": row.get("upazila"),
            "division_code": "maktab",
            "class_code": maktab_class_from_name(row.get("class")),
            "old_class_name": row.get("class"),
            "old_roll": row.get("rollNumber"),
            "old_status": row.get("status"),
            "old_score": as_int(row.get("current_score")),
            "suggested_is_hifz": False,
        })

    books = []
    for row in mad_books:
        class_code = OLD_MAD_BOOK_CLASS.get(str(row.get("class_id") or ""))
        if class_code:
            books.append({
                "class_code": class_code,
                "name": row.get("book_name"),
                "total_pages": as_int(row.get("total_pages")),
                "import_source": "madrasah_backup",
                "old_book_id": row.get("id"),
            })

    for row in mok_books:
        class_code = OLD_MOK_BOOK_CLASS.get(str(row.get("class_id") or ""))
        if class_code:
            books.append({
                "class_code": class_code,
                "name": row.get("book_name"),
                "total_pages": as_int(row.get("total_pages")),
                "import_source": "moktob_backup",
                "old_book_id": row.get("id"),
            })

    return candidates, books


def main():
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_PUBLISHABLE_KEY"]
    pin = os.environ.get("MM_ADMIN_PIN", "0000")
    candidates, books = build_payload()

    body = json.dumps({
        "p_pin": pin,
        "p_candidates": candidates,
        "p_books": books,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{url}/rest/v1/rpc/mdr_rel_seed_import_pack",
        data=body,
        headers={
            "apikey": key,
            "authorization": f"Bearer {key}",
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            print(res.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        print(err.read().decode("utf-8"), file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
