// Nexlify HR: Business Flow panel at the top of each HRMS workspace.
// Mounted by the "Nexlify Flow ..." Custom HTML Blocks (see nexlify_hr/hr_flows.py), which run
// inside a shadow root, so the stylesheet is linked into that root on mount.

frappe.provide("nexlify_hr.flow");

(function () {
	const CSS_PATH = "/assets/nexlify_hr/css/hr_flow.css";
	const METHOD = "nexlify_hr.hr_flows.get_flow";
	const REFRESH_AFTER_MS = 15000;
	const TOUR_STEP_MS = 3200;

	const ICONS = {
		users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
		"user-check": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
		"user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
		"user-minus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6"/>',
		clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		receipt: '<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
		wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15v-4"/><path d="M17 11h4v6h-4a3 3 0 0 1 0-6Z"/>',
		percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
		star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9Z"/>',
		briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
		message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
		"file-check": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
		"file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
		file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
		chart: '<path d="M3 3v18h18"/><path d="M7 15v-4M12 15V8M17 15v-7"/>',
		"list-check": '<path d="M11 6h10M11 12h10M11 18h10"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
		book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
		calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
		"calendar-check": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
		fingerprint: '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4M14 13.12c0 2.38 0 6.38-1 8.88M17.29 21.02c.12-.6.43-2.3.5-3.02M2 12a10 10 0 0 1 18-6M2 16h.01M21.8 16c.2-2 .13-5.35 0-6M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2M8.65 22c.21-.66.45-1.32.57-2M9 6.8a6 6 0 0 1 9 5.2v2"/>',
		inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/>',
		tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
		layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
		gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
		send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
		"hand-coins": '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><circle cx="16" cy="6" r="3"/>',
		plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z"/>',
		puzzle: '<path d="M19.4 14.9a2.5 2.5 0 1 0 0-5H18V6a2 2 0 0 0-2-2h-3.9V2.6a2.5 2.5 0 1 0-5 0V4H4a2 2 0 0 0-2 2v3.9h1.4a2.5 2.5 0 1 1 0 5H2V18a2 2 0 0 0 2 2h3.9v-1.4a2.5 2.5 0 1 1 5 0V20H16a2 2 0 0 0 2-2v-3.1Z"/>',
		pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
		play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
		"plus-circle": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
		scale: '<path d="M12 3v18M7 21h10M3 7h18"/><path d="m6 7-3 7a3.5 3.5 0 0 0 6 0ZM18 7l-3 7a3.5 3.5 0 0 0 6 0Z"/>',
		target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
		layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
		refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
		circle: '<circle cx="12" cy="12" r="9"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
		chevron: '<path d="m6 9 6 6 6-6"/>',
		plus: '<path d="M12 5v14M5 12h14"/>',
		list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
		open: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
	};

	const icon = (name, cls = "") =>
		`<svg class="nxf-i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
			ICONS[name] || ICONS.circle
		}</svg>`;

	const esc = (v) => frappe.utils.escape_html(v == null ? "" : String(v));
	const fmt = (n) => (n == null ? "" : format_number(n, null, 0));

	const store = {
		get(k) {
			try {
				return localStorage.getItem("nxf:" + k);
			} catch (e) {
				return null;
			}
		},
		set(k, v) {
			try {
				localStorage.setItem("nxf:" + k, v);
			} catch (e) {
				/* storage unavailable: state just isn't remembered */
			}
		},
	};

	class FlowPanel {
		constructor(root, flow) {
			this.root = root;
			this.flow = flow;
			this.host = root.querySelector(".nxf-host") || root.appendChild(document.createElement("div"));
			this.selected = 0;
			this.collapsed = store.get("collapsed:" + flow) === "1";
			this.loaded_at = 0;
			this.timer = null;
			this.link_stylesheet();
			this.host.innerHTML = `<div class="nxf nxf-loading"><div class="nxf-skel"></div></div>`;
			this.load();
			this.watch_route();
		}

		link_stylesheet() {
			if (this.root.querySelector("link[data-nxf]")) return;
			const global = document.querySelector(`link[href*="${CSS_PATH}"]`);
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = global ? global.getAttribute("href") : CSS_PATH;
			link.dataset.nxf = "1";
			this.root.prepend(link);
		}

		watch_route() {
			// the workspace page is kept alive between visits: refresh the numbers on the way back
			this._on_route = () => {
				if (!this.host.isConnected) {
					this.stop();
					return frappe.router.off("change", this._on_route);
				}
				this.stop();
				if (Date.now() - this.loaded_at > REFRESH_AFTER_MS) setTimeout(() => this.load(), 300);
			};
			frappe.router.on("change", this._on_route);
		}

		async load() {
			try {
				const r = await frappe.call({ method: METHOD, args: { flow: this.flow }, type: "GET" });
				this.data = r.message;
				this.steps = this.data.steps.map((s, i) => ({ ...s, i }));
				this.loaded_at = Date.now();
				this.render();
			} catch (e) {
				this.host.innerHTML = `<div class="nxf nxf-error">${esc(
					__("The flow couldn't load. Reload the page, or check the Error Log.")
				)}</div>`;
			}
		}

		render() {
			if (this.selected >= this.steps.length) this.selected = 0;
			this.host.innerHTML = `
				<section class="nxf ${this.collapsed ? "is-collapsed" : ""}" style="--nxf-line:${esc(this.data.color)}">
					<header class="nxf-head">
						<div class="nxf-mark">${icon(this.data.icon)}</div>
						<div class="nxf-heading">
							<h3 class="nxf-title">${esc(this.data.title)}</h3>
							<p class="nxf-sub">${esc(this.data.summary)}</p>
						</div>
						<div class="nxf-tools">
							<button class="nxf-tour" data-act="tour">${icon("play")}<span>${esc(
				__("Walk me through")
			)}</span></button>
							<button class="nxf-tool nxf-fold" data-act="fold" aria-expanded="${!this.collapsed}" title="${esc(
				this.collapsed ? __("Show the flow") : __("Hide the flow")
			)}">${icon("chevron")}</button>
						</div>
					</header>
					<div class="nxf-body">
						<ol class="nxf-track" role="list" style="--nxf-n:${this.steps.length}">
							${this.steps.map((s) => this.station(s)).join("")}
						</ol>
						<div class="nxf-detail" aria-live="polite">${this.detail(this.steps[this.selected])}</div>
					</div>
				</section>`;
			this.bind();
			this.mark_selected();
		}

		station(s) {
			const next = this.steps[s.i + 1];
			const cls = [
				"nxf-st",
				s.optional ? "is-optional" : "",
				s.report ? "is-report" : "",
				s.doctype && s.count == null ? "is-locked" : "",
				next && (next.optional || next.report) ? "seg-dashed" : "",
			]
				.filter(Boolean)
				.join(" ");
			const badge =
				s.pending && s.pending.count && s.pending.tone === "warn"
					? `<span class="nxf-badge" title="${esc(fmt(s.pending.count) + " " + s.pending.label)}">${fmt(
							s.pending.count
					  )}</span>`
					: "";
			return `
				<li class="${cls}">
					<button class="nxf-st-btn" data-i="${s.i}" aria-pressed="false">
						<span class="nxf-dot">${icon(s.report ? "chart" : s.icon)}${badge}</span>
						<span class="nxf-st-label">${esc(s.label)}</span>
						<span class="nxf-st-meta">${esc(s.actor)}</span>
						${s.optional ? `<span class="nxf-st-opt">${esc(__("Optional"))}</span>` : ""}
					</button>
				</li>`;
		}

		detail(s) {
			if (!s) return "";
			const prev = this.steps[s.i - 1],
				next = this.steps[s.i + 1];
			const actions = [];
			const locked = s.doctype && s.count == null;

			if (s.workspace) {
				actions.push(this.button("workspace", __("Open {0}", [s.label]), "open", true));
			} else if (s.report) {
				if (s.can_open) actions.push(this.button("report", __("Open report"), "chart", true));
			} else if (s.doctype && !locked) {
				if (s.can_create) actions.push(this.button("new", s.cta || __("New"), "plus", true));
				actions.push(
					this.button(
						"list",
						s.count ? __("View all ({0})", [fmt(s.count)]) : __("Open list"),
						"list",
						!s.can_create
					)
				);
			}
			if (s.pending && s.pending.count) {
				actions.push(
					`<button class="nxf-btn nxf-pending tone-${esc(s.pending.tone)}" data-act="pending"><b>${fmt(
						s.pending.count
					)}</b> ${esc(s.pending.label)}</button>`
				);
			}

			const then = next
				? `<p class="nxf-then"><span>${esc(__("Then"))}</span> ${esc(next.label)}</p>`
				: `<p class="nxf-then"><span>${esc(__("End of the cycle"))}</span></p>`;

			return `
				<div class="nxf-card">
					<div class="nxf-card-icon">${icon(s.report ? "chart" : s.icon)}</div>
					<div class="nxf-card-text">
						<p class="nxf-card-pos">${esc(
							__("Step {0} of {1}", [s.i + 1, this.steps.length])
						)}${s.optional ? ` <em>${esc(__("Optional"))}</em>` : ""}</p>
						<h4 class="nxf-card-title">${esc(s.label)}</h4>
						<p class="nxf-card-hint">${esc(s.hint)}</p>
						<dl class="nxf-facts">
							<div><dt>${esc(__("Who"))}</dt><dd>${esc(s.actor)}</dd></div>
						</dl>
						${then}
						${
							locked
								? `<p class="nxf-card-status">${esc(
										__("You don't have access to this step. Ask your HR Manager for the role.")
								  )}</p>`
								: ""
						}
					</div>
					<div class="nxf-card-side">
						<div class="nxf-card-actions">${actions.join("")}</div>
						<div class="nxf-nav">
							<button class="nxf-tool" data-act="prev" ${prev ? "" : "disabled"} title="${esc(
				__("Previous step")
			)}" aria-label="${esc(__("Previous step"))}">${icon("chevron", "is-left")}</button>
							<button class="nxf-tool" data-act="next" ${next ? "" : "disabled"} title="${esc(
				__("Next step")
			)}" aria-label="${esc(__("Next step"))}">${icon("chevron", "is-right")}</button>
						</div>
					</div>
				</div>`;
		}

		button(act, label, ic, primary = false) {
			return `<button class="nxf-btn ${primary ? "is-primary" : ""}" data-act="${act}">${icon(
				ic
			)}<span>${esc(label)}</span></button>`;
		}

		bind() {
			this.host.querySelectorAll(".nxf-st-btn").forEach((b) => {
				b.addEventListener("click", () => {
					this.stop();
					this.select(+b.dataset.i);
				});
				b.addEventListener("keydown", (e) => this.on_key(e));
			});
			this.host.querySelector("[data-act=tour]").addEventListener("click", () => this.tour());
			this.host.querySelector("[data-act=fold]").addEventListener("click", () => this.fold());
			this.bind_detail();
		}

		bind_detail() {
			this.host.querySelectorAll(".nxf-detail [data-act]").forEach((b) => {
				b.addEventListener("click", () => {
					this.stop();
					this.act(b.dataset.act);
				});
			});
		}

		mark_selected() {
			this.host.querySelectorAll(".nxf-st").forEach((li, n) => {
				li.classList.toggle("is-selected", n === this.selected);
				li.classList.toggle("is-passed", n < this.selected);
				li.classList.toggle("seg-flow", n === this.selected - 1);
				li.querySelector("button").setAttribute("aria-pressed", n === this.selected);
			});
		}

		select(i, focus = false) {
			if (i < 0 || i >= this.steps.length) return;
			this.selected = i;
			this.mark_selected();
			const detail = this.host.querySelector(".nxf-detail");
			detail.innerHTML = this.detail(this.steps[i]);
			detail.firstElementChild?.classList.add("is-entering");
			this.bind_detail();
			const btn = this.host.querySelector(`.nxf-st-btn[data-i="${i}"]`);
			btn?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
			if (focus) btn?.focus();
		}

		on_key(e) {
			const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
			if (dir == null) return;
			e.preventDefault();
			this.stop();
			const flip = getComputedStyle(this.host).direction === "rtl" && /Left|Right/.test(e.key);
			const n = this.steps.length;
			this.select((this.selected + (flip ? -dir : dir) + n) % n, true);
		}

		// walk through the cycle one station at a time
		tour() {
			if (this.timer) return this.stop();
			if (this.collapsed) this.fold();
			this.host.querySelector(".nxf").classList.add("is-touring");
			this.set_tour_button(true);
			this.select(0);
			this.timer = setInterval(() => {
				if (this.selected >= this.steps.length - 1) return this.stop();
				this.select(this.selected + 1);
			}, TOUR_STEP_MS);
		}

		stop() {
			if (!this.timer) return;
			clearInterval(this.timer);
			this.timer = null;
			this.host.querySelector(".nxf")?.classList.remove("is-touring");
			this.set_tour_button(false);
		}

		set_tour_button(on) {
			const b = this.host.querySelector("[data-act=tour]");
			if (!b) return;
			b.innerHTML = `${icon(on ? "pause" : "play")}<span>${esc(
				on ? __("Stop") : __("Walk me through")
			)}</span>`;
		}

		fold() {
			this.collapsed = !this.collapsed;
			if (this.collapsed) this.stop();
			store.set("collapsed:" + this.flow, this.collapsed ? "1" : "0");
			this.host.querySelector(".nxf").classList.toggle("is-collapsed", this.collapsed);
			const btn = this.host.querySelector("[data-act=fold]");
			btn.setAttribute("aria-expanded", !this.collapsed);
			btn.title = this.collapsed ? __("Show the flow") : __("Hide the flow");
		}

		act(action) {
			const s = this.steps[this.selected];
			if (action === "prev") return this.select(this.selected - 1);
			if (action === "next") return this.select(this.selected + 1);
			if (action === "new") return frappe.new_doc(s.doctype);
			if (action === "list") return this.open_list(s.doctype, s.filters);
			if (action === "pending") return this.open_list(s.pending.doctype, s.pending.filters);
			if (action === "report") return this.open_report(s.report);
			if (action === "workspace") return frappe.set_route("desk", frappe.router.slug(s.workspace));
		}

		open_list(doctype, filters) {
			frappe.route_options = Object.assign({}, filters || {});
			frappe.set_route("List", doctype);
		}

		open_report(report) {
			// HRMS reports like Monthly Attendance Sheet refuse to run without a company
			const company =
				frappe.defaults.get_user_default("Company") || frappe.defaults.get_global_default("company");
			if (company) frappe.route_options = { company };
			frappe.set_route("query-report", report);
		}
	}

	nexlify_hr.flow.mount = function (root, flow) {
		if (!root || root.__nxf) return root && root.__nxf;
		root.__nxf = new FlowPanel(root, flow);
		return root.__nxf;
	};
	nexlify_hr.flow.FlowPanel = FlowPanel;
})();
