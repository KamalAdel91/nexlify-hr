import os

import frappe

EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def import_photos(folder, overwrite=0):
    """Attach employee photos from a folder. File name = Employee ID, e.g. 10063.jpg or HR-EMP-00015.png.

    bench --site <site> execute nexlify_hr.photos.import_photos --kwargs "{'folder': '/path/to/photos'}"
    Add 'overwrite': 1 to replace photos that already exist.
    """
    done, skipped, missing = [], [], []
    for fname in sorted(os.listdir(folder)):
        stem, ext = os.path.splitext(fname)
        if ext.lower() not in EXTS:
            continue
        emp = frappe.db.get_value("Employee", stem, ["name", "image"], as_dict=True)
        if not emp:
            missing.append(fname)
            continue
        if emp.image and not int(overwrite):
            skipped.append(stem)
            continue
        with open(os.path.join(folder, fname), "rb") as f:
            content = f.read()
        file_doc = frappe.get_doc({
            "doctype": "File",
            "file_name": f"{stem}{ext.lower()}",
            "attached_to_doctype": "Employee",
            "attached_to_name": stem,
            "attached_to_field": "image",
            "is_private": 0,
            "content": content,
        })
        file_doc.save(ignore_permissions=True)
        frappe.db.set_value("Employee", stem, "image", file_doc.file_url)
        done.append(stem)

    frappe.db.commit()
    print(f"Updated: {len(done)} | Skipped (already has a photo): {len(skipped)} | No matching employee: {len(missing)}")
    if missing:
        print("Not matched:", ", ".join(missing))
