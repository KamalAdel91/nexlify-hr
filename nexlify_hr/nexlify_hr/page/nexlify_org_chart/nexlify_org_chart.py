import frappe
from frappe import _

LIST_FIELDS = [
    "name", "employee_name", "designation", "department", "branch", "image", "reports_to",
    "company", "date_of_joining", "employment_type", "grade",
]
DETAIL_FIELDS = [*LIST_FIELDS, "company_email", "cell_number"]
DEPT_FIELDS = ["name", "department_name", "parent_department", "company", "is_group"]
JOB_FIELDS = ["name", "job_title", "designation", "department", "company", "planned_vacancies", "employment_type"]


def _existing(fields, doctype="Employee"):
    """Keep only fields present on the doctype in this site (e.g. 'grade' comes from HRMS)."""
    meta = frappe.get_meta(doctype)
    return [f for f in fields if f == "name" or meta.has_field(f)]


def _can_read(doctype):
    return frappe.db.exists("DocType", doctype) and frappe.has_permission(doctype, "read")


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

    departments = []
    if _can_read("Department"):
        departments = frappe.get_list(
            "Department",
            filters={"company": company} if company else {},
            fields=_existing(DEPT_FIELDS, "Department"),
            order_by="lft asc",
            limit_page_length=0,
        )

    vacancies = []
    if _can_read("Job Opening"):
        job_filters = {"status": "Open"}
        if company:
            job_filters["company"] = company
        vacancies = frappe.get_list(
            "Job Opening",
            filters=job_filters,
            fields=_existing(JOB_FIELDS, "Job Opening"),
            order_by="creation asc",
            limit_page_length=0,
        )

    # employees on approved leave today (only ids already visible in this chart)
    on_leave = []
    if employees and frappe.db.exists("DocType", "Leave Application"):
        today = frappe.utils.today()
        on_leave = frappe.get_all(
            "Leave Application",
            filters={
                "employee": ["in", [e.name for e in employees]],
                "docstatus": 1,
                "status": "Approved",
                "from_date": ["<=", today],
                "to_date": [">=", today],
            },
            pluck="employee",
        )

    # colors chosen in Nexlify HR Settings
    company_colors = {}
    if frappe.db.exists("DocType", "Nexlify HR Company Color"):
        for r in frappe.get_all(
            "Nexlify HR Company Color",
            filters={"parent": "Nexlify HR Settings", "parenttype": "Nexlify HR Settings"},
            fields=["company", "color"],
        ):
            if r.company and r.color:
                company_colors[r.company] = r.color

    # Stable color slot per company (creation order), only for companies the user can already see
    present = {e.company for e in employees} | {d.get("company") for d in departments if d.get("company")}
    order = frappe.get_all("Company", pluck="name", order_by="creation asc")
    company_index = {c: i for i, c in enumerate(order) if c in present}

    return {
        "employees": employees,
        "departments": departments,
        "vacancies": vacancies,
        "company_index": company_index,
        "on_leave": sorted(set(on_leave)),
        "company_colors": company_colors,
    }


@frappe.whitelist()
def get_employee_card(employee):
    """Full profile: read permission checked, permlevel-restricted fields stripped server-side."""
    doc = frappe.get_doc("Employee", employee)
    doc.check_permission("read")
    doc.apply_fieldlevel_read_permissions()
    return {f: doc.get(f) for f in _existing(DETAIL_FIELDS)}


@frappe.whitelist(methods=["POST"])
def set_reports_to(employee, reports_to=None):
    """Edit Mode drop: change the manager. Write permission + loop check; full save so Employee validations run."""
    doc = frappe.get_doc("Employee", employee)
    doc.check_permission("write")
    reports_to = reports_to or None

    if reports_to:
        if reports_to == employee:
            frappe.throw(_("An employee cannot report to themselves"))
        seen, p = set(), reports_to
        while p and p not in seen:
            if p == employee:
                frappe.throw(_("Cannot move an employee under one of their own team members"))
            seen.add(p)
            p = frappe.db.get_value("Employee", p, "reports_to")

    doc.reports_to = reports_to
    doc.save()
    return doc.reports_to
