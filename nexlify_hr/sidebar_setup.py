import frappe


ORG_CHART_PAGE = "nexlify-org-chart"
ORG_CHART_LABEL = "Group Org Chart"


def ensure_hr_org_chart():
	"""Adds Group Org Chart to the HR Setup sidebar, right after HRMS's Organizational Chart.
	Runs after every migrate, so it survives HRMS re-syncing its standard sidebar. Safe to run again."""
	doctype = next(
		(d for d in ("Sidebar", "Workspace Sidebar") if frappe.db.table_exists(d) and frappe.db.exists(d, "HR Setup")),
		None,
	)
	if not doctype:
		return
	doc = frappe.get_doc(doctype, "HR Setup")
	if any(i.type == "Link" and i.link_to == ORG_CHART_PAGE for i in doc.items):
		return

	items = list(doc.items)
	pos = next((n + 1 for n, i in enumerate(items) if i.link_to == "organizational-chart"), None)
	if pos is None:
		pos = next((n for n, i in enumerate(items) if i.type == "Section Break"), len(items))

	row = doc.append(
		"items",
		{"type": "Link", "label": ORG_CHART_LABEL, "link_type": "Page", "link_to": ORG_CHART_PAGE, "icon": "network", "child": 0, "open_in_new_tab": 0},
	)
	doc.items.remove(row)
	doc.items.insert(pos, row)
	for n, i in enumerate(doc.items, 1):
		i.idx = n

	doc.flags.ignore_permissions = True
	# HR Setup belongs to HRMS: never export it to HRMS's JSON files when developer_mode is on
	in_import = frappe.flags.in_import
	frappe.flags.in_import = True
	try:
		doc.save()
	finally:
		frappe.flags.in_import = in_import
