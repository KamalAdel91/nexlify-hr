import frappe

LIST_FIELDS = [
    "name", "employee_name", "designation", "department", "branch", "image", "reports_to",
    "company", "date_of_joining", "employment_type", "grade",
]
DETAIL_FIELDS = [*LIST_FIELDS, "company_email", "cell_number"]


def _existing(fields):
    """Keep only fields present on Employee in this site (e.g. 'grade' comes from HRMS)."""
    meta = frappe.get_meta("Employee")
    return [f for f in fields if f == "name" or meta.has_field(f)]


@frappe.whitelist()
def get_org_data(company=None):
    filters = {"status": "Active"}
    if company:
        filters["company"] = company

    employees = frappe.get_list(
        "Employee",
        filters=filters,
        fields=_existing(LIST_FIELDS),
        order_by="employee_name asc",
        limit_page_length=0,
    )

    # Stable color slot per company (creation order), returned only for companies the user can already see
    present = {e.company for e in employees}
    order = frappe.get_all("Company", pluck="name", order_by="creation asc")
    company_index = {c: i for i, c in enumerate(order) if c in present}

    return {"employees": employees, "company_index": company_index}


@frappe.whitelist()
def get_employee_card(employee):
    """Full profile: read permission checked, permlevel-restricted fields stripped server-side."""
    doc = frappe.get_doc("Employee", employee)
    doc.check_permission("read")
    doc.apply_fieldlevel_read_permissions()
    return {f: doc.get(f) for f in _existing(DETAIL_FIELDS)}
