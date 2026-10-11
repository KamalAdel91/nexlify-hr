"""Business Flow panels at the top of the HRMS workspaces.

Each HRMS workspace gets one Custom HTML Block ("Nexlify Flow ...") as its first block, in place
of the stock HRMS onboarding card. The block itself is a thin mount point: the drawing lives in
public/js/hr_flow.js and the steps live in FLOWS below, so everything is versioned in git.

Edit FLOWS to change a flow. A step is:
	label     what the step is called
	hint      one sentence shown when the step is selected
	doctype   the record the step is about (its count decides "in use")
	filters   optional: only count these records as "in use"
	pending   optional: {"label", "filters", "doctype"?} records that need someone's action
	optional  optional steps don't count towards the progress
	new       False hides the "New ..." button (e.g. a step that is a view of another doctype)
	cta       label of the main button
	report    a query report to open instead of a list (no count)
	workspace a workspace to open (used by the HR Setup lifecycle)
"""

import json

import frappe
from frappe import _

BLOCK_PREFIX = "Nexlify Flow"

# Replace the stock HRMS onboarding card with the flow (same position: first block)
REPLACE_HRMS_ONBOARDING = True

FLOWS = {
	"hr_setup": {
		"workspace": "HR Setup",
		"onboarding": "HR Onboarding",
		"color": "#1D9E75",
		"title": "Employee lifecycle",
		"steps": [
			{
				"label": "Employees",
				"icon": "users",
				"doctype": "Employee",
				"pending": {"label": "active", "filters": {"status": "Active"}, "tone": "info"},
				"hint": "Everyone on the payroll and their company, department, designation and manager.",
				"cta": "New Employee",
			},
			{
				"label": "Recruitment",
				"icon": "search",
				"workspace": "Recruitment",
				"doctype": "Job Opening",
				"pending": {"label": "to screen", "doctype": "Job Applicant", "filters": {"status": "Open"}},
				"hint": "Open jobs, applicants, interviews and offers.",
			},
			{
				"label": "Tenure",
				"icon": "user-check",
				"workspace": "Tenure",
				"doctype": "Employee Onboarding",
				"pending": {
					"label": "in progress",
					"filters": {"boarding_status": ["in", ["Pending", "In Process"]]},
				},
				"hint": "Joining tasks for new hires, training, and exit tasks when someone leaves.",
			},
			{
				"label": "Shift & Attendance",
				"icon": "clock",
				"workspace": "Shift & Attendance",
				"doctype": "Attendance",
				"pending": {"label": "to approve", "doctype": "Attendance Request", "filters": {"docstatus": 0}},
				"hint": "Shifts, check-ins and the daily attendance record.",
			},
			{
				"label": "Leaves",
				"icon": "sun",
				"workspace": "Leaves",
				"doctype": "Leave Allocation",
				"pending": {
					"label": "to approve",
					"doctype": "Leave Application",
					"filters": {"status": "Open", "docstatus": 0},
				},
				"hint": "Holidays, leave types, allocations and leave requests.",
			},
			{
				"label": "Expenses",
				"icon": "receipt",
				"workspace": "Expenses",
				"doctype": "Expense Claim",
				"pending": {"label": "to approve", "filters": {"approval_status": "Draft", "docstatus": 0}},
				"hint": "Advances, expense claims and paying employees back.",
			},
			{
				"label": "Payroll",
				"icon": "wallet",
				"workspace": "Payroll",
				"doctype": "Payroll Entry",
				"pending": {"label": "in draft", "filters": {"docstatus": 0}},
				"hint": "Salary structures, payroll runs and salary slips.",
			},
			{
				"label": "Tax & Benefits",
				"icon": "percent",
				"workspace": "Tax & Benefits",
				"doctype": "Employee Tax Exemption Declaration",
				"optional": 1,
				"pending": {"label": "in draft", "filters": {"docstatus": 0}},
				"hint": "Income tax slabs, exemptions, flexible benefits and gratuity.",
			},
			{
				"label": "Performance",
				"icon": "star",
				"workspace": "Performance",
				"doctype": "Appraisal Cycle",
				"pending": {"label": "in draft", "doctype": "Appraisal", "filters": {"docstatus": 0}},
				"hint": "Key result areas, appraisal cycles, appraisals and feedback.",
			},
		],
	},
	"recruitment": {
		"workspace": "Recruitment",
		"onboarding": "Recruitment Onboarding",
		"color": "#378ADD",
		"title": "Hire an employee",
		"steps": [
			{
				"label": "Job Opening",
				"icon": "briefcase",
				"doctype": "Job Opening",
				"pending": {"label": "open", "filters": {"status": "Open"}, "tone": "info"},
				"hint": "The vacancy: designation, department, number of positions and salary range.",
				"cta": "Open a job",
			},
			{
				"label": "Job Applicant",
				"icon": "users",
				"doctype": "Job Applicant",
				"pending": {"label": "to screen", "filters": {"status": "Open"}},
				"hint": "Each candidate who applied, with their CV and source.",
				"cta": "Add an applicant",
			},
			{
				"label": "Interview",
				"icon": "message",
				"doctype": "Interview",
				"optional": 1,
				"pending": {"label": "to conclude", "filters": {"status": ["in", ["Pending", "Under Review"]]}},
				"hint": "Interview rounds, interviewers and their feedback.",
				"cta": "Schedule an interview",
			},
			{
				"label": "Job Offer",
				"icon": "file-check",
				"doctype": "Job Offer",
				"pending": {"label": "awaiting reply", "filters": {"status": "Awaiting Response"}},
				"hint": "The offer sent to the chosen candidate and whether they accepted.",
				"cta": "Make an offer",
			},
			{
				"label": "Appointment Letter",
				"icon": "file",
				"doctype": "Appointment Letter",
				"optional": 1,
				"hint": "The letter confirming the appointment once the offer is accepted.",
				"cta": "Write a letter",
			},
			{
				"label": "Recruitment Analytics",
				"icon": "chart",
				"report": "Recruitment Analytics",
				"optional": 1,
				"hint": "Openings, applicants and offers for each designation in a staffing plan.",
			},
		],
	},
	"tenure": {
		"workspace": "Tenure",
		"onboarding": "Tenure Onboarding",
		"color": "#7F77DD",
		"title": "Welcome and see off employees",
		"steps": [
			{
				"label": "Onboarding Template",
				"icon": "list-check",
				"doctype": "Employee Onboarding Template",
				"optional": 1,
				"hint": "The joining checklist reused for every new hire of a department or designation.",
				"cta": "Write a checklist",
			},
			{
				"label": "Employee Onboarding",
				"icon": "user-plus",
				"doctype": "Employee Onboarding",
				"pending": {
					"label": "in progress",
					"filters": {"boarding_status": ["in", ["Pending", "In Process"]]},
				},
				"hint": "The joining tasks for one new employee. Submit it once they are done.",
				"cta": "Start onboarding",
			},
			{
				"label": "Training Program",
				"icon": "book",
				"doctype": "Training Program",
				"optional": 1,
				"hint": "A course you run more than once, with its trainer and content.",
				"cta": "Plan a program",
			},
			{
				"label": "Training Event",
				"icon": "calendar",
				"doctype": "Training Event",
				"optional": 1,
				"pending": {"label": "scheduled", "filters": {"event_status": "Scheduled"}, "tone": "info"},
				"hint": "One session of a program: date, place and who attends.",
				"cta": "Schedule a training",
			},
			{
				"label": "Employee Separation",
				"icon": "user-minus",
				"doctype": "Employee Separation",
				"pending": {
					"label": "in progress",
					"filters": {"boarding_status": ["in", ["Pending", "In Process"]]},
				},
				"hint": "The exit tasks when someone leaves: handover, assets, clearance.",
				"cta": "Handle an exit",
			},
			{
				"label": "Employee Analytics",
				"icon": "chart",
				"report": "Employee Analytics",
				"optional": 1,
				"hint": "Your workforce by branch, department, designation and grade.",
			},
		],
	},
	"shift_attendance": {
		"workspace": "Shift & Attendance",
		"onboarding": "Shift and Attendance Onboarding",
		"color": "#0E8A9C",
		"title": "Track attendance and shifts",
		"steps": [
			{
				"label": "Shift Type",
				"icon": "clock",
				"doctype": "Shift Type",
				"hint": "Working hours, grace periods and the rules that turn check-ins into attendance.",
				"cta": "Define a shift",
			},
			{
				"label": "Shift Assignment",
				"icon": "user-check",
				"doctype": "Shift Assignment",
				"pending": {"label": "active", "filters": {"status": "Active", "docstatus": 1}, "tone": "info"},
				"hint": "Puts an employee on a shift from a date.",
				"cta": "Assign a shift",
			},
			{
				"label": "Employee Checkin",
				"icon": "fingerprint",
				"doctype": "Employee Checkin",
				"optional": 1,
				"hint": "Each IN and OUT punch, from a device, the mobile app or entered by hand.",
				"cta": "Record a check-in",
			},
			{
				"label": "Attendance",
				"icon": "calendar-check",
				"doctype": "Attendance",
				"hint": "The day's status for an employee: present, absent, half day or on leave.",
				"cta": "Mark attendance",
			},
			{
				"label": "Attendance Request",
				"icon": "inbox",
				"doctype": "Attendance Request",
				"optional": 1,
				"pending": {"label": "to approve", "filters": {"docstatus": 0}},
				"hint": "An employee asks to be marked present for days they worked away or forgot to check in.",
				"cta": "Request attendance",
			},
			{
				"label": "Monthly Attendance Sheet",
				"icon": "chart",
				"report": "Monthly Attendance Sheet",
				"optional": 1,
				"hint": "Everyone's attendance for the month on one sheet.",
			},
		],
	},
	"leaves": {
		"workspace": "Leaves",
		"onboarding": "Leaves Onboarding",
		"color": "#639922",
		"title": "Manage time off",
		"steps": [
			{
				"label": "Holiday List",
				"icon": "calendar",
				"doctype": "Holiday List",
				"hint": "Weekly offs and public holidays for the year.",
				"cta": "Set your holidays",
			},
			{
				"label": "Leave Type",
				"icon": "tag",
				"doctype": "Leave Type",
				"hint": "Annual, sick, unpaid: how each kind of leave behaves.",
				"cta": "Add a leave type",
			},
			{
				"label": "Leave Policy",
				"icon": "layers",
				"doctype": "Leave Policy",
				"optional": 1,
				"hint": "Bundles leave types and their yearly days, to allocate them in one go.",
				"cta": "Create a policy",
			},
			{
				"label": "Leave Allocation",
				"icon": "gift",
				"doctype": "Leave Allocation",
				"hint": "The days an employee can take of a leave type in a period.",
				"cta": "Allocate leave",
			},
			{
				"label": "Leave Application",
				"icon": "send",
				"doctype": "Leave Application",
				"pending": {"label": "to approve", "filters": {"status": "Open", "docstatus": 0}},
				"hint": "An employee's request for days off, approved or rejected by the leave approver.",
				"cta": "Apply for leave",
			},
			{
				"label": "Leave Balance",
				"icon": "chart",
				"report": "Employee Leave Balance",
				"optional": 1,
				"hint": "Opening, allocated, taken and remaining days for each employee.",
			},
		],
	},
	"expenses": {
		"workspace": "Expenses",
		"onboarding": "Expenses Onboarding",
		"color": "#BA7517",
		"title": "Settle employee expenses",
		"steps": [
			{
				"label": "Employee Advance",
				"icon": "hand-coins",
				"doctype": "Employee Advance",
				"optional": 1,
				"pending": {"label": "to pay", "filters": {"status": "Unpaid", "docstatus": 1}},
				"hint": "Money paid before the expense, settled later against the claim.",
				"cta": "Give an advance",
			},
			{
				"label": "Expense Claim",
				"icon": "receipt",
				"doctype": "Expense Claim",
				"pending": {"label": "to approve", "filters": {"approval_status": "Draft", "docstatus": 0}},
				"hint": "What the employee spent, with receipts, for the expense approver to approve.",
				"cta": "Claim an expense",
			},
			{
				"label": "Pay Back",
				"icon": "wallet",
				"doctype": "Expense Claim",
				"filters": {"status": "Paid"},
				"new": 0,
				"pending": {"label": "unpaid", "filters": {"status": "Unpaid", "docstatus": 1}},
				"hint": "Approved claims waiting for payment. Make the Payment Entry from the claim.",
				"cta": "See unpaid claims",
			},
			{
				"label": "Travel Request",
				"icon": "plane",
				"doctype": "Travel Request",
				"optional": 1,
				"hint": "A work trip: purpose, itinerary and the costs to fund.",
				"cta": "Plan a trip",
			},
			{
				"label": "Unpaid Expense Claim",
				"icon": "chart",
				"report": "Unpaid Expense Claim",
				"optional": 1,
				"hint": "What is still owed to each employee.",
			},
		],
	},
	"payroll": {
		"workspace": "Payroll",
		"onboarding": "Payroll Onboarding",
		"color": "#D85A30",
		"title": "Run payroll",
		"steps": [
			{
				"label": "Salary Component",
				"icon": "puzzle",
				"doctype": "Salary Component",
				"hint": "Basic, allowances, deductions: each line that can appear on a salary slip.",
				"cta": "Add a component",
			},
			{
				"label": "Salary Structure",
				"icon": "layers",
				"doctype": "Salary Structure",
				"hint": "The earnings and deductions that make up a salary, and how each is calculated.",
				"cta": "Build a structure",
			},
			{
				"label": "Structure Assignment",
				"icon": "user-check",
				"doctype": "Salary Structure Assignment",
				"hint": "Gives an employee a structure and a base from a date.",
				"cta": "Assign a structure",
			},
			{
				"label": "Payroll Entry",
				"icon": "play",
				"doctype": "Payroll Entry",
				"pending": {"label": "in draft", "filters": {"docstatus": 0}},
				"hint": "Creates the salary slips for a period and books the payroll.",
				"cta": "Run payroll",
			},
			{
				"label": "Additional Salary",
				"icon": "plus-circle",
				"doctype": "Additional Salary",
				"optional": 1,
				"hint": "A one-off amount: bonus, overtime or a deduction for one payroll.",
				"cta": "Add a one-off amount",
			},
			{
				"label": "Salary Register",
				"icon": "chart",
				"report": "Salary Register",
				"optional": 1,
				"hint": "Every salary slip of a period, component by component.",
			},
		],
	},
	"tax_benefits": {
		"workspace": "Tax & Benefits",
		"onboarding": "Tax and Benefits Onboarding",
		"color": "#D4537E",
		"title": "Deduct the right tax",
		"steps": [
			{
				"label": "Payroll Period",
				"icon": "calendar",
				"doctype": "Payroll Period",
				"hint": "The financial year that tax is calculated over.",
				"cta": "Create a period",
			},
			{
				"label": "Income Tax Slab",
				"icon": "percent",
				"doctype": "Income Tax Slab",
				"hint": "The tax brackets and rates for a period.",
				"cta": "Add tax slabs",
			},
			{
				"label": "Exemption Declaration",
				"icon": "file-text",
				"doctype": "Employee Tax Exemption Declaration",
				"pending": {"label": "in draft", "filters": {"docstatus": 0}},
				"hint": "What an employee expects to claim as exempt this period.",
				"cta": "Declare exemptions",
			},
			{
				"label": "Exemption Proof",
				"icon": "file-check",
				"doctype": "Employee Tax Exemption Proof Submission",
				"optional": 1,
				"pending": {"label": "in draft", "filters": {"docstatus": 0}},
				"hint": "The documents that back the declaration.",
				"cta": "Submit proof",
			},
			{
				"label": "Benefit Application",
				"icon": "gift",
				"doctype": "Employee Benefit Application",
				"optional": 1,
				"hint": "How an employee splits their flexible benefits.",
				"cta": "Choose benefits",
			},
			{
				"label": "Gratuity Rule",
				"icon": "scale",
				"doctype": "Gratuity Rule",
				"optional": 1,
				"hint": "How end-of-service gratuity is calculated from years worked.",
				"cta": "Set a rule",
			},
			{
				"label": "Income Tax Computation",
				"icon": "chart",
				"report": "Income Tax Computation",
				"optional": 1,
				"hint": "Each employee's taxable income and tax for the period.",
			},
		],
	},
	"performance": {
		"workspace": "Performance",
		"onboarding": "Performance Onboarding",
		"color": "#9A4DCC",
		"title": "Review performance",
		"steps": [
			{
				"label": "Key Result Area",
				"icon": "target",
				"doctype": "KRA",
				"hint": "An area a role is measured on, such as quality or customer satisfaction.",
				"cta": "Add a KRA",
			},
			{
				"label": "Appraisal Template",
				"icon": "layout",
				"doctype": "Appraisal Template",
				"hint": "The KRAs and rating criteria with their weights, reused across appraisals.",
				"cta": "Build a template",
			},
			{
				"label": "Appraisal Cycle",
				"icon": "refresh",
				"doctype": "Appraisal Cycle",
				"pending": {"label": "running", "filters": {"status": "In Progress"}, "tone": "info"},
				"hint": "The review period, and the employees and templates in it.",
				"cta": "Start a cycle",
			},
			{
				"label": "Appraisal",
				"icon": "star",
				"doctype": "Appraisal",
				"pending": {"label": "in draft", "filters": {"docstatus": 0}},
				"hint": "One employee's goals, ratings and final score in a cycle.",
				"cta": "Appraise an employee",
			},
			{
				"label": "Performance Feedback",
				"icon": "message",
				"doctype": "Employee Performance Feedback",
				"optional": 1,
				"hint": "Feedback from a reviewer during the cycle.",
				"cta": "Give feedback",
			},
			{
				"label": "Appraisal Overview",
				"icon": "chart",
				"report": "Appraisal Overview",
				"optional": 1,
				"hint": "Compare scores across a cycle.",
			},
		],
	},
}


# ---------------------------------------------------------------------------------------------
# Data for the panel
# ---------------------------------------------------------------------------------------------


@frappe.whitelist()
def get_flow(flow: str):
	"""The flow's steps with live counts. Counts respect the user's permissions, and a step the
	user can't read comes back with count None so the panel shows it as locked."""
	config = FLOWS.get(flow)
	if not config:
		frappe.throw(_("Unknown flow: {0}").format(flow))

	steps = []
	for step in config["steps"]:
		out = {
			"label": _(step["label"]),
			"hint": _(step.get("hint") or ""),
			"icon": step.get("icon") or "circle",
			"optional": bool(step.get("optional")),
			"cta": _(step["cta"]) if step.get("cta") else None,
			"doctype": step.get("doctype"),
			"report": step.get("report"),
			"workspace": step.get("workspace"),
			"filters": step.get("filters") or {},
			"can_create": False,
			"count": None,
			"pending": None,
		}

		doctype = step.get("doctype")
		if doctype and frappe.db.exists("DocType", doctype):
			out["count"] = _count(doctype, step.get("filters"))
			out["can_create"] = bool(step.get("new", 1)) and frappe.has_permission(doctype, "create")
			pending = step.get("pending")
			if pending:
				p_doctype = pending.get("doctype") or doctype
				out["pending"] = {
					"label": _(pending["label"]),
					"doctype": p_doctype,
					"filters": pending.get("filters") or {},
					"tone": pending.get("tone") or "warn",
					"count": _count(p_doctype, pending.get("filters")),
				}
		elif step.get("report"):
			out["can_open"] = bool(frappe.db.exists("Report", step["report"])) and bool(
				frappe.get_cached_doc("Report", step["report"]).is_permitted()
			)

		steps.append(out)

	return {"title": _(config["title"]), "color": config["color"], "steps": steps}


def _count(doctype, filters=None):
	"""Same count the list view shows (frappe.desk.reportview.get_count), with permissions."""
	if not frappe.has_permission(doctype, "read"):
		return None
	try:
		from frappe.query_builder.functions import Count

		try:
			from frappe.model.qb_query import DatabaseQuery
		except ImportError:
			from frappe.model.db_query import DatabaseQuery

		partial = DatabaseQuery(doctype).execute(
			filters=filters or {}, fields=[f"`tab{doctype}`.name"], order_by=None, run=0
		)
		return frappe.qb.from_(partial).select(Count("*")).run()[0][0]
	except frappe.PermissionError:
		return None
	except Exception:
		frappe.log_error(title=f"Nexlify HR flow count failed: {doctype}")
		return None


# ---------------------------------------------------------------------------------------------
# Placing the panels in the workspaces (after_migrate)
# ---------------------------------------------------------------------------------------------


def block_name(flow):
	return f"{BLOCK_PREFIX} {FLOWS[flow]['workspace'].replace('&', 'and')}"


def _block_script(flow):
	return (
		"(function mount(tries) {\n"
		f"\tif (window.nexlify_hr && nexlify_hr.flow) return nexlify_hr.flow.mount(root_element, {json.dumps(flow)});\n"
		"\tif (tries < 100) setTimeout(() => mount(tries + 1), 100);\n"
		"})(0);\n"
	)


def setup_workspace_flows():
	"""Put each flow first in its HRMS workspace. Runs after every migrate, so it survives HRMS
	re-importing its workspaces. Safe to run again."""
	changed = False
	for flow, config in FLOWS.items():
		workspace = config["workspace"]
		if not frappe.db.exists("Workspace", workspace):
			continue
		name = block_name(flow)
		_ensure_block(name, flow)
		changed |= _place_block("Workspace", workspace, name, config)
		changed |= _ensure_block_row(workspace, name)

		# a site that edited the workspace in the UI shows its saved snapshot instead of the base
		if frappe.db.table_exists("Custom Workspace") and frappe.db.exists("Custom Workspace", workspace):
			changed |= _place_block("Custom Workspace", workspace, name, config)

	if changed:
		frappe.clear_cache()


def _ensure_block(name, flow):
	html = f'<div class="nxf-host" data-flow="{flow}"></div>'
	script = _block_script(flow)
	if frappe.db.exists("Custom HTML Block", name):
		doc = frappe.get_doc("Custom HTML Block", name)
		if doc.html == html and doc.script == script and not doc.private:
			return
		doc.html, doc.script, doc.style, doc.private = html, script, "", 0
		doc.save(ignore_permissions=True)
		return

	doc = frappe.new_doc("Custom HTML Block")
	doc.update({"html": html, "script": script, "style": "", "private": 0})
	doc.insert(ignore_permissions=True, set_name=name)


def _place_block(doctype, workspace, name, config):
	"""Content is written straight to the field: saving the Workspace doc in developer mode would
	export HRMS's workspace into HRMS's own JSON files. `modified` is left alone so HRMS updates
	to the file still import, and this runs again after them."""
	raw = frappe.db.get_value(doctype, workspace, "content")
	if not raw:
		return False
	try:
		content = json.loads(raw)
	except ValueError:
		return False

	if any(b.get("type") == "custom_block" and (b.get("data") or {}).get("custom_block_name") == name for b in content):
		return False

	block = {
		"id": frappe.generate_hash(length=10),
		"type": "custom_block",
		"data": {"custom_block_name": name, "col": 12},
	}
	onboarding_at = next((n for n, b in enumerate(content) if b.get("type") == "onboarding"), None)
	if REPLACE_HRMS_ONBOARDING and onboarding_at is not None:
		content[onboarding_at] = block
		if onboarding_at:
			content.insert(0, content.pop(onboarding_at))
	else:
		content.insert(0, block)

	frappe.db.set_value(doctype, workspace, "content", json.dumps(content), update_modified=False)
	return True


def _ensure_block_row(workspace, name):
	if frappe.db.exists(
		"Workspace Custom Block",
		{"parent": workspace, "parenttype": "Workspace", "custom_block_name": name},
	):
		return False
	idx = (
		frappe.db.sql(
			"select max(idx) from `tabWorkspace Custom Block` where parent=%s and parenttype='Workspace'",
			workspace,
		)[0][0]
		or 0
	)
	frappe.get_doc(
		{
			"doctype": "Workspace Custom Block",
			"parent": workspace,
			"parenttype": "Workspace",
			"parentfield": "custom_blocks",
			"custom_block_name": name,
			"label": name,
			"idx": idx + 1,
		}
	).db_insert()
	return True


def remove_workspace_flows():
	"""Takes the flows out again and puts the HRMS onboarding card back (before_uninstall)."""
	for flow, config in FLOWS.items():
		workspace, name = config["workspace"], block_name(flow)
		for doctype in ("Workspace", "Custom Workspace"):
			if not frappe.db.table_exists(doctype) or not frappe.db.exists(doctype, workspace):
				continue
			raw = frappe.db.get_value(doctype, workspace, "content")
			if not raw:
				continue
			content = json.loads(raw)
			kept = []
			for b in content:
				if b.get("type") == "custom_block" and (b.get("data") or {}).get("custom_block_name") == name:
					if config.get("onboarding") and not any(x.get("type") == "onboarding" for x in content):
						kept.append(
							{
								"id": frappe.generate_hash(length=10),
								"type": "onboarding",
								"data": {"onboarding_name": config["onboarding"], "col": 12},
							}
						)
					continue
				kept.append(b)
			if kept != content:
				frappe.db.set_value(doctype, workspace, "content", json.dumps(kept), update_modified=False)
		frappe.db.delete("Workspace Custom Block", {"custom_block_name": name})
		frappe.delete_doc_if_exists("Custom HTML Block", name)
	frappe.clear_cache()
