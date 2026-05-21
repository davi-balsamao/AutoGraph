/* Shared UI primitives for Autograph mobile app.
   Brand colors, logo, status bar, bottom tab bar, app header. */

const AG = {
  green: "#00ed64",
  greenDark: "#00684a",
  greenMid: "#00a35c",
  greenSoft: "#c3f0d2",
  tealDeep: "#001e2b",
  teal: "#003d4f",
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
  font: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace",
};

// ─────────────── Theme (light / dark) ───────────────
// Returns the swappable surface/text/border tokens for a given mode.
// Brand colors (green, accents) stay constant across themes.
function theme(dark) {
  if (dark) {
    return {
      dark: true,
      bg: "#001017",            // page background (deeper than tealDeep)
      bgElevated: "#001e2b",    // cards, raised surfaces
      surface: "#0a2c3a",       // subtle section bg
      surfaceSoft: "#11364a",   // quiet section divisions
      surfaceFeature: "#003d2a",// success / mint dark alternative
      text: "#ffffff",
      textMuted: "#a8b3bc",
      textFaint: "#7c8c9a",
      border: "#1c2d38",
      borderSoft: "#162631",
      borderStrong: "#2a3d4a",
      heroBg: "#000a10",
      tabBarBg: "rgba(0,16,23,0.92)",
    };
  }
  return {
    dark: false,
    bg: "#ffffff",
    bgElevated: "#ffffff",
    surface: "#f9fbfa",
    surfaceSoft: "#f4f7f6",
    surfaceFeature: "#e3fcef",
    text: "#001e2b",
    textMuted: "#5c6c7a",
    textFaint: "#7c8c9a",
    border: "#e1e5e8",
    borderSoft: "#eceff1",
    borderStrong: "#c1ccd6",
    heroBg: "#001e2b",
    tabBarBg: "rgba(255,255,255,0.92)",
  };
}

// ─────────────── Logo ───────────────
function AGLogoMark({ size = 28, bg = AG.tealDeep, stroke = AG.green }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="8" fill={bg} />
      <path d="M9 22 L16 8 L23 22" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M12 18 L20 18" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M21 23.5 Q23.5 25 25.5 23.2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function AGWordmark({ size = 18, color = AG.ink, accent = AG.greenDark }) {
  return (
    <span style={{ fontFamily: AG.font, fontWeight: 600, fontSize: size, color, letterSpacing: -0.4 }}>
      Auto<span style={{ color: accent }}>graph</span>
    </span>
  );
}

function AGLogo({ markSize = 26, textSize = 17, color = AG.ink, accent = AG.greenDark, bg = AG.tealDeep, stroke = AG.green }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <AGLogoMark size={markSize} bg={bg} stroke={stroke} />
      <AGWordmark size={textSize} color={color} accent={accent} />
    </span>
  );
}

// ─────────────── Phone shell ───────────────
// Wraps a screen with the iOS status bar at top and home indicator at bottom,
// matching the IOSDevice frame layout, but without a navbar.
function PhoneShell({ children, dark = false, statusBarStyle, bg = AG.canvas, statusBarColor }) {
  // Status bar style: 'auto' lets us pick based on bg.
  const sbDark = statusBarStyle === "light" ? true : statusBarStyle === "dark" ? false : dark;
  return (
    <div style={{
      width: 360,
      height: 720,
      background: bg,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      fontFamily: AG.font,
      color: AG.ink,
    }}>
      <div style={{
        background: statusBarColor ?? bg,
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
      }}>
        <MiniStatusBar dark={sbDark} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
      {/* home indicator */}
      <div style={{
        position: "absolute", bottom: 6, left: 0, right: 0,
        display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 30,
      }}>
        <div style={{
          width: 120, height: 4, borderRadius: 2,
          background: dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)",
        }} />
      </div>
    </div>
  );
}

function MiniStatusBar({ dark = false }) {
  const c = dark ? "#fff" : "#000";
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 20px 6px",
      fontSize: 14, fontWeight: 600, color: c,
      fontFamily: '-apple-system, SF Pro, system-ui',
    }}>
      <span>9:41</span>
      <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c}/>
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c}/>
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c}/>
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c}/>
        </svg>
        <svg width="14" height="10" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c}/>
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c}/>
          <circle cx="8.5" cy="10.5" r="1.5" fill={c}/>
        </svg>
        <svg width="24" height="11" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c}/>
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </span>
    </div>
  );
}

// ─────────────── Header (app top bar) ───────────────
function AppHeader({ title, subtitle, dark = false, leading, trailing, bg }) {
  const text = dark ? "#fff" : AG.ink;
  const sub = dark ? AG.muted : AG.steel;
  return (
    <div style={{
      padding: "8px 20px 16px",
      display: "flex", alignItems: "center", gap: 12,
      background: bg ?? "transparent",
      borderBottom: dark ? "1px solid rgba(255,255,255,0.05)" : `1px solid ${AG.hairlineSoft}`,
    }}>
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: text, letterSpacing: -0.3, lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}

// ─────────────── Bottom Tab Bar ───────────────
const TAB_ICONS = {
  home: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" fill={active ? "currentColor" : "none"} />
    </svg>
  ),
  shop: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h18l-1.5 11a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 7z" fill={active ? "currentColor" : "none"}/>
      <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke={active ? AG.tealDeep : "currentColor"}/>
    </svg>
  ),
  chat: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.8-4.7C3.7 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" fill={active ? "currentColor" : "none"}/>
    </svg>
  ),
  orders: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" fill={active ? "currentColor" : "none"}/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke={active ? AG.tealDeep : "currentColor"}/>
    </svg>
  ),
  account: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"}/>
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill={active ? "currentColor" : "none"}/>
    </svg>
  ),
};

function BottomTabBar({ active = "home", badge = {}, dark = false }) {
  const T = theme(dark);
  const tabs = [
    { key: "home", label: "Início" },
    { key: "shop", label: "Catálogo" },
    { key: "chat", label: "Atendimento" },
    { key: "orders", label: "Pedidos" },
    { key: "account", label: "Conta" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: T.tabBarBg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: `1px solid ${T.border}`,
      padding: "8px 8px 22px",
      display: "flex", justifyContent: "space-around",
      zIndex: 20,
    }}>
      {tabs.map(t => {
        const isActive = t.key === active;
        const color = isActive ? (dark ? AG.green : AG.tealDeep) : AG.stone;
        return (
          <div key={t.key} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color, position: "relative",
            padding: "6px 0",
          }}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              {TAB_ICONS[t.key](isActive)}
              {badge[t.key] && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 8,
                  background: AG.green, color: AG.ink,
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

// ─────────────── Buttons ───────────────
function PrimaryButton({ children, dark = false, size = "md", icon, full = false, style = {} }) {
  const pad = size === "lg" ? "14px 22px" : "11px 20px";
  return (
    <button style={{
      background: AG.green,
      color: AG.ink,
      border: 0,
      borderRadius: 9999,
      padding: pad,
      fontSize: size === "lg" ? 15 : 14,
      fontWeight: 600,
      fontFamily: AG.font,
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      width: full ? "100%" : "auto",
      cursor: "pointer",
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

function SecondaryButton({ children, dark = false, size = "md", full = false, style = {} }) {
  const pad = size === "lg" ? "14px 22px" : "11px 20px";
  return (
    <button style={{
      background: "transparent",
      color: dark ? "#fff" : AG.ink,
      border: `1px solid ${dark ? AG.hairlineDark : AG.hairlineStrong}`,
      borderRadius: 9999,
      padding: pad,
      fontSize: size === "lg" ? 15 : 14,
      fontWeight: 600,
      fontFamily: AG.font,
      width: full ? "100%" : "auto",
      cursor: "pointer",
      ...style,
    }}>{children}</button>
  );
}

// ─────────────── Tag/Badge ───────────────
function Tag({ children, color = "green" }) {
  const palettes = {
    green: { bg: AG.greenMid, fg: "#fff" },
    purple: { bg: AG.accentPurple, fg: "#fff" },
    orange: { bg: AG.accentOrange, fg: "#fff" },
    blue: { bg: AG.accentBlue, fg: "#fff" },
    soft: { bg: AG.greenSoft, fg: AG.greenDark },
    teal: { bg: AG.tealDeep, fg: AG.green },
  };
  const p = palettes[color] || palettes.green;
  return (
    <span style={{
      display: "inline-block",
      background: p.bg, color: p.fg,
      fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 4,
    }}>{children}</span>
  );
}

// ─────────────── Product placeholder visuals (small) ───────────────
function ProductGlyph({ kind, size = 64, dark = false }) {
  // Returns a 4:3-ish SVG illustration of the product, geometric placeholder
  // styled by kind: panfleto | banner | bloco | apostila
  const w = size, h = Math.round(size * 0.75);
  const T = theme(dark);
  const bg = T.surfaceSoft;
  const paper = dark ? "#1c2d38" : "#ffffff";
  const stroke = dark ? "#2a3d4a" : "#c1ccd6";
  const lineMuted = dark ? "#3d4f5b" : AG.muted;
  if (kind === "panfleto") {
    return (
      <svg width={w} height={h} viewBox="0 0 80 60">
        <rect width="80" height="60" fill={bg}/>
        <g transform="translate(40 30) rotate(-6)">
          <rect x="-14" y="-22" width="28" height="44" rx="1.5" fill={paper} stroke={stroke} strokeWidth=".6"/>
          <rect x="-11" y="-19" width="22" height="12" fill={dark ? AG.greenDark : AG.greenSoft}/>
          <rect x="-11" y="-4" width="14" height="1.5" fill={dark ? "#fff" : AG.ink}/>
          <rect x="-11" y="0" width="18" height="1" fill={lineMuted}/>
          <rect x="-11" y="3" width="16" height="1" fill={lineMuted}/>
          <rect x="-11" y="12" width="12" height="5" rx="2.5" fill={AG.green}/>
        </g>
      </svg>
    );
  }
  if (kind === "banner") {
    return (
      <svg width={w} height={h} viewBox="0 0 80 60">
        <rect width="80" height="60" fill={bg}/>
        <rect x="14" y="14" width="2" height="40" rx="1" fill={AG.steel}/>
        <rect x="64" y="14" width="2" height="40" rx="1" fill={AG.steel}/>
        <rect x="16" y="14" width="48" height="36" fill={AG.tealDeep}/>
        <rect x="16" y="14" width="48" height="8" fill={AG.green}/>
        <rect x="20" y="26" width="32" height="2" fill="#fff"/>
        <rect x="20" y="30" width="24" height="1.5" fill={AG.muted}/>
        <rect x="20" y="40" width="14" height="4" rx="2" fill={AG.green}/>
      </svg>
    );
  }
  if (kind === "bloco") {
    return (
      <svg width={w} height={h} viewBox="0 0 80 60">
        <rect width="80" height="60" fill={bg}/>
        <g transform="translate(40 32)">
          <rect x="-18" y="-18" width="36" height="34" rx="1" fill={paper} stroke={stroke} strokeWidth=".6"/>
          <rect x="-18" y="-18" width="36" height="4" fill={AG.tealDeep}/>
          <g fill={AG.green}>
            <circle cx="-12" cy="-16" r=".8"/><circle cx="-6" cy="-16" r=".8"/>
            <circle cx="0" cy="-16" r=".8"/><circle cx="6" cy="-16" r=".8"/>
            <circle cx="12" cy="-16" r=".8"/>
          </g>
          <rect x="-14" y="-10" width="18" height="2" fill={dark ? "#fff" : AG.ink}/>
          <line x1="-14" y1="-4" x2="14" y2="-4" stroke={stroke} strokeWidth=".4"/>
          <line x1="-14" y1="0" x2="14" y2="0" stroke={stroke} strokeWidth=".4"/>
          <line x1="-14" y1="4" x2="14" y2="4" stroke={stroke} strokeWidth=".4"/>
          <line x1="-14" y1="8" x2="14" y2="8" stroke={stroke} strokeWidth=".4"/>
        </g>
      </svg>
    );
  }
  if (kind === "apostila") {
    return (
      <svg width={w} height={h} viewBox="0 0 80 60">
        <rect width="80" height="60" fill={bg}/>
        <g transform="translate(40 30)">
          <rect x="-18" y="-19" width="36" height="38" rx="1" fill={AG.teal}/>
          <rect x="-18" y="-19" width="2" height="38" fill={AG.tealDeep}/>
          <rect x="-13" y="-13" width="24" height="1.5" fill={AG.green}/>
          <rect x="-13" y="-9" width="18" height="1" fill="#fff"/>
          <rect x="-13" y="-6" width="14" height="1" fill="#fff" opacity=".5"/>
          <line x1="-13" y1="2" x2="11" y2="2" stroke="#fff" strokeOpacity=".4" strokeWidth=".5"/>
          <line x1="-13" y1="6" x2="9" y2="6" stroke="#fff" strokeOpacity=".4" strokeWidth=".5"/>
          <line x1="-13" y1="10" x2="11" y2="10" stroke="#fff" strokeOpacity=".4" strokeWidth=".5"/>
          <rect x="18" y="-17" width="2" height="36" fill="#fff"/>
        </g>
      </svg>
    );
  }
  return null;
}

// ─────────────── Theme toggle (sun/moon icon button) ───────────────
// Compact circular icon button (36dp). Visually represents the toggle —
// in Flutter, this would dispatch a themeMode change.
function ThemeToggleIcon({ dark = false, size = 36, style = {} }) {
  const T = theme(dark);
  return (
    <button style={{
      width: size, height: size, borderRadius: 9999,
      background: T.surface, border: `1px solid ${T.border}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", flexShrink: 0,
      ...style,
    }} aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}>
      {dark ? (
        // Sun icon — currently dark, would switch to light
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AG.green} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" fill={AG.green} fillOpacity="0.2"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
      ) : (
        // Moon icon — currently light, would switch to dark
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AG.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={AG.ink} fillOpacity="0.08"/>
        </svg>
      )}
    </button>
  );
}

// ─────────────── Theme toggle (segmented switch with labels) ───────────────
// Wider control: shows ☀ Claro / 🌙 Escuro / Auto. Use in settings rows.
function ThemeToggleSwitch({ dark = false, value, onChange, includeAuto = true, style = {} }) {
  const T = theme(dark);
  const v = value ?? (dark ? "dark" : "light");
  const options = includeAuto
    ? [
        { id: "light", l: "Claro", icon: "☀" },
        { id: "dark",  l: "Escuro", icon: "🌙" },
        { id: "auto",  l: "Auto", icon: "⌁" },
      ]
    : [
        { id: "light", l: "Claro", icon: "☀" },
        { id: "dark",  l: "Escuro", icon: "🌙" },
      ];
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 9999, padding: 3,
      display: "inline-flex", gap: 2,
      ...style,
    }}>
      {options.map(o => {
        const isActive = o.id === v;
        return (
          <div key={o.id}
            onClick={() => onChange?.(o.id)}
            style={{
              padding: "6px 12px", borderRadius: 9999,
              background: isActive ? (dark ? AG.green : AG.tealDeep) : "transparent",
              color: isActive ? (dark ? AG.tealDeep : "#fff") : T.textMuted,
              fontSize: 11, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 5,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
            <span style={{ fontSize: 11 }}>{o.icon}</span>
            {o.l}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  AG, theme, AGLogoMark, AGWordmark, AGLogo,
  PhoneShell, MiniStatusBar, AppHeader, BottomTabBar,
  PrimaryButton, SecondaryButton, Tag, ProductGlyph,
  ThemeToggleIcon, ThemeToggleSwitch,
});
