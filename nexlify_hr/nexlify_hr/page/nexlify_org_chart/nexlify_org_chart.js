frappe.pages["nexlify-org-chart"].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Group Org Chart"),
        single_column: true,
    });
    wrapper.org_chart = new NexlifyOrgChart(page);
};

const NOC_API = "nexlify_hr.nexlify_hr.page.nexlify_org_chart.nexlify_org_chart.";
const NOC_LIB = "/assets/nexlify_hr/js/lib/";
const NOC_NO_DEPT = "d:__none";
const NOC_BLANK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
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
        this.view = "employee";
        this.show_vacancies = false;
        this.merge_depts = true;
        this.mdept = {};
        this.edit_mode = false;
        this.can_edit = frappe.user.has_role(["HR Manager", "HR User", "System Manager"]);
        this.expanded = new Set();
        this.highlight = null;
        this.selected = null;
        this.employees = [];
        this.departments = [];
        this.vacancies = [];
        this.by_id = {};
        this.dept_by = {};
        this.vac_by = {};
        this.reports = {};
        this.children = {};
        this.parent = {};
        this.roots = [];
        this._count = {};
        this._team = {};
        this.company_index = {};
        this.setup_fields();
        this.setup_body();
        this.update_buttons();
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
        this.$btn_view = this.page.add_inner_button(__("Department View"), () => this.toggle_view());
        this.$btn_merge = this.page.add_inner_button(__("Split by Company"), () => this.toggle_merge());
        this.$btn_vac = this.page.add_inner_button(__("Show Vacancies"), () => this.toggle_vacancies());
        this.$btn_edit = this.page.add_inner_button(__("Edit Mode"), () => {
            this.set_edit(!this.edit_mode);
            this.render();
        });
        this.page.add_inner_button(__("PNG Image"), () => this.export_chart("png"), __("Export"));
        this.page.add_inner_button(__("PDF"), () => this.export_chart("pdf"), __("Export"));
    }

    setup_body() {
        this.$wrap = $(`
            <div class="noc-wrap">
                <div class="noc-legend"></div>
                <div class="noc-editbar">${__("Edit Mode: drag an employee onto their new manager, or onto empty space to remove the manager")}</div>
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
            this.toggle_node($(e.currentTarget).closest(".noc-card").attr("data-id"));
        });

        // employee: click = profile, Ctrl/Cmd+click = form in new tab; department: expand; vacancy: Job Opening
        this.$stage.on("click", ".noc-card", (e) => {
            const id = $(e.currentTarget).attr("data-id");
            this.hide_hover();
            const kind = this.kind(id);
            if (kind === "dept") return this.toggle_node(id);
            if (kind === "vac") return frappe.set_route("Form", "Job Opening", id.slice(2));
            if (e.ctrlKey || e.metaKey) {
                window.open(frappe.utils.get_form_link("Employee", id), "_blank");
                return;
            }
            this.open_profile(id);
        });

        // hover = quick info card (employees only)
        this.$stage.on("mouseenter", ".noc-card", (e) => {
            const el = e.currentTarget;
            const id = el.getAttribute("data-id");
            if (!this.by_id[id] || this._drag) return;
            clearTimeout(this._ht);
            if (this._hover_id === id && this.$hover.hasClass("open")) {
                clearTimeout(this._hide_t);
                return;
            }
            if (this.$canvas.hasClass("dragging")) return;
            this._ht = setTimeout(() => this.show_hover(id, el), 300);
        });
        this.$stage.on("mouseleave", ".noc-card", () => this.schedule_hide());

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

        this.setup_dnd();
    }

    // ---------- edit mode: drag & drop ----------
    setup_dnd() {
        this.$stage.on("dragstart", ".noc-card[draggable='true']", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            this._drag = id;
            this.hide_hover();
            const dt = e.originalEvent.dataTransfer;
            dt.effectAllowed = "move";
            dt.setData("text/plain", id);
            setTimeout(() => $(e.currentTarget).addClass("noc-dragging"), 0);
        });
        this.$stage.on("dragend", ".noc-card", () => this.clear_drag());

        this.$stage.on("dragover", ".noc-card", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (!this.can_drop(this._drag, id)) return;
            e.preventDefault();
            e.stopPropagation();
            e.originalEvent.dataTransfer.dropEffect = "move";
            this.$canvas.removeClass("noc-drop-root");
            $(e.currentTarget).addClass("noc-drop-ok");
        });
        this.$stage.on("dragleave", ".noc-card", (e) => $(e.currentTarget).removeClass("noc-drop-ok"));
        this.$stage.on("drop", ".noc-card", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (!this.can_drop(this._drag, id)) return;
            e.preventDefault();
            e.stopPropagation();
            const src = this._drag;
            this.clear_drag();
            this.move(src, id);
        });

        // empty space = remove manager
        this.$canvas.on("dragover", (e) => {
            if (!this.can_drop_root(this._drag) || $(e.target).closest(".noc-card").length) return;
            e.preventDefault();
            this.$canvas.addClass("noc-drop-root");
        });
        this.$canvas.on("dragleave", (e) => {
            if (e.target === this.$canvas[0]) this.$canvas.removeClass("noc-drop-root");
        });
        this.$canvas.on("drop", (e) => {
            if (!this.can_drop_root(this._drag) || $(e.target).closest(".noc-card").length) return;
            e.preventDefault();
            const src = this._drag;
            this.clear_drag();
            this.move(src, null);
        });
    }

    clear_drag() {
        this._drag = null;
        this.$stage.find(".noc-dragging, .noc-drop-ok").removeClass("noc-dragging noc-drop-ok");
        this.$canvas.removeClass("noc-drop-root");
    }

    is_under(id, ancestor) {
        const seen = new Set();
        let p = this.by_id[id] && this.by_id[id].reports_to;
        while (p && !seen.has(p)) {
            if (p === ancestor) return true;
            seen.add(p);
            p = this.by_id[p] && this.by_id[p].reports_to;
        }
        return false;
    }

    can_drop(src, tgt) {
        if (!this.edit_mode || !src || !tgt || src === tgt) return false;
        const s = this.by_id[src];
        if (!s || !this.by_id[tgt] || s.reports_to === tgt) return false;
        return !this.is_under(tgt, src);
    }

    can_drop_root(src) {
        return this.edit_mode && src && this.by_id[src] && !!this.by_id[src].reports_to;
    }

    move(src, tgt) {
        const e = this.by_id[src];
        const m = tgt ? this.by_id[tgt] : null;
        let msg = m
            ? __("Move <b>{0}</b> to report to <b>{1}</b>?", [esc(e.employee_name), esc(m.employee_name)])
            : __("Remove the manager of <b>{0}</b>?", [esc(e.employee_name)]);
        if (m && m.company !== e.company) {
            msg += `<br><br><span class="text-warning">${__("Note: they belong to different companies ({0} / {1})", [esc(e.company), esc(m.company)])}</span>`;
        }
        frappe.confirm(msg, () => {
            frappe.call({
                method: NOC_API + "set_reports_to",
                args: { employee: src, reports_to: tgt || "" },
                freeze: true,
                callback: (r) => {
                    e.reports_to = r.message || null;
                    if (tgt) this.expanded.add(tgt);
                    this.build();
                    this.reveal(src);
                    frappe.show_alert({ message: __("Manager updated"), indicator: "green" });
                },
            });
        });
    }

    // ---------- data ----------
    async load() {
        const r = await frappe.call({ method: NOC_API + "get_org_data", args: { company: this.company.get_value() } });
        const data = r.message || {};
        this.employees = data.employees || [];
        this.departments = (data.departments || []).filter((d) => d.name !== "All Departments");
        this.vacancies = data.vacancies || [];
        this.company_index = data.company_index || {};
        this.by_id = {};
        this.dept_by = {};
        this.vac_by = {};
        this.employees.forEach((e) => (this.by_id[e.name] = e));
        this.departments.forEach((d) => (this.dept_by[d.name] = d));
        this.vacancies.forEach((v) => (this.vac_by[v.name] = v));
        this.highlight = null;
        this.build();
        this.expanded = new Set(this.roots);
        this.render_legend();
        this.render();
    }

    build() {
        const ch = {}, par = {}, roots = [];
        const add = (p, c) => {
            (ch[p] ||= []).push(c);
            par[c] = p;
        };

        // employee reporting lines (view-independent, used by counts / hover / profile)
        this.reports = {};
        this.employees.forEach((e) => {
            const p = e.reports_to;
            if (p && p !== e.name && this.by_id[p]) (this.reports[p] ||= []).push(e.name);
        });
        this._team = {};
        this._count = {};

        const vacs = this.show_vacancies ? this.vacancies : [];
        if (this.view === "employee") {
            this.employees.forEach((e) => {
                const p = e.reports_to;
                p && p !== e.name && this.by_id[p] ? add(p, e.name) : roots.push(e.name);
            });
            vacs.forEach((v) => {
                const host = this.dept_head(v.department);
                host ? add(host, "v:" + v.name) : roots.push("v:" + v.name);
            });
        } else {
            const key = (name) => {
                const d = this.dept_by[name];
                return this.merge_depts ? "d:m:" + (d.department_name || name).trim() : "d:" + name;
            };
            this.mdept = {};
            const placed = new Set();
            this.departments.forEach((d) => {
                const id = key(d.name);
                if (this.merge_depts) {
                    const m = (this.mdept[id.slice(4)] ||= { department_name: (d.department_name || d.name).trim(), companies: [] });
                    if (d.company && !m.companies.includes(d.company)) m.companies.push(d.company);
                }
                if (placed.has(id)) return;
                placed.add(id);
                const p = d.parent_department;
                const pid = p && p !== d.name && this.dept_by[p] ? key(p) : null;
                pid && pid !== id ? add(pid, id) : roots.push(id);
            });
            const home = (dept) => (dept && this.dept_by[dept] ? key(dept) : NOC_NO_DEPT);
            this.employees.forEach((e) => add(home(e.department), e.name));
            vacs.forEach((v) => add(home(v.department), "v:" + v.name));
            if (ch[NOC_NO_DEPT]) roots.push(NOC_NO_DEPT);
        }

        this.children = ch;
        this.parent = par;
        this.roots = roots;
    }

    // top-most employee of a department (manager outside the department), most direct reports wins
    dept_head(dept) {
        if (!dept) return null;
        let best = null, best_n = -1;
        this.employees.forEach((e) => {
            if (e.department !== dept) return;
            const m = this.by_id[e.reports_to];
            if (m && m.department === dept) return;
            const n = (this.reports[e.name] || []).length;
            if (n > best_n) {
                best = e.name;
                best_n = n;
            }
        });
        return best;
    }

    // ---------- toolbar ----------
    toggle_node(id) {
        this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
        this.render();
    }

    toggle_view() {
        this.view = this.view === "employee" ? "department" : "employee";
        if (this.view !== "employee" && this.edit_mode) this.set_edit(false);
        this.update_buttons();
        this.highlight = null;
        this.build();
        this.expanded = new Set(this.roots);
        this.render();
    }

    toggle_vacancies() {
        this.show_vacancies = !this.show_vacancies;
        if (this.show_vacancies && !this.vacancies.length) {
            frappe.show_alert({ message: __("No open Job Openings found"), indicator: "orange" });
        }
        this.update_buttons();
        this.build();
        if (this.show_vacancies) Object.keys(this.children).forEach((id) => {
            if (this.children[id].some((k) => this.kind(k) === "vac")) this.expanded.add(id);
        });
        this.render();
    }

    toggle_merge() {
        this.merge_depts = !this.merge_depts;
        this.update_buttons();
        this.highlight = null;
        this.build();
        this.expanded = new Set(this.roots);
        this.render();
    }

    set_edit(on) {
        this.edit_mode = on;
        this.$wrap.toggleClass("noc-editing", on);
        this.update_buttons();
    }

    update_buttons() {
        const mark = ($b, on) => $b.toggleClass("btn-primary", on).toggleClass("btn-default", !on);
        this.$btn_view.text(this.view === "employee" ? __("Department View") : __("Employee View"));
        this.$btn_merge.text(this.merge_depts ? __("Split by Company") : __("Merge Companies"));
        mark(this.$btn_merge, !this.merge_depts);
        this.$btn_merge.toggle(this.view === "department");
        this.$btn_vac.text(this.show_vacancies ? __("Hide Vacancies") : __("Show Vacancies"));
        mark(this.$btn_vac, this.show_vacancies);
        this.$btn_edit.text(this.edit_mode ? __("Exit Edit Mode") : __("Edit Mode"));
        mark(this.$btn_edit, this.edit_mode);
        this.$btn_edit.toggle(this.can_edit && this.view === "employee");
    }

    // ---------- helpers ----------
    kind(id) {
        return id.startsWith("d:") ? "dept" : id.startsWith("v:") ? "vac" : "emp";
    }

    color(company) {
        const i = this.company_index[company];
        return i == null ? "var(--gray-400)" : NOC_COLORS[i % NOC_COLORS.length];
    }

    clean_dept(d) {
        return (d || "").replace(/\s-\s[^-]+$/, "");
    }

    avatar(e, cls = "") {
        const abbr = esc(frappe.get_abbr(e.employee_name || ""));
        return e.image
            ? `<span class="noc-avatar ${cls}" data-abbr="${abbr}"><img src="${encodeURI(e.image)}" alt="" onerror="this.parentNode.textContent=this.parentNode.dataset.abbr"></span>`
            : `<span class="noc-avatar ${cls}">${abbr}</span>`;
    }

    tenure(d) {
        const m = moment().diff(moment(d), "months");
        const y = Math.floor(m / 12), r = m % 12;
        if (y && r) return __("{0} yrs {1} mos", [y, r]);
        return y ? __("{0} yrs", [y]) : __("{0} mos", [r]);
    }

    // whole team under an employee (reporting lines, any view)
    team(id, seen = new Set()) {
        if (this._team[id] != null) return this._team[id];
        if (seen.has(id)) return 0;
        seen.add(id);
        const kids = this.reports[id] || [];
        return (this._team[id] = kids.reduce((n, k) => n + 1 + this.team(k, seen), 0));
    }

    // employees inside a tree node (department view)
    count(id) {
        if (this._count[id] != null) return this._count[id];
        const kids = this.children[id] || [];
        return (this._count[id] = kids.reduce((n, k) => n + (this.kind(k) === "emp" ? 1 : 0) + this.count(k), 0));
    }

    vac_count(id) {
        return (this.children[id] || []).reduce((n, k) =>
            n + (this.kind(k) === "vac" ? (cint(this.vac_by[k.slice(2)].planned_vacancies) || 1) : 0) + this.vac_count(k), 0);
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
        const kids = this.children[id] || [];
        const open = this.expanded.has(id);
        const toggle = kids.length
            ? `<button class="noc-toggle" title="${__("Expand / Collapse")}">${noc_icon(open ? "chevron_up" : "chevron_down")}</button>`
            : "";
        const kind = this.kind(id);
        const card = kind === "dept" ? this.dept_card(id, toggle) : kind === "vac" ? this.vac_card(id) : this.emp_card(id, toggle);

        const $li = $('<li class="noc-node"></li>').append(card);
        if (kids.length && open) {
            const $ul = $('<ul class="noc-children"></ul>');
            kids.forEach((k) => $ul.append(this.node(k)));
            $li.append($ul);
        }
        return $li;
    }

    emp_card(id, toggle) {
        const e = this.by_id[id];
        const dept = this.clean_dept(e.department);
        const direct = (this.reports[id] || []).length;
        const total = this.team(id);
        const cls = [id === this.highlight ? "noc-hit" : "", id === this.selected ? "noc-selected" : ""].join(" ");
        const drag = this.edit_mode && this.view === "employee" ? 'draggable="true"' : "";
        const meta = [
            dept ? `<div class="noc-meta-row">${noc_icon("building")}<span class="noc-tx">${esc(dept)}</span></div>` : "",
            e.branch ? `<div class="noc-meta-row">${noc_icon("pin")}<span class="noc-tx">${esc(e.branch)}</span></div>` : "",
        ].join("");

        return `
            <div class="noc-card ${cls}" data-id="${esc(id)}" ${drag} style="--noc-co:${this.color(e.company)}">
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
                    ${total ? `<span class="noc-tag noc-tag-team" title="${__("Direct reports / Total team")}">${noc_icon("users")}${direct} / ${total}</span>` : ""}
                </div>
                ${toggle}
            </div>`;
    }

    dept_card(id, toggle) {
        const name = id.slice(2);
        let d, companies;
        if (id.startsWith("d:m:")) {
            const m = this.mdept[id.slice(4)] || { department_name: id.slice(4), companies: [] };
            companies = m.companies;
            d = { department_name: m.department_name, company: companies.length === 1 ? companies[0] : null };
        } else {
            d = this.dept_by[name] || { department_name: __("No Department") };
            companies = d.company ? [d.company] : [];
        }
        const co = d.company ? this.color(d.company) : companies.length ? "var(--primary)" : "var(--gray-400)";
        const total = this.count(id);
        const vacs = this.show_vacancies ? this.vac_count(id) : 0;
        return `
            <div class="noc-card noc-dept ${id === this.highlight ? "noc-hit" : ""}" data-id="${esc(id)}" style="--noc-co:${co}">
                <div class="noc-card-head">
                    <span class="noc-dept-icon">${noc_icon("building")}</span>
                    <div class="noc-info">
                        <div class="noc-name">${esc(d.department_name || name)}</div>
                        ${companies.length > 1
                            ? `<div class="noc-sub noc-co-dots">${companies.map((c) => `<span class="noc-dot" title="${esc(c)}" style="background:${this.color(c)}"></span>`).join("")}</div>`
                            : d.company ? `<div class="noc-sub">${esc(d.company)}</div>` : ""}
                    </div>
                </div>
                <div class="noc-card-foot">
                    <span class="noc-tag noc-tag-team" title="${__("Employees")}">${noc_icon("users")}${total}</span>
                    ${vacs ? `<span class="noc-tag noc-tag-vac" title="${__("Open Positions")}">${noc_icon("briefcase")}${vacs}</span>` : ""}
                </div>
                ${toggle}
            </div>`;
    }

    vac_card(id) {
        const v = this.vac_by[id.slice(2)];
        const n = cint(v.planned_vacancies) || 1;
        const dept = this.clean_dept(v.department);
        return `
            <div class="noc-card noc-vac" data-id="${esc(id)}" style="--noc-co:${this.color(v.company)}" title="${__("Open Job Opening")}">
                <div class="noc-card-head">
                    <span class="noc-dept-icon">${noc_icon("briefcase")}</span>
                    <div class="noc-info">
                        <div class="noc-name">${esc(v.designation || v.job_title || v.name)}</div>
                        <div class="noc-sub">${__("Open Position")}</div>
                    </div>
                </div>
                ${dept ? `<div class="noc-card-meta"><div class="noc-meta-row">${noc_icon("building")}<span class="noc-tx">${esc(dept)}</span></div></div>` : ""}
                <div class="noc-card-foot">
                    <span class="noc-tag noc-tag-vac">${noc_icon("users")}${n > 1 ? __("{0} positions", [n]) : __("1 position")}</span>
                </div>
            </div>`;
    }

    reveal(id) {
        if (!(id in this.parent) && !this.roots.includes(id)) return;
        let p = this.parent[id];
        while (p) {
            this.expanded.add(p);
            p = this.parent[p];
        }
        this.highlight = id;
        this.render();
        const el = this.card_el(id);
        el && el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    find(q) {
        q = (q || "").trim().toLowerCase();
        if (!q) return;
        const hit = this.employees.find(
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

    // ---------- export ----------
    async export_chart(type) {
        if (!this.roots.length) return;
        const libs = [NOC_LIB + "html-to-image.js"];
        if (type === "pdf") libs.push(NOC_LIB + "jspdf.umd.min.js");
        frappe.show_alert({ message: __("Preparing export..."), indicator: "blue" });

        const prev = this.scale;
        this.hide_hover();
        this.set_scale(1);
        this.$wrap.addClass("noc-exporting");
        try {
            await frappe.require(libs);
            const el = this.$stage[0];
            const w = el.scrollWidth, h = el.scrollHeight;
            const ratio = Math.min(2, 16000 / Math.max(w, h));
            const bg = getComputedStyle(this.$wrap[0]).backgroundColor;
            const url = await htmlToImage.toPng(el, { backgroundColor: bg, pixelRatio: ratio, width: w, height: h, imagePlaceholder: NOC_BLANK });
            const fname = `org-chart-${this.view}-${frappe.datetime.now_date()}`;

            if (type === "png") {
                const a = document.createElement("a");
                a.href = url;
                a.download = fname + ".png";
                a.click();
            } else {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: w >= h ? "landscape" : "portrait", unit: "px", format: [w, h], hotfixes: ["px_scaling"] });
                pdf.addImage(url, "PNG", 0, 0, w, h);
                pdf.save(fname + ".pdf");
            }
        } catch (err) {
            console.error(err);
            frappe.msgprint(__("Export failed. Check the browser console for details."));
        } finally {
            this.$wrap.removeClass("noc-exporting");
            this.set_scale(prev);
        }
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
        const kids = this.reports[e.name] || [];
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
            ["users", __("Team"), kids.length ? __("{0} direct · {1} total", [kids.length, this.team(e.name)]) : ""],
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
        const kids = this.reports[d.name] || [];
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
                    <div><b>${this.team(d.name)}</b><span>${__("Total Team")}</span></div>
                    <div><b>${d.date_of_joining ? esc(this.tenure(d.date_of_joining)) : "—"}</b><span>${__("Tenure")}</span></div>
                </div>
                ${fields ? `<div class="noc-fields">${fields}</div>` : ""}
                ${kids.length ? `<div class="noc-section-title">${__("Direct Reports")}</div><div class="noc-reports">${reports}</div>` : ""}
            </div>`;
    }
}
