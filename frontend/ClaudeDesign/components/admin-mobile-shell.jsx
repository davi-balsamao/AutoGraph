/* Autograph Admin Mobile — Shell, bottom tab bar, shared UI for admin mobile screens.
   Reuses theme(dark), PhoneShell, AGLogoMark from app-ui.jsx. */

// Admin mobile uses the same brand palette as everything else.
const ADM = {
  green: "#00ed64",
  greenDark: "#00684a",
  greenMid: "#00a35c",
  greenSoft: "#c3f0d2",
  tealDeep: "#001e2b",
  teal: "#003d4f",
  accentPurple: "#7b3ff2",
  accentOrange: "#fa6e39",
  accentBlue: "#3d4f9f",
  accentPink: "#f06bb8",
  danger: "#d64545",
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
};

// ─────────────── Admin bottom tab bar ───────────────
const ADMIN_TAB_ICONS = {
  home: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="9" rx="1.5"/>
      <rect x="13" y="3" width="8" height="6" rx="1.5"/>
      <rect x="13" y="11" width="8" height="10" rx="1.5"/>
      <rect x="3" y="14" width="8" height="7" rx="1.5"/>
    </svg>
  ),
  kanban: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="5" height="16" rx="1"/>
      <rect x="10" y="4" width="5" height="10" rx="1"/>
      <rect x="17" y="4" width="4" height="14" rx="1"/>
    </svg>
  ),
  chat: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.8-4.7C3.7 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"/>
    </svg>
  ),
  orders: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke={active ? ADM.tealDeep : "currentColor"}/>
    </svg>
  ),
  more: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="19" cy="12" r="1.5"/>
    </svg>
  ),
};

function AdminTabBar({ active = "home", badge = {}, dark = false }) {
  const T = theme(dark);
  const tabs = [
    { key: "home", label: "Geral" },
    { key: "kanban", label: "OSs" },
    { key: "chat", label: "Chat" },
    { key: "orders", label: "Pedidos" },
    { key: "more", label: "Mais" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: T.tabBarBg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${T.border}`,
      padding: "8px 6px 22px",
      display: "flex", justifyContent: "space-around",
      zIndex: 20,
    }}>
      {tabs.map(t => {
        const isActive = t.key === active;
        const color = isActive ? (dark ? ADM.green : ADM.tealDeep) : (dark ? "#7c8c9a" : "#7c8c9a");
        return (
          <div key={t.key} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color, position: "relative",
            padding: "6px 0",
          }}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              {ADMIN_TAB_ICONS[t.key](isActive)}
              {badge[t.key] && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 8,
                  background: ADM.green, color: ADM.tealDeep,
                  fontSize: 10, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${T.bg}`,
                }}>{badge[t.key]}</span>
              )}
            </span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────── Admin mobile header ───────────────
function AdminMobileHeader({ title, subtitle, back = false, actions, dark = false }) {
  const T = theme(dark);
  return (
    <div style={{
      padding: "10px 16px 12px",
      display: "flex", alignItems: "center", gap: 10,
      background: T.bg,
      borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      {back && (
        <button style={{
          width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: -0.3, lineHeight: 1.15 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

// ─────────────── Compact admin buttons ───────────────
function AdmBtn({ variant = "primary", icon, children, size = "md", style = {}, dark = false }) {
  const styles = {
    primary: { bg: ADM.green, fg: ADM.tealDeep, border: "transparent" },
    secondary: { bg: "transparent", fg: dark ? "#fff" : ADM.tealDeep, border: dark ? "#2a3d4a" : "#c1ccd6" },
    ghost: { bg: "transparent", fg: dark ? "#fff" : "#1c2d38", border: "transparent" },
    dark: { bg: ADM.tealDeep, fg: "#fff", border: "transparent" },
  };
  const s = styles[variant];
  const pad = size === "sm" ? "5px 10px" : (size === "lg" ? "12px 22px" : "8px 14px");
  const font = size === "sm" ? 11 : 12;
  return (
    <button style={{
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      borderRadius: 9999, padding: pad, fontSize: font, fontWeight: 600,
      fontFamily: ADM.font, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

// ─────────────── Compact card ───────────────
function AdmCard({ children, padding = 14, style = {}, dark = false }) {
  const T = theme(dark);
  return (
    <div style={{
      background: T.bgElevated, border: `1px solid ${T.border}`,
      borderRadius: 12, padding,
      ...style,
    }}>{children}</div>
  );
}

// ─────────────── Badge (compact for mobile) ───────────────
function AdmBadge({ children, color = "soft", size = "sm" }) {
  const palettes = {
    soft: { bg: ADM.greenSoft, fg: ADM.greenDark },
    green: { bg: ADM.green, fg: ADM.tealDeep },
    purple: { bg: ADM.accentPurple, fg: "#fff" },
    orange: { bg: ADM.accentOrange, fg: "#fff" },
    blue: { bg: ADM.accentBlue, fg: "#fff" },
    teal: { bg: ADM.tealDeep, fg: ADM.green },
    gray: { bg: "#f4f7f6", fg: "#5c6c7a" },
    warning: { bg: "#fff8e0", fg: "#946f3f" },
    danger: { bg: "#fde8e8", fg: ADM.danger },
  };
  const p = palettes[color] || palettes.soft;
  return (
    <span style={{
      display: "inline-block",
      background: p.bg, color: p.fg,
      fontSize: size === "sm" ? 9 : 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
      padding: size === "sm" ? "2px 6px" : "3px 8px",
      borderRadius: 9999,
    }}>{children}</span>
  );
}

// Tag (square style, for product categories)
function AdmTag({ children, color = "green" }) {
  const palettes = {
    soft: { bg: ADM.greenSoft, fg: ADM.greenDark },
    green: { bg: ADM.greenMid, fg: "#fff" },
    purple: { bg: ADM.accentPurple, fg: "#fff" },
    orange: { bg: ADM.accentOrange, fg: "#fff" },
    blue: { bg: ADM.accentBlue, fg: "#fff" },
  };
  const p = palettes[color] || palettes.green;
  return (
    <span style={{
      display: "inline-block",
      background: p.bg, color: p.fg,
      fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
      padding: "2px 6px", borderRadius: 4,
    }}>{children}</span>
  );
}

// ─────────────── Greeting block (used in dashboard) ───────────────
function GreetingBlock({ dark = false }) {
  const T = theme(dark);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px 10px",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9999,
        background: ADM.green, color: ADM.tealDeep,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 14,
      }}>D</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.textMuted }}>Bom dia,</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.1 }}>Davi Balsamão</div>
      </div>
      <button style={{
        width: 36, height: 36, borderRadius: 9999,
        background: T.surface, border: `1px solid ${T.border}`,
        position: "relative",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="1.8">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/>
          <path d="M10 21a2 2 0 0 0 4 0"/>
        </svg>
        <span style={{
          position: "absolute", top: 7, right: 8,
          width: 8, height: 8, borderRadius: 4, background: ADM.accentOrange, border: `2px solid ${T.bg}`,
        }}/>
      </button>
    </div>
  );
}

Object.assign(window, {
  ADM, AdminTabBar, AdminMobileHeader, AdmBtn, AdmCard, AdmBadge, AdmTag, GreetingBlock,
});
