import frappe
from frappe import _
from frappe.model.document import Document


class NexlifyHRSettings(Document):
	def validate(self):
		seen = set()
		for row in self.company_colors:
			if row.company in seen:
				frappe.throw(_("Row {0}: {1} is listed more than once").format(row.idx, row.company))
			seen.add(row.company)


# same palette and order the Org Chart uses by default
DEFAULT_COLORS = ["#1D9E75", "#7F77DD", "#D85A30", "#378ADD", "#D4537E", "#BA7517", "#639922", "#888780"]


def seed_company_colors(only_if_empty=False):
	"""Fill Company Colors with the chart's current default colors (company creation order).
	Rows that already exist are kept as they are."""
	doc = frappe.get_single("Nexlify HR Settings")
	if only_if_empty and doc.company_colors:
		return
	have = {r.company for r in doc.company_colors}
	companies = frappe.get_all("Company", pluck="name", order_by="creation asc")
	added = 0
	for i, company in enumerate(companies):
		if company in have:
			continue
		doc.append("company_colors", {"company": company, "color": DEFAULT_COLORS[i % len(DEFAULT_COLORS)]})
		added += 1
	if added:
		doc.save(ignore_permissions=True)
		frappe.db.commit()
	print(f"Company colors added: {added}")


def seed_on_migrate():
	seed_company_colors(only_if_empty=True)
