// Loaded into the HR mobile app (/hrms) by the after_request hook. hrms itself is untouched.
(() => {
	if (window.__nexlifyHrms) return
	window.__nexlifyHrms = true

	const nativeFetch = window.fetch.bind(window)
	const PROJECTS_API = "/api/method/nexlify_hr.api.checkin_projects"
	const LAST_KEY = "nexlify_last_project"

	const isArabic = () => (window.frappe?.boot?.lang || "").startsWith("ar")
	const t = (key, n) =>
		({
			title: ["Select project", "اختر المشروع"],
			count: [`${n} projects`, `${n} مشروع`],
			search: ["Search by name or code", "ابحث بالاسم أو الكود"],
			last: ["Last used", "آخر اختيار"],
			required: ["Select a project to check in", "يجب اختيار مشروع لتسجيل الحضور"],
			empty: ["No active projects", "لا توجد مشاريع نشطة"],
			noMatch: ["No matching projects", "لا توجد نتائج مطابقة"],
		})[key][isArabic() ? 1 : 0]

	// 1) The app saves a check-in with POST frappe.client.insert -> catch it before it leaves
	window.fetch = function (input, init) {
		const payload = checkinPayload(input, init)
		if (!payload) return nativeFetch(input, init)

		return pickProject().then(
			(project) => {
				if (!project) return errorResponse(t("required"))
				payload.doc.project = project
				return nativeFetch(input, { ...init, body: JSON.stringify(payload) })
			},
			(err) => errorResponse(err?.message || t("required"))
		)
	}

	function checkinPayload(input, init) {
		const url = typeof input === "string" ? input : input?.url || ""
		if (!url.endsWith("/api/method/frappe.client.insert") || typeof init?.body !== "string") return null
		try {
			const payload = JSON.parse(init.body)
			const doc = payload?.doc
			return doc?.doctype === "Employee Checkin" && doc.log_type === "IN" && !doc.project ? payload : null
		} catch (e) {
			return null
		}
	}

	// frappe-ui reads this like a server error, so the app shows the message in its own toast
	function errorResponse(message) {
		const body = { exc_type: "ValidationError", _server_messages: JSON.stringify([JSON.stringify({ message })]) }
		return new Response(JSON.stringify(body), { status: 417, headers: { "Content-Type": "application/json" } })
	}

	// 2) Project picker
	const CSS = `
	#nexlify-project-picker{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;
		background:rgba(17,24,39,0);transition:background .2s ease;font-family:inherit;-webkit-tap-highlight-color:transparent}
	#nexlify-project-picker.nx-open{background:rgba(17,24,39,.5)}
	#nexlify-project-picker *{box-sizing:border-box;font-family:inherit}
	.nx-sheet{background:#fff;width:100%;max-width:520px;max-height:82vh;display:flex;flex-direction:column;
		border-radius:20px 20px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.12);transform:translateY(100%);
		transition:transform .24s cubic-bezier(.2,.8,.2,1);padding-bottom:env(safe-area-inset-bottom)}
	.nx-open .nx-sheet{transform:translateY(0)}
	.nx-grab{width:40px;height:4px;border-radius:4px;background:#e5e7eb;margin:10px auto 4px}
	.nx-head{display:flex;align-items:center;gap:12px;padding:8px 20px 12px}
	.nx-title{font-size:18px;font-weight:700;color:#111827;line-height:1.3}
	.nx-sub{font-size:13px;color:#6b7280;margin-top:2px}
	.nx-close{margin-inline-start:auto;width:34px;height:34px;border-radius:50%;border:0;background:#f3f4f6;color:#374151;
		display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
	.nx-search{position:relative;margin:0 20px 8px}
	.nx-search svg{position:absolute;top:50%;inset-inline-start:12px;transform:translateY(-50%);color:#9ca3af}
	.nx-search input{width:100%;height:44px;border:1px solid transparent;border-radius:12px;background:#f3f4f6;
		padding:0 14px;padding-inline-start:40px;font-size:16px;color:#111827;outline:none}
	.nx-search input:focus{background:#fff;border-color:#d1d5db}
	.nx-list{overflow-y:auto;flex:1;min-height:0;padding:4px 12px 16px;overscroll-behavior:contain}
	.nx-row{display:flex;align-items:center;gap:12px;width:100%;padding:10px 8px;border:0;border-radius:12px;
		background:transparent;text-align:start;cursor:pointer}
	.nx-row:active,.nx-row:hover{background:#f3f4f6}
	.nx-avatar{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;
		font-weight:700;font-size:16px;flex:none}
	.nx-info{min-width:0;flex:1}
	.nx-name{font-size:15px;font-weight:600;color:#111827;line-height:1.35;overflow-wrap:anywhere}
	.nx-code{font-size:12px;color:#6b7280;margin-top:2px}
	.nx-badge{font-size:11px;font-weight:600;color:#047857;background:#ecfdf5;padding:3px 8px;border-radius:999px;flex:none}
	.nx-empty{padding:32px 16px;text-align:center;color:#6b7280;font-size:14px}`

	const SEARCH_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
		stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`
	const CLOSE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
		stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`

	function avatarColors(text) {
		let h = 0
		for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360
		return `background:hsl(${h} 70% 94%);color:hsl(${h} 55% 35%)`
	}

	async function pickProject() {
		const res = await nativeFetch(PROJECTS_API, { headers: { Accept: "application/json" } })
		if (!res.ok) throw new Error(`Could not load projects (${res.status})`)
		const projects = (await res.json()).message || []

		const last = storage(LAST_KEY)
		projects.sort((a, b) => (b.name === last) - (a.name === last)) // last used on top

		if (!document.getElementById("nexlify-picker-css")) {
			const style = document.createElement("style")
			style.id = "nexlify-picker-css"
			style.textContent = CSS
			document.head.append(style)
		}

		return new Promise((resolve) => {
			// Ionic keeps focus inside its open modal, which would block typing in our search box
			const modals = [...document.querySelectorAll("ion-modal:not(.ion-disable-focus-trap)")]
			modals.forEach((m) => m.classList.add("ion-disable-focus-trap"))

			const root = document.createElement("div")
			root.id = "nexlify-project-picker"
			root.dir = isArabic() ? "rtl" : "ltr"
			root.innerHTML = `
				<div class="nx-sheet" role="dialog" aria-modal="true">
					<div class="nx-grab"></div>
					<div class="nx-head">
						<div>
							<div class="nx-title">${t("title")}</div>
							<div class="nx-sub">${t("count", projects.length)}</div>
						</div>
						<button type="button" class="nx-close" data-cancel aria-label="close">${CLOSE_ICON}</button>
					</div>
					${projects.length > 5 ? `<div class="nx-search">${SEARCH_ICON}
						<input data-search type="search" autocomplete="off" placeholder="${t("search")}"></div>` : ""}
					<div class="nx-list" data-list></div>
				</div>`

			const list = root.querySelector("[data-list]")
			let closed = false
			const done = (value) => {
				if (closed) return
				closed = true
				document.removeEventListener("keydown", onKey)
				root.classList.remove("nx-open")
				modals.forEach((m) => m.classList.remove("ion-disable-focus-trap"))
				setTimeout(() => root.remove(), 220)
				resolve(value)
			}
			const onKey = (e) => e.key === "Escape" && done(null)

			const render = (q = "") => {
				list.replaceChildren()
				const needle = q.trim().toLowerCase()
				const rows = projects.filter((p) => `${p.project_name} ${p.name}`.toLowerCase().includes(needle))
				if (!rows.length) {
					const empty = document.createElement("div")
					empty.className = "nx-empty"
					empty.textContent = projects.length ? t("noMatch") : t("empty")
					list.append(empty)
					return
				}
				for (const p of rows) {
					const title = p.project_name || p.name
					const row = document.createElement("button")
					row.type = "button"
					row.className = "nx-row"

					const avatar = document.createElement("div")
					avatar.className = "nx-avatar"
					avatar.style.cssText = avatarColors(title)
					avatar.textContent = title.trim().charAt(0).toUpperCase()

					const info = document.createElement("div")
					info.className = "nx-info"
					const name = document.createElement("div")
					name.className = "nx-name"
					name.textContent = title
					const code = document.createElement("div")
					code.className = "nx-code"
					code.textContent = p.name
					info.append(name, code)
					row.append(avatar, info)

					if (p.name === last) {
						const badge = document.createElement("span")
						badge.className = "nx-badge"
						badge.textContent = t("last")
						row.append(badge)
					}

					row.onclick = () => {
						storage(LAST_KEY, p.name)
						done(p.name)
					}
					list.append(row)
				}
			}

			root.querySelector("[data-search]")?.addEventListener("input", (e) => render(e.target.value))
			root.querySelector("[data-cancel]").onclick = () => done(null)
			root.addEventListener("click", (e) => e.target === root && done(null))
			document.addEventListener("keydown", onKey)

			render()
			document.body.append(root)
			requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("nx-open")))
		})
	}

	function storage(key, value) {
		try {
			if (value === undefined) return localStorage.getItem(key)
			localStorage.setItem(key, value)
		} catch (e) {
			return null
		}
	}
})()

// 3) Check-in history list: show the project on every row
;(() => {
	if (window.__nexlifyCheckinList) return
	window.__nexlifyCheckinList = true

	const prevFetch = window.fetch
	const docs = [] // rows in the same order the list shows them

	window.fetch = function (input, init) {
		const params = listParams(input, init)
		if (!params) return prevFetch(input, init)

		for (const f of ["project", "project_name"]) if (!params.fields.includes(f)) params.fields.push(f)
		return prevFetch(input, { ...init, body: JSON.stringify(params) }).then((res) => {
			res.clone().json().then((r) => {
				const data = r?.message
				if (!params.start) docs.length = 0
				for (const v of data?.values || []) docs.push(Object.fromEntries(data.keys.map((k, i) => [k, v[i]])))
				schedule()
			}).catch(() => {})
			return res
		})
	}

	function listParams(input, init) {
		const url = typeof input === "string" ? input : input?.url || ""
		if (!url.endsWith("/api/method/frappe.desk.reportview.get") || typeof init?.body !== "string") return null
		try {
			const p = JSON.parse(init.body)
			return p?.doctype === "Employee Checkin" && Array.isArray(p.fields) ? p : null
		} catch (e) {
			return null
		}
	}

	let timer
	const schedule = () => {
		clearTimeout(timer)
		timer = setTimeout(decorate, 50)
	}

	// detail sheet that opens when a row is tapped
	const ar = () => (window.frappe?.boot?.lang || "").startsWith("ar")
	function decorateSheet() {
		const box = document.querySelector("ion-modal .flex.flex-col.items-center.justify-center.gap-5")
		if (!box || !box.firstElementChild) return
		const id = box.firstElementChild.children[1]?.textContent.trim()
		const doc = docs.find((d) => d.name === id)
		box.querySelectorAll(".nx-sheet-row").forEach((r) => r.dataset.id !== id && r.remove())
		if (!doc?.project || box.querySelector(".nx-sheet-row")) return
		const rows = [
			[ar() ? "المشروع" : "Project", doc.project],
			[ar() ? "اسم المشروع" : "Project Name", doc.project_name],
		]
		for (const [label, value] of rows) {
			if (!value) continue
			const row = document.createElement("div")
			row.className = "nx-sheet-row flex w-full flex-row items-center justify-between"
			row.dataset.id = id
			row.style.gap = "16px"
			const l = document.createElement("div")
			l.className = "text-gray-600 text-base"
			l.style.flex = "none"
			l.textContent = label
			const v = document.createElement("div")
			v.className = "text-gray-900 text-base"
			v.style.cssText = "text-align:end;overflow-wrap:anywhere"
			v.textContent = value
			row.append(l, v)
			box.append(row)
		}
	}

	function decorate() {
		decorateSheet()
		if (!location.pathname.replace(/\/$/, "").endsWith("/employee-checkins")) return
		const rows = document.querySelectorAll(".ion-page:not(.ion-page-hidden) .p-3\\.5.border-b.cursor-pointer")
		rows.forEach((row, i) => {
			const col = row.querySelector(".flex.flex-col.items-start")
			if (!col) return
			const doc = docs[i]
			const text = doc?.project ? (doc.project_name ? `${doc.project_name} · ${doc.project}` : doc.project) : ""
			let el = col.querySelector(".nx-proj")
			if (!text) return el?.remove()
			if (!el) {
				el = document.createElement("div")
				el.className = "nx-proj"
				el.style.cssText = "font-size:12px;font-weight:500;color:#374151;overflow-wrap:anywhere"
				col.append(el)
			}
			if (el.textContent !== text) el.textContent = text
		})
	}

	new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true })
})()
