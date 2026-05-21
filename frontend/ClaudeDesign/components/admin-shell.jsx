/* Autograph Admin — Shell, sidebar, topbar, and shared UI primitives. */

// Admin uses the same brand palette as the mobile app.
const ADMIN = {
  green: "#00ed64",
  greenDark: "#00684a",
  greenMid: "#00a35c",
  greenSoft: "#c3f0d2",
  tealDeep: "#001e2b",
  teal: "#003d4f",
  tealMid: "#00684a",
  ink: "#001e2b",
  charcoal: "#1c2d38",
  slate: "#3d4f5b",
  steel: "#5c6c7a",
  stone: "#7c8c9a",
  muted: "#a8b3bc",
  canvas: "#ffffff",
  surface: "#f9fbfa",
  surfaceSoft: "#f4f7f6",
  surfaceFeature: "#e3fcef",
  hairline: "#e1e5e8",
  hairlineSoft: "#eceff1",
  hairlineStrong: "#c1ccd6",
  accentPurple: "#7b3ff2",
  accentOrange: "#fa6e39",
  accentBlue: "#3d4f9f",
  accentPink: "#f06bb8",
  warning: "#fff8e0",
  warningText: "#946f3f",
  danger: "#d64545",
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
};

// ─────────────── Sidebar ───────────────
function AdminSidebar({ active = "dashboard" }) {
  const items = [
    { id: "dashboard", label: "Visão geral", icon: <DashIcon/> },
    { id: "kanban", label: "Ordens de serviço", icon: <KanbanIcon/>, badge: 12 },
    { id: "chat", label: "Atendimento", icon: <ChatIcon/>, badge: 3 },
    { id: "orders", label: "Histórico de pedidos", icon: <OrdersIcon/> },
    { id: "finance", label: "Financeiro", icon: <FinanceIcon/> },
    { id: "catalog", label: "Catálogo", icon: <CatalogIcon/> },
    { id: "users", label: "Usuários", icon: <UsersIcon/> },
  ];
  return (
    <aside style={{
      width: 240, flexShrink: 0, background: ADMIN.tealDeep, color: "#fff",
      display: "flex", flexDirection: "column",
      borderRight: `1px solid ${ADMIN.charcoal}`,
    }}>
      {/* Brand */}
      <div style={{ padding: "20px 18px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <AGLogoMark size={30} bg={ADMIN.green} stroke={ADMIN.tealDeep}/>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>
            Auto<span style={{ color: ADMIN.green }}>graph</span>
          </div>
          <div style={{ fontSize: 10, color: ADMIN.muted, fontWeight: 500, letterSpacing: 0.6 }}>PAINEL ADMIN</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${ADMIN.charcoal}`,
          borderRadius: 8, padding: "8px 10px",
          fontSize: 12, color: ADMIN.muted,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <span>Buscar pedido, cliente…</span>
          <span style={{ marginLeft: "auto", fontFamily: ADMIN.mono, fontSize: 10, padding: "1px 6px", border: `1px solid ${ADMIN.charcoal}`, borderRadius: 4 }}>⌘K</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "4px 8px", flex: 1, overflow: "auto" }}>
        {items.map(it => {
          const isActive = it.id === active;
          return (
            <div key={it.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, marginBottom: 2,
              background: isActive ? "rgba(0,237,100,.10)" : "transparent",
              color: isActive ? ADMIN.green : "rgba(255,255,255,.78)",
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              cursor: "pointer", position: "relative",
            }}>
              {isActive && <div style={{ position: "absolute", left: -8, top: 6, bottom: 6, width: 3, borderRadius: 2, background: ADMIN.green }}/>}
              <span style={{ display: "inline-flex", width: 18, justifyContent: "center" }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge && (
                <span style={{
                  background: isActive ? ADMIN.green : "rgba(255,255,255,.08)",
                  color: isActive ? ADMIN.ink : "#fff",
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", borderRadius: 9999,
                  minWidth: 18, textAlign: "center",
                }}>{it.badge}</span>
              )}
            </div>
          );
        })}

        <SidebarLabel>Acesso rápido</SidebarLabel>
        <div style={navItemMuted}>
          <span style={dotStyle("#fa6e39")}/> Aprovações pendentes
        </div>
        <div style={navItemMuted}>
          <span style={dotStyle("#7b3ff2")}/> Promoções ativas
        </div>
        <div style={navItemMuted}>
          <span style={dotStyle("#3d4f9f")}/> Relatórios
        </div>
      </nav>

      {/* Profile pinned bottom */}
      <div style={{
        margin: 10, padding: 10, borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${ADMIN.charcoal}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9999,
          background: ADMIN.green, color: ADMIN.ink,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
        }}>D</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>Davi Balsamão</div>
          <div style={{ fontSize: 10, color: ADMIN.muted, marginTop: 2 }}>Gerente · Online</div>
        </div>
        <button title="Trocar tema" style={{
          width: 28, height: 28, borderRadius: 9999,
          background: "rgba(255,255,255,0.06)", border: `1px solid ${ADMIN.charcoal}`,
          color: ADMIN.green, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ADMIN.muted} strokeWidth="2"><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></svg>
      </div>
    </aside>
  );
}

const navItemMuted = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "8px 12px", borderRadius: 8, marginBottom: 2,
  color: "rgba(255,255,255,.6)", fontSize: 12,
};
const dotStyle = (c) => ({
  width: 7, height: 7, borderRadius: 4, background: c, display: "inline-block",
});

function SidebarLabel({ children }) {
  return (
    <div style={{
      padding: "16px 12px 6px", fontSize: 10, fontWeight: 600, letterSpacing: 1,
      textTransform: "uppercase", color: "rgba(255,255,255,.4)",
    }}>{children}</div>
  );
}

// ─────────────── Top bar ───────────────
function AdminTopBar({ title, subtitle, actions, breadcrumb }) {
  return (
    <header style={{
      padding: "18px 28px", borderBottom: `1px solid ${ADMIN.hairline}`,
      background: "#fff", display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumb && (
          <div style={{ fontSize: 11, color: ADMIN.steel, fontWeight: 500, marginBottom: 4 }}>
            {breadcrumb}
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: ADMIN.ink }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: ADMIN.steel, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </header>
  );
}

// ─────────────── Shell ───────────────
function AdminShell({ active, children, topBar }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex",
      fontFamily: ADMIN.font, color: ADMIN.ink,
      background: ADMIN.surface,
    }}>
      <AdminSidebar active={active}/>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {topBar}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ─────────────── Buttons ───────────────
function AdminBtn({ variant = "primary", icon, children, size = "md", style = {} }) {
  const styles = {
    primary: { bg: ADMIN.green, fg: ADMIN.ink, border: "transparent" },
    secondary: { bg: "transparent", fg: ADMIN.ink, border: ADMIN.hairlineStrong },
    ghost: { bg: "transparent", fg: ADMIN.charcoal, border: "transparent" },
    dark: { bg: ADMIN.ink, fg: "#fff", border: "transparent" },
    danger: { bg: "transparent", fg: ADMIN.danger, border: ADMIN.danger },
  };
  const s = styles[variant];
  const pad = size === "sm" ? "6px 12px" : (size === "lg" ? "12px 22px" : "8px 16px");
  const font = size === "sm" ? 12 : 13;
  return (
    <button style={{
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      borderRadius: 9999, padding: pad, fontSize: font, fontWeight: 600,
      fontFamily: ADMIN.font, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6,
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

// ─────────────── Cards / surfaces ───────────────
function Card({ children, padding = 20, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${ADMIN.hairline}`,
      borderRadius: 12, padding, ...style,
    }}>{children}</div>
  );
}

function SectionHeading({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 14, gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: ADMIN.steel, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// ─────────────── Badge ───────────────
function AdminBadge({ children, color = "soft" }) {
  const palettes = {
    soft: { bg: ADMIN.greenSoft, fg: ADMIN.greenDark },
    green: { bg: ADMIN.green, fg: ADMIN.ink },
    purple: { bg: ADMIN.accentPurple, fg: "#fff" },
    orange: { bg: ADMIN.accentOrange, fg: "#fff" },
    blue: { bg: ADMIN.accentBlue, fg: "#fff" },
    teal: { bg: ADMIN.tealDeep, fg: ADMIN.green },
    gray: { bg: ADMIN.surfaceSoft, fg: ADMIN.steel },
    warning: { bg: ADMIN.warning, fg: ADMIN.warningText },
    danger: { bg: "#fde8e8", fg: ADMIN.danger },
  };
  const p = palettes[color] || palettes.soft;
  return (
    <span style={{
      display: "inline-block",
      background: p.bg, color: p.fg,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 9999,
    }}>{children}</span>
  );
}

// ─────────────── Icons ───────────────
function DashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="8" height="9" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>;
}
function KanbanIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="14" rx="1"/></svg>;
}
function ChatIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.8-4.7C3.7 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"/></svg>;
}
function OrdersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
}
function FinanceIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h7v7"/></svg>;
}
function CatalogIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.8"/><path d="M15.5 14.5c2.5.3 5 2 5 4.5"/></svg>;
}

Object.assign(window, {
  ADMIN, AdminShell, AdminSidebar, AdminTopBar, AdminBtn, Card, SectionHeading, AdminBadge,
});
