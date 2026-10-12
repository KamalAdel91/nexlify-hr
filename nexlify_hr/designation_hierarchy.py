import frappe
from frappe import _
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def ensure_parent_designation():
	"""Adds Parent Designation to Designation, used by the Designations view of the Group Org Chart.
	Runs after every migrate; safe to run again."""
	create_custom_fields(
		{
			"Designation": [
				{
					"fieldname": "parent_designation",
					"label": "Parent Designation",
					"fieldtype": "Link",
					"options": "Designation",
					"insert_after": "designation_name",
					"description": "The designation this one sits under in the organization structure",
				}
			]
		},
		update=True,
	)


def validate_parent_designation(doc, method=None):
	"""No designation under itself, and no loops (A under B under A)."""
	parent = doc.get("parent_designation")
	if not parent:
		return
	if parent == doc.name:
		frappe.throw(_("A designation cannot be its own parent"))

	seen, p = {doc.name}, parent
	while p:
		if p in seen:
			frappe.throw(
				_("{0} is already under {1}, so it cannot be its parent").format(
					frappe.bold(parent), frappe.bold(doc.name)
				)
			)
		seen.add(p)
		p = frappe.db.get_value("Designation", p, "parent_designation")
