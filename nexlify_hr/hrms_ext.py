import os

import frappe

SCRIPT = "public/js/hrms_ext.js"


def inject(response, request):
	"""after_request hook: add our script to the HR mobile app page (/hrms)."""
	if request.path != "/hrms" and not request.path.startswith("/hrms/"):
		return
	if not response or response.status_code != 200 or response.mimetype != "text/html":
		return

	html = response.get_data(as_text=True)
	if "</head>" not in html or "nexlify_hr/js/hrms_ext.js" in html:
		return

	version = int(os.path.getmtime(frappe.get_app_path("nexlify_hr", SCRIPT)))
	tag = f'<script src="/assets/nexlify_hr/js/hrms_ext.js?v={version}"></script>'
	response.set_data(html.replace("</head>", f"{tag}</head>", 1))
