import frappe
from frappe import _
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


@frappe.whitelist()
def checkin_projects():
	return frappe.get_all(
		"Project",
		filters={"is_active": "Yes", "status": "Open"},
		fields=["name", "project_name"],
		order_by="name asc",
	)


def make_custom_fields():
	create_custom_fields(
		{
			"Employee Checkin": [
				{
					"fieldname": "project",
					"label": "Project",
					"fieldtype": "Link",
					"options": "Project",
					"insert_after": "log_type",
					"in_list_view": 1,
				},
				{
					"fieldname": "project_name",
					"label": "Project Name",
					"fieldtype": "Data",
					"fetch_from": "project.project_name",
					"read_only": 1,
					"insert_after": "project",
				},
			]
		}
	)


def require_project(doc, method=None):
	# new check-ins only (hrms re-saves old ones in bulk_fetch_shift); biometric logs (device_id) are exempt
	if doc.is_new() and doc.log_type == "IN" and not doc.project and not doc.device_id:
		frappe.throw(_("Project is required for Check In"))


def backfill_project_names():
	frappe.db.sql(
		"""update `tabEmployee Checkin` c join `tabProject` p on p.name = c.project
		set c.project_name = p.project_name where ifnull(c.project, '') != ''"""
	)
