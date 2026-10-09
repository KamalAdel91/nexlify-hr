frappe.pages["nexlify-org-chart"].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Group Org Chart"),
        single_column: true,
    });
    wrapper.org_chart = new NexlifyOrgChart(page);
};

const NOC_API = "nexlify_hr.nexlify_hr.page.nexlify_org_chart.nexlify_org_chart.";
const NOC_COLORS = ["#1D9E75", "#7F77DD", "#D85A30", "#378ADD", "#D4537E", "#BA7517", "#639922", "#888780"];
const NOC_ICONS = {
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    chevron_down: '<path d="m6 9 6 6 6-6"/>',
    chevron_up: '<path d="m18 15-6-6-6 6"/>',
};
const esc = (s) => frappe.utils.escape_html(s == null ? "" : String(s));
const noc_icon = (n) =>
    `<svg class="noc-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NOC_ICONS[n]}</svg>`;

class NexlifyOrgChart {
    constructor(page) {
        this.page = page;
        this.scale = 1;
        this.expanded = new Set();
        this.highlight = null;
        this.selected = null;
        this.by_id = {};
        this.children = {};
        this.roots = [];
        this._count = {};
        this.company_index = {};
        this.setup_fields();
        this.setup_body();
        this.load();
    }

    setup_fields() {
        this.company = this.page.add_field({
            fieldtype: "Link",
            fieldname: "company",
            options: "Company",
            label: __("Company"),
            placeholder: __("All Companies"),
            change: () => this.load(),
        });
        this.search = this.page.add_field({
            fieldtype: "Data",
            fieldname: "search",
            label: __("Search Employee"),
            change: () => this.find(this.search.get_value()),
        });
        this.page.add_inner_button(__("Expand All"), () => {
            Object.keys(this.children).forEach((id) => this.expanded.add(id));
            this.render();
        });
        this.page.add_inner_button(__("Collapse All"), () => {
            this.expanded.clear();
            this.render();
        });
    }

    setup_body() {
        this.$wrap = $(`
            <div class="noc-wrap">
                <div class="noc-legend"></div>
                <div class="noc-zoom">
                    <button class="btn btn-default btn-xs" data-z="in">+</button>
                    <button class="btn btn-default btn-xs" data-z="out">−</button>
                    <button class="btn btn-default btn-xs" data-z="reset">100%</button>
                </div>
                <div class="noc-canvas"><div class="noc-stage"></div></div>
                <div class="noc-hover"></div>
            </div>`).appendTo(this.page.main);

        this.$legend = this.$wrap.find(".noc-legend");
        this.$canvas = this.$wrap.find(".noc-canvas");
        this.$stage = this.$wrap.find(".noc-stage");
        this.$hover = this.$wrap.find(".noc-hover");

        this.$wrap.on("click", "[data-z]", (e) => {
            const z = $(e.currentTarget).data("z");
            this.set_scale(z === "in" ? this.scale + 0.1 : z === "out" ? this.scale - 0.1 : 1);
        });

        this.$canvas[0].addEventListener("wheel", (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            this.set_scale(this.scale + (e.deltaY < 0 ? 0.1 : -0.1));
        }, { passive: false });

        // drag to pan
        this.$canvas.on("mousedown", (e) => {
            if ($(e.target).closest(".noc-card").length) return;
            this.hide_hover();
            const c = this.$canvas[0];
            const start = { x: e.pageX, y: e.pageY, l: c.scrollLeft, t: c.scrollTop };
            this.$canvas.addClass("dragging");
            $(document).on("mousemove.noc", (ev) => {
                c.scrollLeft = start.l - (ev.pageX - start.x);
                c.scrollTop = start.t - (ev.pageY - start.y);
            });
            $(document).one("mouseup", () => {
                $(document).off("mousemove.noc");
                this.$canvas.removeClass("dragging");
            });
        });
        this.$canvas.on("scroll", () => this.hide_hover());

        this.$stage.on("click", ".noc-toggle", (e) => {
            e.stopPropagation();
            const id = $(e.currentTarget).closest(".noc-card").attr("data-id");
            this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
            this.render();
        });

        // click = profile dialog, Ctrl/Cmd+click = Employee form in a new tab
        this.$stage.on("click", ".noc-card", (e) => {
            const id = $(e.currentTarget).attr("data-id");
            this.hide_hover();
            if (e.ctrlKey || e.metaKey) {
                window.open(frappe.utils.get_form_link("Employee", id), "_blank");
                return;
            }
            this.open_profile(id);
        });

        // hover = quick info card
        this.$stage.on("mouseenter", ".noc-card", (e) => {
            const el = e.currentTarget;
            clearTimeout(this._ht);
            if (this._hover_id === el.getAttribute("data-id") && this.$hover.hasClass("open")) {
                clearTimeout(this._hide_t);
                return;
            }
            if (this.$canvas.hasClass("dragging")) return;
            this._ht = setTimeout(() => this.show_hover(el.getAttribute("data-id"), el), 300);
        });
        this.$stage.on("mouseleave", ".noc-card", () => this.schedule_hide());

        // keep the hover card open while the mouse is on it, so its buttons are clickable
        this.$hover.on("mouseenter", () => clearTimeout(this._hide_t));
        this.$hover.on("mouseleave", () => this.schedule_hide());
        this.$hover.on("click", "[data-noc-profile]", (e) => {
            const id = $(e.currentTarget).attr("data-noc-profile");
            this.hide_hover();
            this.open_profile(id);
        });
        this.$hover.on("click", "[data-noc-form]", (e) => {
            const id = $(e.currentTarget).attr("data-noc-form");
            this.hide_hover();
            frappe.set_route("Form", "Employee", id);
        });
        this.$hover.on("click", "[data-noc-emp]", (e) => {
            const id = $(e.currentTarget).attr("data-noc-emp");
            this.hide_hover();
            this.reveal(id);
            this.open_profile(id);
        });
    }

    async load() {
        const r = await frappe.call({ method: NOC_API + "get_org_data", args: { company: this.company.get_value() } });
        const data = r.message || {};
        const rows = data.employees || [];
        this.company_index = data.company_index || {};
        this.by_id = {};
        this.children = {};
        this.roots = [];
        this._count = {};
        rows.forEach((e) => (this.by_id[e.name] = e));
        rows.forEach((e) => {
            const p = e.reports_to;
            if (p && p !== e.name && this.by_id[p]) (this.children[p] ||= []).push(e.name);
            else this.roots.push(e.name);
        });
        this.expanded = new Set(this.roots);
        this.highlight = null;
        this.render_legend();
        this.render();
    }

    // ---------- helpers ----------
    color(company) {
        const i = this.company_index[company];
        return i == null ? "var(--gray-400)" : NOC_COLORS[i % NOC_COLORS.length];
    }

    clean_dept(d) {
        return (d || "").replace(/\s-\s[^-]+$/, "");
    }

    avatar(e, cls = "") {
        return e.image
            ? `<span class="noc-avatar ${cls}"><img src="${encodeURI(e.image)}" alt=""></span>`
            : `<span class="noc-avatar ${cls}">${esc(frappe.get_abbr(e.employee_name || ""))}</span>`;
    }

    tenure(d) {
        const m = moment().diff(moment(d), "months");
        const y = Math.floor(m / 12), r = m % 12;
        if (y && r) return __("{0} yrs {1} mos", [y, r]);
        return y ? __("{0} yrs", [y]) : __("{0} mos", [r]);
    }

    count(id) {
        if (this._count[id] != null) return this._count[id];
        const kids = this.children[id] || [];
        return (this._count[id] = kids.reduce((n, k) => n + 1 + this.count(k), 0));
    }

    card_el(id) {
        return this.$stage.find(`.noc-card[data-id="${CSS.escape(id)}"]`)[0];
    }

    // ---------- chart ----------
    render_legend() {
        const list = Object.keys(this.company_index).sort((a, b) => this.company_index[a] - this.company_index[b]);
        this.$legend.html(list.map((c) =>
            `<span class="noc-legend-item"><span class="noc-dot" style="background:${this.color(c)}"></span>${esc(c)}</span>`
        ).join(""));
        this.$legend.toggle(list.length > 1);
    }

    render() {
        this.hide_hover();
        if (!this.roots.length) {
            this.$stage.html(`<div class="text-muted">${__("No active employees found")}</div>`);
            return;
        }
        const $ul = $('<ul class="noc-root"></ul>');
        this.roots.forEach((id) => $ul.append(this.node(id)));
        this.$stage.empty().append($ul);
    }

    node(id) {
        const e = this.by_id[id];
        const kids = this.children[id] || [];
        const open = this.expanded.has(id);
        const dept = this.clean_dept(e.department);
        const cls = [id === this.highlight ? "noc-hit" : "", id === this.selected ? "noc-selected" : ""].join(" ");
        const toggle = kids.length
            ? `<button class="noc-toggle" title="${__("Expand / Collapse")}">${noc_icon(open ? "chevron_up" : "chevron_down")}</button>`
            : "";
        const meta = [
            dept ? `<div class="noc-meta-row">${noc_icon("building")}<span class="noc-tx">${esc(dept)}</span></div>` : "",
            e.branch ? `<div class="noc-meta-row">${noc_icon("pin")}<span class="noc-tx">${esc(e.branch)}</span></div>` : "",
        ].join("");

        const $li = $('<li class="noc-node"></li>');
        $li.append(`
            <div class="noc-card ${cls}" data-id="${esc(id)}" style="--noc-co:${this.color(e.company)}">
                <div class="noc-card-head">
                    ${this.avatar(e)}
                    <div class="noc-info">
                        <div class="noc-name">${esc(e.employee_name)}</div>
                        ${e.designation ? `<div class="noc-sub">${esc(e.designation)}</div>` : ""}
                    </div>
                </div>
                ${meta ? `<div class="noc-card-meta">${meta}</div>` : ""}
                <div class="noc-card-foot">
                    <span class="noc-tag">${noc_icon("hash")}${esc(id)}</span>
                    ${kids.length ? `<span class="noc-tag noc-tag-team">${noc_icon("users")}${this.count(id)}</span>` : ""}
                </div>
                ${toggle}
            </div>`);

        if (kids.length && open) {
            const $ul = $('<ul class="noc-children"></ul>');
            kids.forEach((k) => $ul.append(this.node(k)));
            $li.append($ul);
        }
        return $li;
    }

    reveal(id) {
        if (!this.by_id[id]) return;
        let p = this.by_id[id].reports_to;
        while (p && this.by_id[p]) {
            this.expanded.add(p);
            p = this.by_id[p].reports_to;
        }
        this.highlight = id;
        this.render();
        const el = this.card_el(id);
        el && el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    find(q) {
        q = (q || "").trim().toLowerCase();
        if (!q) return;
        const hit = Object.values(this.by_id).find(
            (e) => (e.employee_name || "").toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
        );
        if (!hit) {
            frappe.show_alert({ message: __("Not found"), indicator: "orange" });
            return;
        }
        this.reveal(hit.name);
    }

    set_scale(s) {
        this.scale = Math.min(2, Math.max(0.3, Math.round(s * 10) / 10));
        this.$stage.css("zoom", this.scale);
        this.$wrap.find('[data-z="reset"]').text(Math.round(this.scale * 100) + "%");
    }

    // ---------- hover card ----------
    show_hover(id, el) {
        const e = this.by_id[id];
        if (!e || !el.isConnected) return;
        clearTimeout(this._hide_t);
        this._hover_id = id;
        this.$hover.html(this.hover_html(e)).addClass("open");
        const wr = this.$wrap[0].getBoundingClientRect();
        const cr = el.getBoundingClientRect();
        const w = this.$hover.outerWidth();
        const h = this.$hover.outerHeight();
        let left = cr.left - wr.left + cr.width / 2 - w / 2;
        left = Math.max(8, Math.min(left, wr.width - w - 8));
        let top = cr.bottom - wr.top + 10;
        if (top + h > wr.height - 8) top = cr.top - wr.top - h - 10;
        this.$hover.css({ left, top: Math.max(8, top) });
    }

    hide_hover() {
        clearTimeout(this._ht);
        clearTimeout(this._hide_t);
        this._hover_id = null;
        this.$hover && this.$hover.removeClass("open");
    }

    schedule_hide() {
        clearTimeout(this._ht);
        clearTimeout(this._hide_t);
        this._hide_t = setTimeout(() => this.hide_hover(), 250);
    }

    hover_html(e) {
        const kids = this.children[e.name] || [];
        const mgr = e.reports_to ? this.by_id[e.reports_to] : null;
        const co = this.color(e.company);
        const rows = [
            ["hash", __("Employee ID"), e.name],
            ["building", __("Department"), this.clean_dept(e.department)],
            ["pin", __("Branch"), e.branch],
            ["briefcase", __("Employment Type"), e.employment_type],
            ["award", __("Grade"), e.grade],
            ["calendar", __("Joined"), e.date_of_joining
                ? `${frappe.datetime.str_to_user(e.date_of_joining)} · ${this.tenure(e.date_of_joining)}` : ""],
            ["user", __("Reports To"), mgr ? mgr.employee_name : "", mgr ? `<a class="noc-link" data-noc-emp="${esc(e.reports_to)}">${esc(mgr.employee_name)}</a>` : ""],
            ["users", __("Team"), kids.length ? __("{0} direct · {1} total", [kids.length, this.count(e.name)]) : ""],
        ].filter((r) => r[2]);

        return `
            <div class="noc-hover-inner" style="--noc-co:${co}">
                <div class="noc-hover-head">
                    ${this.avatar(e, "noc-avatar-md")}
                    <div class="noc-info">
                        <div class="noc-name">${esc(e.employee_name)}</div>
                        ${e.designation ? `<div class="noc-sub">${esc(e.designation)}</div>` : ""}
                    </div>
                </div>
                <span class="noc-chip"><span class="noc-dot" style="background:${co}"></span>${esc(e.company)}</span>
                <div class="noc-hover-rows">
                    ${rows.map(([i, l, v, h]) => `
                        <div class="noc-hover-row">${noc_icon(i)}<span class="noc-hover-label">${l}</span><span class="noc-hover-value">${h || esc(v)}</span></div>`).join("")}
                </div>
                <div class="noc-hover-actions">
                    <button class="btn btn-default btn-xs" data-noc-profile="${esc(e.name)}">${__("Full Profile")}</button>
                    <button class="btn btn-primary btn-xs" data-noc-form="${esc(e.name)}">${__("Open Employee")}</button>
                </div>
            </div>`;
    }

    // ---------- profile dialog (centered) ----------
    make_dialog() {
        this.dialog = new frappe.ui.Dialog({
            title: __("Employee Profile"),
            size: "large",
            fields: [{ fieldtype: "HTML", fieldname: "body" }],
            primary_action_label: __("Open Employee"),
            primary_action: () => {
                const id = this.selected;
                this.dialog.hide();
                frappe.set_route("Form", "Employee", id);
            },
            secondary_action_label: __("Locate in Chart"),
            secondary_action: () => {
                const id = this.selected;
                this.dialog.hide();
                this.reveal(id);
            },
        });
        this.dialog.$wrapper.addClass("noc-dialog");
        this.$profile = this.dialog.fields_dict.body.$wrapper;
        this.$profile.on("click", "[data-noc-emp]", (e) => {
            const id = $(e.currentTarget).attr("data-noc-emp");
            this.reveal(id);
            this.open_profile(id);
        });
        this.dialog.onhide = () => {
            this.selected = null;
            this.$stage.find(".noc-card.noc-selected").removeClass("noc-selected");
        };
    }

    async open_profile(id) {
        const e = this.by_id[id];
        if (!e) return;
        if (!this.dialog) this.make_dialog();
        this.selected = id;
        this.$stage.find(".noc-card.noc-selected").removeClass("noc-selected");
        $(this.card_el(id)).addClass("noc-selected");
        this.$profile.html(this.profile_html(e));
        this.dialog.show();
        try {
            const r = await frappe.call({ method: NOC_API + "get_employee_card", args: { employee: id } });
            if (this.selected === id) this.$profile.html(this.profile_html({ ...e, ...(r.message || {}) }));
        } catch (err) {
            // keep the chart data already shown
        }
    }

    profile_html(d) {
        const co = this.color(d.company);
        const kids = this.children[d.name] || [];
        const mgr = d.reports_to ? this.by_id[d.reports_to] : null;
        const field = (icon, label, value) => value
            ? `<div class="noc-field">${noc_icon(icon)}<div class="noc-field-text"><div class="noc-field-label">${label}</div><div class="noc-field-value">${value}</div></div></div>`
            : "";

        const fields = [
            field("building", __("Department"), esc(this.clean_dept(d.department))),
            field("pin", __("Branch"), esc(d.branch)),
            field("briefcase", __("Employment Type"), esc(d.employment_type)),
            field("award", __("Grade"), esc(d.grade)),
            field("calendar", __("Date of Joining"), d.date_of_joining ? esc(frappe.datetime.str_to_user(d.date_of_joining)) : ""),
            field("user", __("Reports To"), d.reports_to
                ? (mgr ? `<a class="noc-link" data-noc-emp="${esc(d.reports_to)}">${esc(mgr.employee_name)}</a>` : esc(d.reports_to))
                : ""),
            field("mail", __("Email"), d.company_email ? `<a href="mailto:${esc(d.company_email)}">${esc(d.company_email)}</a>` : ""),
            field("phone", __("Mobile"), d.cell_number ? `<a href="tel:${esc(d.cell_number)}">${esc(d.cell_number)}</a>` : ""),
        ].join("");

        const reports = kids.map((k) => {
            const c = this.by_id[k];
            return `<button class="noc-report" data-noc-emp="${esc(k)}" style="--noc-co:${this.color(c.company)}">
                        ${this.avatar(c, "noc-avatar-sm")}
                        <span class="noc-report-text">
                            <span class="noc-report-name">${esc(c.employee_name)}</span>
                            <span class="noc-report-sub">${esc(c.designation)}</span>
                        </span>
                    </button>`;
        }).join("");

        return `
            <div class="noc-profile" style="--noc-co:${co}">
                <div class="noc-profile-hero">
                    ${this.avatar(d, "noc-avatar-xl")}
                    <div class="noc-profile-main">
                        <div class="noc-profile-name">${esc(d.employee_name)}</div>
                        ${d.designation ? `<div class="noc-profile-title">${esc(d.designation)}</div>` : ""}
                        <div class="noc-profile-chips">
                            <span class="noc-chip"><span class="noc-dot" style="background:${co}"></span>${esc(d.company)}</span>
                            <span class="noc-chip noc-chip-plain">${noc_icon("hash")}${esc(d.name)}</span>
                        </div>
                    </div>
                </div>
                <div class="noc-kpis">
                    <div><b>${kids.length}</b><span>${__("Direct Reports")}</span></div>
                    <div><b>${this.count(d.name)}</b><span>${__("Total Team")}</span></div>
                    <div><b>${d.date_of_joining ? esc(this.tenure(d.date_of_joining)) : "—"}</b><span>${__("Tenure")}</span></div>
                </div>
                ${fields ? `<div class="noc-fields">${fields}</div>` : ""}
                ${kids.length ? `<div class="noc-section-title">${__("Direct Reports")}</div><div class="noc-reports">${reports}</div>` : ""}
            </div>`;
    }
}
