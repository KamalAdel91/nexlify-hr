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
const NOC_GRID_AT = 6; // more direct reports than this -> grid + drill-down (vertical full chart)
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
    crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.28-3.66a.5.5 0 0 1 .82.5l-2.83 10.25a1 1 0 0 1-.96.73H5.79a1 1 0 0 1-.97-.73L2 5.99a.5.5 0 0 1 .81-.5l4.28 3.67a1 1 0 0 0 1.52-.3z"/><path d="M5 21h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    sparkle: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    teams: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    chevrons_up: '<path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/>',
    chevrons_down: '<path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/>',
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
        try { this.layout = localStorage.getItem("noc_layout") || "vertical"; } catch (e) { this.layout = "vertical"; }
        try { this.mode = localStorage.getItem("noc_mode") || "focus"; } catch (e) { this.mode = "focus"; }
        this.focus_id = null;
        this.level = 1;
        this.drill = {};
        try { this.show_moved = localStorage.getItem("noc_show_moved") !== "0"; } catch (e) { this.show_moved = true; }
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

        this.$tb = $(`
            <div class="noc-toolbar">
                <div class="noc-seg" data-seg="mode">
                    <button data-v="focus">${__("Focus")}</button>
                    <button data-v="full">${__("Full Chart")}</button>
                    <button data-v="smart">${__("Smart")}</button>
                </div>
                <div class="noc-seg" data-seg="view">
                    <button data-v="employee">${__("Employees")}</button>
                    <button data-v="department">${__("Departments")}</button>
                </div>
                <div class="noc-tools">
                    <div class="noc-lv">
                        <button class="noc-lv-btn" data-lv="collapse" title="${__("Collapse All")}">${noc_icon("chevrons_up")}<span>${__("Collapse")}</span></button>
                        <span class="noc-lv-step">
                            <button data-lv="minus" title="${__("One level less")}">−</button>
                            <span class="noc-lv-val"></span>
                            <button data-lv="plus" title="${__("One level more")}">+</button>
                        </span>
                        <button class="noc-lv-btn" data-lv="all" title="${__("Expand All")}">${noc_icon("chevrons_down")}<span>${__("Expand")}</span></button>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-default btn-xs dropdown-toggle noc-opt-btn" data-toggle="dropdown" data-bs-toggle="dropdown">${noc_icon("sliders")}${__("Options")}</button>
                        <div class="dropdown-menu dropdown-menu-right dropdown-menu-end noc-menu">
                            <a class="dropdown-item noc-opt" data-act="vacancies" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Show vacancies")}</a>
                            <a class="dropdown-item noc-opt" data-act="merge" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Merge companies")}</a>
                            <a class="dropdown-item noc-opt" data-act="moved" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Show placeholders")}</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item noc-opt" data-act="layout-v" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Vertical layout")}</a>
                            <a class="dropdown-item noc-opt" data-act="layout-h" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Horizontal layout")}</a>
                            <div class="dropdown-divider noc-edit-div"></div>
                            <a class="dropdown-item noc-opt" data-act="edit" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Edit mode")}</a>
                            <div class="dropdown-divider noc-settings-div"></div>
                            <a class="dropdown-item noc-opt" data-act="settings" href="#"><span class="noc-check">${noc_icon("check")}</span>${__("Settings")}</a>
                        </div>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" data-bs-toggle="dropdown">${__("Export")}</button>
                        <div class="dropdown-menu dropdown-menu-right dropdown-menu-end noc-menu">
                            <a class="dropdown-item" data-act="png" href="#">${__("PNG Image")}</a>
                            <a class="dropdown-item" data-act="pdf" href="#">${__("PDF")}</a>
                        </div>
                    </div>
                </div>
            </div>`).appendTo(this.page.main);

        this.$tb.on("click", "[data-seg] button", (e) => {
            const seg = $(e.currentTarget).parent().data("seg");
            const v = $(e.currentTarget).data("v");
            if (seg === "mode" && v !== this.mode) this.toggle_mode(v);
            if (seg === "view" && v !== this.view) this.toggle_view();
        });
        this.$tb.on("click", "[data-lv]", (e) => {
            const a = $(e.currentTarget).data("lv");
            const max = this.max_depth();
            const cur = this.level === "all" ? max : (this.level ?? 1);
            if (a === "collapse") this.expand_to(0);
            else if (a === "all") this.expand_to("all");
            else if (a === "minus") this.expand_to(Math.max(0, cur - 1));
            else if (a === "plus") this.expand_to(cur + 1 >= max ? "all" : cur + 1);
        });
        this.$tb.on("click", "[data-act]", (e) => {
            e.preventDefault();
            const act = $(e.currentTarget).data("act");
            if (act === "settings") return frappe.set_route("Form", "Nexlify HR Settings");
            if (act === "moved") {
                this.show_moved = !this.show_moved;
                try { localStorage.setItem("noc_show_moved", this.show_moved ? "1" : "0"); } catch (err) {}
                this.update_buttons();
                this.render();
                return;
            }
            if (act === "vacancies") this.toggle_vacancies();
            else if (act === "merge") this.toggle_merge();
            else if (act === "layout") this.toggle_layout();
            else if (act === "layout-v" || act === "layout-h") {
                if ((act === "layout-h") !== (this.layout === "horizontal")) this.toggle_layout();
            }
            else if (act === "expand") {
                Object.keys(this.children).forEach((id) => this.expanded.add(id));
                this.render();
            } else if (act === "collapse") {
                this.expanded.clear();
                this.render();
            } else if (act === "edit") {
                this.set_edit(!this.edit_mode);
                this.render();
            } else if (act === "png" || act === "pdf") this.export_chart(act);
        });
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
                    <button class="btn btn-default btn-xs" data-z="fit" title="${__("Fit to screen")}">⤢</button>
                </div>
                <div class="noc-canvas"><div class="noc-stage"></div></div>
                <div class="noc-kpi-bar"></div>
                <div class="noc-hover"></div>
            </div>`).appendTo(this.page.main);

        this.$legend = this.$wrap.find(".noc-legend");
        // one row above the chart: company colors on the start side, toolbar on the end side
        this.$topbar = $('<div class="noc-topbar"></div>').insertBefore(this.$wrap);
        this.$topbar.append(this.$legend, this.$tb);
        this.$canvas = this.$wrap.find(".noc-canvas");
        this.$stage = this.$wrap.find(".noc-stage");
        this.$hover = this.$wrap.find(".noc-hover");
        this.$kpi = this.$wrap.find(".noc-kpi-bar");
        this.$wrap.toggleClass("noc-h", this.mode === "full" && this.layout === "horizontal");
        this.$wrap.toggleClass("noc-focus-mode", this.mode === "focus");

        this.$wrap.on("click", "[data-z]", (e) => {
            const z = $(e.currentTarget).data("z");
            if (z === "fit") return this.fit();
            const r = this.$canvas[0].getBoundingClientRect();
            this.zoom_at(z === "in" ? this.scale + 0.1 : z === "out" ? this.scale - 0.1 : 1,
                r.left + r.width / 2, r.top + r.height / 2);
        });

        this.$canvas[0].addEventListener("wheel", (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            this.zoom_at(this.scale + (e.deltaY < 0 ? 0.1 : -0.1), e.clientX, e.clientY);
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
            const card = $(e.currentTarget).closest(".noc-card")[0];
            if (this.drill_toggle(card, true)) return;
            this.toggle_node(card.getAttribute("data-id"));
        });

        // employee: click = profile, Ctrl/Cmd+click = form in new tab; department: expand; vacancy: Job Opening
        this.$stage.on("click", ".noc-card", (e) => {
            const id = $(e.currentTarget).attr("data-id");
            this.hide_hover();
            const kind = this.kind(id);
            if (kind === "vac") return frappe.set_route("Form", "Job Opening", id.slice(2));
            if (kind === "emp" && (e.ctrlKey || e.metaKey)) {
                window.open(frappe.utils.get_form_link("Employee", id), "_blank");
                return;
            }
            if (this.mode === "focus" && id !== this._focus_center) return this.set_focus(id);
            if (this.mode === "smart" && this.drill_toggle(e.currentTarget, false)) return;
            if (kind === "dept") return this.toggle_node(id);
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
            this._ht = setTimeout(() => this.show_hover(id, el), 200);
        });
        this.$stage.on("mouseleave", ".noc-card", () => this.schedule_hide());
        this.$stage.on("mouseenter", ".noc-card", (e) => this.light_path(e.currentTarget.getAttribute("data-id")));
        this.$stage.on("mouseleave", ".noc-card", () => this.clear_path());

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

        this.$stage.on("click", ".noc-f-top", () => this.set_focus(null));
        $(window).on("resize", frappe.utils.debounce(() => this.mode !== "focus" && this.render(), 300));
        this.setup_minimap();
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
                    this.render_stats();
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
        this.on_leave = new Set(data.on_leave || []);
        this.company_colors = data.company_colors || {};
        this.by_id = {};
        this.dept_by = {};
        this.vac_by = {};
        this.employees.forEach((e) => (this.by_id[e.name] = e));
        this.departments.forEach((d) => (this.dept_by[d.name] = d));
        this.vacancies.forEach((v) => (this.vac_by[v.name] = v));
        this.highlight = null;
        this.build();
        this.expanded = new Set(this.view === "department" ? [] : this.roots);
        this.level = this.view === "department" ? 0 : 1;
        this.drill = {};
        this.render_legend();
        this.render_stats();
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
        this.level = null;
        this.update_buttons();
        this.render();
    }

    toggle_view() {
        this.view = this.view === "employee" ? "department" : "employee";
        if (this.view === "department" && this.mode === "smart") {
            this._smart_back = true;
            this.mode_silent("focus");
        } else if (this.view === "employee" && this._smart_back) {
            this._smart_back = false;
            this.mode_silent("smart");
        }
        if (this.view !== "employee" && this.edit_mode) this.set_edit(false);
        this.update_buttons();
        this.highlight = null;
        this.build();
        this.expanded = new Set(this.view === "department" ? [] : this.roots);
        this.level = this.view === "department" ? 0 : 1;
        this.update_buttons();
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

    max_depth() {
        const depth = (id) => {
            const k = this.children[id] || [];
            return k.length ? 1 + Math.max(...k.map(depth)) : 0;
        };
        return Math.max(0, ...this.roots.map(depth));
    }

    expand_to(level) {
        this.level = level;
        if (level === 0) this.drill = {};
        this.expanded = new Set();
        const max = level === "all" ? Infinity : cint(level);
        this.drill = {};
        const walk = (id, depth) => {
            const kids = this.children[id] || [];
            if (!kids.length || depth >= max) return;
            this.expanded.add(id);
            // Smart grids: open every manager in the grid that is still within the requested level
            if (this.is_grid(id)) {
                const open = kids.filter((k) => (this.children[k] || []).length && depth + 1 < max);
                if (open.length) this.drill[id] = open;
            }
            kids.forEach((k) => walk(k, depth + 1));
        };
        this.roots.forEach((r) => walk(r, 0));
        this.update_buttons();
        this.render();
    }

    // switch mode without re-rendering or saving the choice (used by the view switch)
    mode_silent(v) {
        this.mode = v;
        this.$wrap.toggleClass("noc-h", v === "full" && this.layout === "horizontal");
        this.$wrap.toggleClass("noc-focus-mode", v === "focus");
    }

    toggle_mode(v) {
        this.mode = v || (this.mode === "focus" ? "full" : "focus");
        this._smart_back = false;
        this.$wrap.toggleClass("noc-h", this.mode === "full" && this.layout === "horizontal");
        try { localStorage.setItem("noc_mode", this.mode); } catch (e) {}
        this.$wrap.toggleClass("noc-focus-mode", this.mode === "focus");
        this.update_buttons();
        this.render();
    }

    set_focus(id) {
        this.focus_id = id;
        this.render();
        this.$canvas.scrollTop(0);
    }

    render_focus() {
        let id = this.focus_id;
        if (id && !(id in this.parent) && !this.roots.includes(id)) id = null;
        const loose = this.roots.filter((r) => this.kind(r) !== "dept" && !(this.children[r] || []).length);
        const trees = this.roots.filter((r) => !loose.includes(r));
        if (!id && trees.length === 1) id = trees[0];
        this._focus_center = id;

        const card = (k) => {
            const kind = this.kind(k);
            return kind === "dept" ? this.dept_card(k, "") : kind === "vac" ? this.vac_card(k) : this.emp_card(k, "");
        };
        const grid = (ids) =>
            `<div class="noc-f-grid" style="grid-template-columns: repeat(${Math.min(5, ids.length)}, var(--noc-card-w))">${ids.map(card).join("")}</div>`;
        const line = '<div class="noc-f-line"></div>';
        let html = "";

        if (!id) {
            html = trees.length
                ? `<div class="noc-f-title">${__("Top Level")}<span class="noc-loose-count">${trees.length}</span></div>${grid(trees)}`
                : "";
        } else {
            const chain = [];
            let p = this.parent[id];
            while (p) {
                chain.unshift(p);
                p = this.parent[p];
            }
            if (trees.length > 1) html += `<button class="btn btn-default btn-xs noc-f-top">${__("Top Level")}</button>${line}`;
            chain.forEach((a) => (html += `<div class="noc-f-chain">${card(a)}</div>${line}`));
            html += `<div class="noc-f-center">${card(id)}</div>`;

            const kids = this.children[id] || [];
            html += kids.length
                ? `${line}<div class="noc-f-title">${this.kind(id) === "dept" ? __("In this department") : __("Direct Reports")}<span class="noc-loose-count">${kids.length}</span></div>${grid(kids)}`
                : `<div class="noc-f-empty">${__("No direct reports")}</div>`;
        }
        if (loose.length && (!id || !this.parent[id])) {
            html += `<div class="noc-f-loose"><div class="noc-f-title">${noc_icon("users")}${__("No manager assigned")}<span class="noc-loose-count">${loose.length}</span></div>${grid(loose)}</div>`;
        }
        this.$stage.html(`<div class="noc-focus">${html}</div>`);
    }

    toggle_layout() {
        this.layout = this.layout === "vertical" ? "horizontal" : "vertical";
        try { localStorage.setItem("noc_layout", this.layout); } catch (e) {}
        this.$wrap.toggleClass("noc-h", this.layout === "horizontal");
        this.update_buttons();
        this.render();
    }

    fit() {
        this.set_scale(1);
        const el = this.$stage[0], c = this.$canvas[0];
        const s = Math.min(1, (c.clientWidth - 20) / el.scrollWidth, (c.clientHeight - 20) / el.scrollHeight);
        this.set_scale(Math.floor(s * 10) / 10);
        c.scrollLeft = 0;
        c.scrollTop = 0;
    }

    toggle_merge() {
        this.merge_depts = !this.merge_depts;
        this.update_buttons();
        this.highlight = null;
        this.build();
        this.expanded = new Set(this.view === "department" ? [] : this.roots);
        this.level = this.view === "department" ? 0 : 1;
        this.update_buttons();
        this.render();
    }

    set_edit(on) {
        this.edit_mode = on;
        this.$wrap.toggleClass("noc-editing", on);
        this.update_buttons();
    }

    update_buttons() {
        if (!this.$tb) return;
        const tb = this.$tb;
        const dept = this.view === "department";
        const focus = this.mode === "focus";
        this.$wrap && this.$wrap.toggleClass("noc-dept-view", dept);

        tb.find('[data-seg="mode"] button').each((_, b) => $(b).toggleClass("active", $(b).data("v") === this.mode));
        tb.find('[data-seg="view"] button').each((_, b) => $(b).toggleClass("active", $(b).data("v") === this.view));
        tb.find('[data-seg="mode"] [data-v="smart"]').prop("disabled", dept)
            .attr("title", dept ? __("Not available for departments") : "");

        const opt = (act, on, enabled = true) =>
            tb.find(`[data-act="${act}"]`).toggleClass("active", !!on).toggleClass("disabled", !enabled);
        opt("vacancies", this.show_vacancies);
        opt("moved", this.show_moved, this.mode === "smart");
        tb.find('[data-act="settings"], .noc-settings-div').toggle(this.can_edit);
        this.$wrap && this.$wrap.toggleClass("noc-hide-moved", !this.show_moved);
        opt("merge", this.merge_depts, dept);
        opt("layout-v", this.layout === "vertical", this.mode === "full");
        opt("layout-h", this.layout === "horizontal", this.mode === "full");
        opt("edit", this.edit_mode, this.can_edit && !dept);
        tb.find('[data-act="edit"], .noc-edit-div').toggle(this.can_edit);
        tb.find(".noc-opt-btn").toggleClass("active", this.edit_mode);

        tb.find(".noc-lv").toggleClass("is-disabled", focus);
        tb.find(".noc-lv button").prop("disabled", focus);
        if (!focus) {
            tb.find('[data-lv="minus"]').prop("disabled", this.level === 0);
            tb.find('[data-lv="plus"]').prop("disabled", this.level === "all");
        }
        tb.find(".noc-lv-val").text(
            focus ? "—"
                : this.level === "all" ? __("All levels")
                : this.level === 0 ? __("Collapsed")
                : this.level ? __("Level {0}", [this.level])
                : __("Custom"));
    }

    // ---------- helpers ----------
    kind(id) {
        return id.startsWith("d:") ? "dept" : id.startsWith("v:") ? "vac" : "emp";
    }

    color(company) {
        if (this.company_colors && this.company_colors[company]) return this.company_colors[company];
        const i = this.company_index[company];
        return i == null ? "var(--gray-400)" : NOC_COLORS[i % NOC_COLORS.length];
    }

    clean_dept(d) {
        return (d || "").replace(/\s-\s[^-]+$/, "");
    }

    // first + last name on cards; keeps compound first names (Abdul Naji) and family prefixes (Al Shammari)
    short_name(full) {
        const p = (full || "").trim().split(/\s+/);
        if (p.length <= 2) return p.join(" ");
        const lead = ["abdul", "abd", "abdel", "abdal", "abu", "abo"];
        const pre = ["al", "el", "bin", "bint", "ibn", "abu", "abdul", "abdel", "abd"];
        const first = lead.includes(p[0].toLowerCase()) ? p.slice(0, 2) : p.slice(0, 1);
        let last = p.slice(-1);
        if (p.length - first.length > 2 && pre.includes(p[p.length - 2].toLowerCase())) last = p.slice(-2);
        return first.length + last.length >= p.length ? p.join(" ") : [...first, ...last].join(" ");
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
        return this.$stage.find(`.noc-card[data-id="${CSS.escape(id)}"]:not(.noc-moved)`)[0];
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
        this.clear_path();
        if (!this.roots.length) {
            this.$stage.html(`<div class="text-muted">${__("No active employees found")}</div>`);
            return;
        }
        if (this.mode === "focus") {
            this.render_focus();
            return this.draw_minimap();
        }
        if (!this._in_fit) {
            this._in_fit = true;
            this._compact = false;
            this.render();
            if (!this.$wrap.hasClass("noc-h") && this.$stage[0].scrollWidth > this.$canvas[0].clientWidth + 4) {
                this._compact = true;
                this.render();
            }
            this._in_fit = false;
            this.draw_minimap();
            return;
        }
        // real trees on top; employees with no manager and no team go to a compact grid below
        const trees = [], loose = [];
        this.roots.forEach((id) =>
            (this.kind(id) !== "dept" && !(this.children[id] || []).length ? loose : trees).push(id));
        this.$stage.empty();
        if (trees.length) {
            const $ul = $('<ul class="noc-root"></ul>');
            trees.forEach((id) => $ul.append(this.node(id)));
            this.$stage.append($ul);
        }
        if (loose.length) {
            const $sec = $(`
                <div class="noc-loose">
                    <div class="noc-loose-title">${noc_icon("users")}${__("No manager assigned")}<span class="noc-loose-count">${loose.length}</span></div>
                    <ul class="noc-loose-grid" style="grid-template-columns: repeat(${Math.min(6, loose.length)}, var(--noc-card-w))"></ul>
                </div>`);
            const $g = $sec.find(".noc-loose-grid");
            loose.forEach((id) => $g.append(this.node(id)));
            this.$stage.append($sec);
        }
    }

    node(id, in_grid = false) {
        const kids = this.children[id] || [];
        const open = in_grid ? this.drill_open(id) : this.expanded.has(id);
        const toggle = kids.length
            ? `<button class="noc-toggle" title="${__("Expand / Collapse")}">${noc_icon(open ? "chevron_up" : "chevron_down")}</button>`
            : "";
        const kind = this.kind(id);
        const card = kind === "dept" ? this.dept_card(id, toggle) : kind === "vac" ? this.vac_card(id) : this.emp_card(id, toggle);

        const $li = $('<li class="noc-node"></li>').append(card);
        if (in_grid && open) $li.children(".noc-card").addClass("noc-moved");
        if (!in_grid && kids.length && open) $li.append(this.kids_block(id));
        return $li;
    }

    is_grid(id) {
        return this.mode === "smart" && (this.children[id] || []).length > NOC_GRID_AT;
    }

    drill_open(id) {
        const p = this.parent[id];
        return !!p && (this.drill[p] || []).includes(id);
    }

    kids_block(id) {
        const kids = this.children[id] || [];
        if (!this.is_grid(id)) {
            const all_leaves = kids.every((k) => !(this.children[k] || []).length);
            const leaves = all_leaves && (this._compact ? kids.length > 1 : this.mode === "full" && kids.length > 4);
            const $ul = $(`<ul class="noc-children${leaves ? " noc-leaf-grid" : ""}"></ul>`);
            if (leaves) $ul[0].style.setProperty("--noc-cols", this._compact ? (kids.length > 8 ? 2 : 1) : Math.min(4, kids.length));
            kids.forEach((k) => $ul.append(this.node(k)));
            return $ul;
        }
        // many reports: an even grid; one member at a time opens their team below it
        const $wrap = $('<div class="noc-grid-wrap"></div>');
        const $ul = $(`<ul class="noc-children noc-grid-level" data-parent="${esc(id)}"></ul>`);
        $ul[0].style.setProperty("--noc-cols", Math.min(5, kids.length));
        kids.forEach((k) => $ul.append(this.node(k, true)));
        $wrap.append($ul);

        const open = kids.filter((k) => (this.drill[id] || []).includes(k) && (this.children[k] || []).length);
        const $drills = $('<div class="noc-drills"></div>');
        open.forEach((d) => {
            const toggle = `<button class="noc-toggle" title="${__("Collapse")}">${noc_icon("chevron_up")}</button>`;
            const card = this.kind(d) === "dept" ? this.dept_card(d, toggle) : this.emp_card(d, toggle);
            const $li = $('<li class="noc-node"></li>').append(card);
            $li.children(".noc-card").addClass("noc-drill-head").attr("data-parent", id);
            $li.append(this.kids_block(d));
            const $sec = $(`<div class="noc-drill" data-of="${esc(d)}"></div>`);
            $sec.append($('<ul class="noc-root noc-drill-root"></ul>').append($li));
            $drills.append($sec);
        });
        if (open.length) $wrap.append($drills);
        return $wrap;
    }

    // grid member (or its faded placeholder) opens/closes its team below; the moved card's arrow closes it
    drill_toggle(card, from_toggle) {
        const head = card.classList.contains("noc-drill-head");
        const $g = $(card).closest(".noc-grid-level");
        if (head && !from_toggle) return false;
        if (!head && !$g.length) return false;
        const id = card.getAttribute("data-id");
        if (!(this.children[id] || []).length) return false;
        const p = head ? card.getAttribute("data-parent") : $g.attr("data-parent");
        const list = (this.drill[p] ||= []);
        const i = list.indexOf(id);
        i >= 0 ? list.splice(i, 1) : list.push(id);
        this.level = null;
        this.update_buttons();
        this.render();
        const target = i < 0
            ? this.$stage.find(`.noc-drill[data-of="${CSS.escape(id)}"]`)[0]
            : this.$stage.find(`.noc-grid-level[data-parent="${CSS.escape(p)}"]`)[0];
        target && target.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return true;
    }

    emp_card(id, toggle) {
        const e = this.by_id[id];
        const dept = this.clean_dept(e.department);
        const direct = (this.reports[id] || []).length;
        const total = this.team(id);
        const top = this.view === "employee" && direct > 0 && !this.by_id[e.reports_to];
        const cls = [id === this.highlight ? "noc-hit" : "", id === this.selected ? "noc-selected" : "", top ? "noc-top" : ""].join(" ");
        const drag = this.edit_mode && this.view === "employee" ? 'draggable="true"' : "";
        const meta = [
            dept ? `<div class="noc-meta-row">${noc_icon("building")}<span class="noc-tx">${esc(dept)}</span></div>` : "",
            e.branch ? `<div class="noc-meta-row">${noc_icon("pin")}<span class="noc-tx">${esc(e.branch)}</span></div>` : "",
        ].join("");

        return `
            <div class="noc-card ${cls}" data-id="${esc(id)}" ${drag} style="--noc-co:${this.color(e.company)}">
                <span class="noc-co-dot" style="background:${this.color(e.company)}" title="${esc(e.company)}"></span>
                <div class="noc-card-head">
                    ${this.avatar(e)}
                    <div class="noc-info">
                        <div class="noc-name" title="${esc(e.employee_name)}">${top
                            ? `<span class="noc-crown-ic" title="${__("Head")}">${noc_icon("crown")}</span>`
                            : direct ? `<span class="noc-mgr-ic" title="${__("Manager")}">${noc_icon("briefcase")}</span>` : ""}${esc(this.short_name(e.employee_name))}</div>
                        ${e.designation ? `<div class="noc-sub">${esc(e.designation)}</div>` : ""}
                        <div class="noc-bottom">
                            <span class="noc-code">${esc(id)}</span>${this.badges(e)}
                            ${total ? `<span class="noc-team" title="${__("Direct reports / Total team")}">${noc_icon("users")}${direct} / ${total}</span>` : ""}
                        </div>
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
                ${d.company ? `<span class="noc-co-dot" style="background:${this.color(d.company)}" title="${esc(d.company)}"></span>` : ""}
                <div class="noc-card-head">
                    <span class="noc-dept-icon">${noc_icon("building")}</span>
                    <div class="noc-info">
                        <div class="noc-name" title="${esc(d.department_name || name)}">${esc(d.department_name || name)}</div>
                        ${companies.length > 1
                            ? `<div class="noc-sub noc-co-dots">${companies.map((c) => `<span class="noc-dot" title="${esc(c)}" style="background:${this.color(c)}"></span>`).join("")}</div>`
                            : d.company ? `<div class="noc-sub noc-co-dots"><span class="noc-dot" title="${esc(d.company)}" style="background:${this.color(d.company)}"></span></div>` : ""}
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
                <span class="noc-co-dot" style="background:${this.color(v.company)}" title="${esc(v.company)}"></span>
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
        if (this.mode === "focus") {
            this.highlight = id;
            return this.set_focus(id);
        }
        let p = this.parent[id];
        while (p) {
            this.expanded.add(p);
            const pp = this.parent[p];
            if (pp && this.is_grid(pp) && !(this.drill[pp] ||= []).includes(p)) this.drill[pp].push(p);
            p = pp;
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
        this.spotlight(hit.name);
    }

    // keep the point under (cx, cy) fixed on screen while zooming
    zoom_at(s, cx, cy) {
        const c = this.$canvas[0];
        const r = c.getBoundingClientRect();
        const mx = cx - r.left, my = cy - r.top;
        const old = this.scale;
        const px = (c.scrollLeft + mx) / old, py = (c.scrollTop + my) / old;
        this.set_scale(s);
        if (this.scale === old) return;
        c.scrollLeft = px * this.scale - mx;
        c.scrollTop = py * this.scale - my;
    }

    set_scale(s) {
        this.scale = Math.min(2, Math.max(0.3, Math.round(s * 10) / 10));
        this.$stage.css("zoom", this.scale);
        this.$wrap.find('[data-z="reset"]').text(Math.round(this.scale * 100) + "%");
        this.draw_minimap();
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
        const $head = $(this.export_head()).prependTo(this.$stage);
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
            $head.remove();
            this.$wrap.removeClass("noc-exporting");
            this.set_scale(prev);
        }
    }

    // ---------- path highlight ----------
    light_path(id) {
        if (this._drag || !id || !this.card_el(id)) return;
        this.clear_path();
        const co = getComputedStyle(this.card_el(id)).getPropertyValue("--noc-co").trim();
        this.$stage[0].style.setProperty("--noc-path", co || "var(--primary)");
        let x = id;
        while (x) {
            const $c = this.$stage.find(`.noc-card[data-id="${CSS.escape(x)}"]`).addClass("noc-on-path");
            if (this.parent[x]) {
                const $li = $c.closest(".noc-node").addClass("noc-pl");
                $li.parent().addClass("noc-pu");
            }
            x = this.parent[x];
        }
        this.$stage.addClass("noc-pathing");
    }

    clear_path() {
        if (!this.$stage) return;
        this.$stage.removeClass("noc-pathing")
            .find(".noc-on-path, .noc-pl, .noc-pu").removeClass("noc-on-path noc-pl noc-pu");
    }

    // ---------- search spotlight ----------
    spotlight(id) {
        const el = this.card_el(id);
        if (!el) return;
        clearTimeout(this._spot_t);
        this.$stage.find(".noc-spot").removeClass("noc-spot");
        this.$stage.addClass("noc-spotlight");
        $(el).addClass("noc-spot");
        this._spot_t = setTimeout(() => {
            this.$stage.removeClass("noc-spotlight").find(".noc-spot").removeClass("noc-spot");
        }, 1900);
    }

    // ---------- status badges: on leave / new joiner / work anniversary ----------
    badges(e) {
        const out = [];
        const today = moment().startOf("day");
        if (this.on_leave && this.on_leave.has(e.name)) out.push(["leave", "plane", __("On leave today")]);
        if (e.date_of_joining) {
            const j = moment(e.date_of_joining);
            const since = today.diff(j, "days");
            if (since >= 0 && since <= 90) out.push(["new", "sparkle", __("New joiner · {0} days", [since])]);
            const next = j.clone().year(today.year());
            if (next.isBefore(today)) next.add(1, "year");
            const yrs = next.diff(j, "years");
            if (yrs >= 1 && next.diff(today, "days") <= 7) {
                out.push(["anniv", "cake", __("{0} years on {1}", [yrs, next.format("D MMM")])]);
            }
        }
        return out.length
            ? `<span class="noc-badges">${out.map(([k, i, t]) => `<span class="noc-badge noc-b-${k}" title="${esc(t)}">${noc_icon(i)}</span>`).join("")}</span>`
            : "";
    }

    // ---------- KPI bar ----------
    render_stats() {
        if (!this.$kpi) return;
        const teams = Object.values(this.reports || {}).filter((r) => r.length);
        const mgrs = teams.length;
        const span = mgrs ? teams.reduce((n, r) => n + r.length, 0) / mgrs : 0;
        const vac = (this.vacancies || []).reduce((n, v) => n + (cint(v.planned_vacancies) || 1), 0);
        const leave = this.on_leave ? this.on_leave.size : 0;
        const item = (icon, val, label) => `<span class="noc-kpi">${noc_icon(icon)}<b>${val}</b><span>${label}</span></span>`;
        this.$kpi.html([
            item("users", this.employees.length, __("Employees")),
            item("briefcase", mgrs, __("Managers")),
            item("hash", span ? span.toFixed(1) : "0", __("Avg team")),
            vac ? item("award", vac, __("Open positions")) : "",
            leave ? item("plane", leave, __("On leave")) : "",
        ].join(""));
    }

    // ---------- minimap ----------
    setup_minimap() {
        this.$mini = $(`<div class="noc-minimap" title="${__("Drag to navigate")}"><canvas></canvas><div class="noc-mini-view"></div></div>`)
            .appendTo(this.$wrap).hide();
        this.$canvas.on("scroll", () => this.update_minimap_view());
        this.$mini.on("mousedown", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const go = (e2) => {
                const r = this.$mini.find("canvas")[0].getBoundingClientRect();
                const c = this.$canvas[0], k = this._mini_k || 1;
                c.scrollLeft = (e2.clientX - r.left) / k - c.clientWidth / 2;
                c.scrollTop = (e2.clientY - r.top) / k - c.clientHeight / 2;
            };
            go(ev);
            $(document).on("mousemove.nocmini", go).one("mouseup", () => $(document).off("mousemove.nocmini"));
        });
    }

    draw_minimap() {
        if (!this.$mini) return;
        const c = this.$canvas[0];
        const W = c.scrollWidth, H = c.scrollHeight;
        const show = this.mode !== "focus" && (W > c.clientWidth + 4 || H > c.clientHeight + 4);
        this.$mini.toggle(show);
        if (!show) return;
        const k = Math.min(190 / W, 120 / H);
        this._mini_k = k;
        const cw = Math.max(40, Math.round(W * k)), ch = Math.max(30, Math.round(H * k));
        const cv = this.$mini.find("canvas")[0];
        const dpr = window.devicePixelRatio || 1;
        cv.width = cw * dpr;
        cv.height = ch * dpr;
        cv.style.width = cw + "px";
        cv.style.height = ch + "px";
        const g = cv.getContext("2d");
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, cw, ch);
        const base = c.getBoundingClientRect();
        this.$stage.find(".noc-card").each((_, el) => {
            const r = el.getBoundingClientRect();
            g.globalAlpha = el.classList.contains("noc-moved") ? 0.25 : 0.8;
            g.fillStyle = getComputedStyle(el).getPropertyValue("--noc-co").trim() || "#9ca3af";
            g.fillRect((r.left - base.left + c.scrollLeft) * k, (r.top - base.top + c.scrollTop) * k,
                Math.max(2, r.width * k), Math.max(2, r.height * k));
        });
        this.update_minimap_view();
    }

    update_minimap_view() {
        if (!this.$mini || !this.$mini.is(":visible")) return;
        const c = this.$canvas[0], k = this._mini_k || 1;
        this.$mini.find(".noc-mini-view").css({
            left: c.scrollLeft * k, top: c.scrollTop * k,
            width: c.clientWidth * k, height: c.clientHeight * k,
        });
    }

    // ---------- branded export header ----------
    export_head() {
        const logo = frappe.boot.app_logo_url || "";
        const co = this.company.get_value() || __("All Companies");
        const view = this.view === "employee" ? __("Employees") : __("Departments");
        const meta = [co, view, __("{0} employees", [this.employees.length]),
            frappe.datetime.str_to_user(frappe.datetime.get_today())].join("  ·  ");
        return `
            <div class="noc-export-head">
                ${logo ? `<img src="${encodeURI(logo)}" alt="">` : ""}
                <div>
                    <div class="noc-export-title">${__("Organization Chart")}</div>
                    <div class="noc-export-meta">${esc(meta)}</div>
                </div>
            </div>`;
    }

    // ---------- contact: WhatsApp + Teams ----------
    async load_contact(id) {
        this._contact ||= {};
        if (id in this._contact) return this._contact[id];
        try {
            const r = await frappe.call({ method: NOC_API + "get_employee_card", args: { employee: id } });
            this._contact[id] = r.message || null;
        } catch (err) {
            this._contact[id] = null;
        }
        return this._contact[id];
    }

    // local numbers: 05xxxxxxxx -> Saudi (966), 01xxxxxxxxx -> Egypt (20); +/00 numbers kept as is
    wa_number(n) {
        if (!n) return "";
        let s = String(n).trim();
        const intl = s.startsWith("+") || s.startsWith("00");
        s = s.replace(/\D/g, "");
        if (s.startsWith("00")) s = s.slice(2);
        if (!intl) {
            if (/^05\d{8}$/.test(s)) s = "966" + s.slice(1);
            else if (/^01\d{9}$/.test(s)) s = "20" + s.slice(1);
        }
        return s.length >= 8 ? s : "";
    }

    contact_actions(d) {
        const btns = [];
        const wa = this.wa_number(d.cell_number);
        if (wa) {
            btns.push(`<a class="noc-contact noc-wa" href="https://wa.me/${wa}" target="_blank" rel="noopener">${noc_icon("whatsapp")}${__("WhatsApp")}</a>`);
        }
        if (d.company_email) {
            btns.push(`<a class="noc-contact noc-teams" href="https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(d.company_email)}" target="_blank" rel="noopener">${noc_icon("teams")}${__("Teams")}</a>`);
        }
        return btns.length ? `<div class="noc-contacts">${btns.join("")}</div>` : "";
    }

    // ---------- hover card ----------
    show_hover(id, el) {
        const e = this.by_id[id];
        if (!e || !el.isConnected) return;
        clearTimeout(this._hide_t);
        this._hover_id = id;
        this.$hover.html(this.hover_html(e)).addClass("open");
        this.load_contact(id).then((c) => {
            if (this._hover_id !== id || !c) return;
            const html = this.contact_actions(c);
            if (html) this.$hover.find(".noc-hover-actions").before(html);
        });
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
                ${this.contact_actions(d)}
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
