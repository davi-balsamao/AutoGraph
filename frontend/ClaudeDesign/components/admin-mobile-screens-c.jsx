/* Autograph Admin Mobile — Extra screens: Login, Mais, Chat (conversation open).
   All adapt to dark via theme(dark). */

// =============== ADMIN MOBILE LOGIN ===============
function AdmMobileLogin({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "8px 24px 32px" }}>
        {/* Top: theme toggle right */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "4px 0 16px" }}>
          <ThemeToggleIcon dark={dark}/>
        </div>

        {/* Brand block */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <AGLogoMark size={56} bg={dark ? AG.green : AG.tealDeep} stroke={dark ? AG.tealDeep : AG.green}/>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            color: dark ? AG.green : AG.greenDark,
            padding: "4px 10px",
            borderRadius: 9999,
            background: dark ? "rgba(0,237,100,0.08)" : AG.greenSoft,
            marginTop: 16,
          }}>
            🔒 Painel administrativo
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, color: T.text, marginTop: 16, lineHeight: 1.15 }}>
            Entrar no painel
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6, lineHeight: 1.45 }}>
            Acesso restrito à equipe da gráfica
          </div>
        </div>

        {/* Form */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="E-mail corporativo" placeholder="você@autograph.com.br" type="email" value="davi@autograph.com.br" dark={dark}/>
          <Field label="Senha" placeholder="••••••••" type="password" value="••••••••••" dark={dark} trailing={
            <span style={{ fontSize: 11, color: T.textMuted, padding: "0 4px" }}>👁</span>
          }/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, background: AG.green,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L5 9l5-6" stroke={AG.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              Manter conectado
            </label>
            <a style={{ fontSize: 12, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>
              Esqueci a senha
            </a>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24 }}>
          <button style={{
            width: "100%", background: AG.green, color: AG.ink, border: 0,
            borderRadius: 9999, padding: "14px 22px",
            fontSize: 15, fontWeight: 600, fontFamily: AG.font, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            Entrar no painel
          </button>
        </div>

        {/* 2FA hint */}
        <div style={{
          marginTop: 14, padding: "10px 14px",
          background: dark ? "rgba(123,63,242,0.1)" : "#f4efff",
          border: `1px solid ${dark ? "rgba(123,63,242,0.3)" : "#e0d4ff"}`,
          borderRadius: 8,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 11, color: T.text,
        }}>
          <span style={{ fontSize: 14 }}>🔐</span>
          <div style={{ flex: 1 }}>
            Vamos te pedir um código de 6 dígitos depois (2FA)
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <div style={{ fontSize: 11, color: T.textFaint }}>
            Não é da equipe? <a style={{ color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>App do cliente</a>
          </div>
          <div style={{ fontSize: 10, color: T.textFaint, marginTop: 8 }}>Autograph Admin v1.0</div>
        </div>
      </div>
    </PhoneShell>
  );
}

// =============== ADMIN MOBILE — TAB "MAIS" ===============
// Hub com Financeiro, Catálogo, Usuários + Configurações (incl. tema)
function AdmMobileMore({ dark = false }) {
  const T = theme(dark);

  const Row = ({ icon, label, detail, color, danger }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      borderBottom: `1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: danger ? (dark ? "rgba(214,69,69,.15)" : "#fde8e8") : (dark ? `${color}25` : `${color}18`),
        color: danger ? ADM.danger : color,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? ADM.danger : T.text }}>{label}</div>
        {detail && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{detail}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
    </div>
  );

  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 100 }}>
        <AdminMobileHeader title="Mais" subtitle="Outras áreas e configurações" dark={dark}/>

        {/* Profile card */}
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{
            background: dark ? "#001e2b" : ADM.tealDeep, color: "#fff",
            borderRadius: 16, padding: 14,
            display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden",
            border: dark ? `1px solid ${T.borderStrong}` : "none",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(180px 100px at 100% 100%, rgba(0,237,100,.14), transparent 70%)" }}/>
            <div style={{
              width: 48, height: 48, borderRadius: 9999, background: ADM.green,
              color: ADM.tealDeep, fontSize: 18, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>D</div>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Davi Balsamão</div>
              <div style={{ fontSize: 11, color: "#a8b3bc", marginTop: 2 }}>Gerente · davi@autograph.com.br</div>
            </div>
            <span style={{ position: "relative", fontSize: 11, color: ADM.green, fontWeight: 600 }}>● Online</span>
          </div>
        </div>

        {/* Theme card */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{
            background: T.bgElevated, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: T.surfaceSoft,
                  color: dark ? ADM.green : ADM.greenDark, fontSize: 14,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{dark ? "🌙" : "☀️"}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Aparência</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>Atual: {dark ? "Escuro" : "Claro"}</div>
                </div>
              </div>
            </div>
            <ThemeToggleSwitch dark={dark} value={dark ? "dark" : "light"} style={{ width: "100%", justifyContent: "space-between" }}/>
          </div>
        </div>

        <SectionHeading2 dark={dark}>Áreas do painel</SectionHeading2>
        <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, margin: "0 16px", overflow: "hidden" }}>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h7v7"/></svg>}
            color={ADM.accentBlue}
            label="Financeiro"
            detail="Receita, custos, transações"/>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
            color={ADM.accentOrange}
            label="Catálogo"
            detail="10 SKUs · margem média 68%"/>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.8"/><path d="M15.5 14.5c2.5.3 5 2 5 4.5"/></svg>}
            color={ADM.accentPurple}
            label="Usuários"
            detail="287 cadastrados"/>
        </div>

        <SectionHeading2 dark={dark}>Configurações</SectionHeading2>
        <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, margin: "0 16px", overflow: "hidden" }}>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>}
            color={ADM.greenMid}
            label="Notificações"
            detail="Push, e-mail, escalações"/>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.5-2.5 1A7 7 0 0 0 15 5.2L14.5 2.5h-5L9 5.2a7 7 0 0 0-1.5.5l-2.5-1-2 3.5L5.1 9.8A7 7 0 0 0 5 11c0 .4 0 .8.1 1.2l-2.1 1.6 2 3.5 2.5-1A7 7 0 0 0 9 16.8L9.5 19.5h5L15 16.8a7 7 0 0 0 1.5-.5l2.5 1 2-3.5-2.1-1.6c.1-.4.1-.8.1-1.2z"/></svg>}
            color={ADM.steel}
            label="Configurações da gráfica"
            detail="Razão social, CNPJ, integrações"/>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2 4 6v6c0 5 4 9 8 10 4-1 8-5 8-10V6z"/></svg>}
            color={ADM.accentBlue}
            label="Permissões e equipe"
            detail="4 usuários ativos"/>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 4.5 1.5c-1 .5-2 1-2 2.5"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></svg>}
            color={ADM.greenMid}
            label="Central de ajuda"/>
        </div>

        <SectionHeading2 dark={dark}>Outros</SectionHeading2>
        <div style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, margin: "0 16px 16px", overflow: "hidden" }}>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>}
            label="Sair"
            danger/>
        </div>

        <div style={{ textAlign: "center", color: T.textFaint, fontSize: 10, padding: "8px 0" }}>
          Autograph Admin v1.0 · build 2025.05.12
        </div>
      </div>
      <AdminTabBar active="more" badge={{ chat: 3 }} dark={dark}/>
    </PhoneShell>
  );
}

function SectionHeading2({ children, dark = false }) {
  const T = theme(dark);
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase",
      padding: "20px 20px 8px",
    }}>{children}</div>
  );
}

// =============== ADMIN MOBILE — CHAT CONVERSATION OPEN ===============
// Same WhatsApp-style bubbles as the customer chat, but with admin controls
// in the header (agent badge + "Assumir conversa" button).
function AdmMobileChatConversation({ dark = false }) {
  // Reuse the WhatsApp palette logic from the customer ChatScreen
  const wa = dark
    ? {
        bg: "#0b141a", pattern: "rgba(255,255,255,0.025)",
        headerBg: "#1f2c33",
        bubbleIn: "#202c33", bubbleOut: "#005c4b",
        bubbleInText: "#e9edef", bubbleOutText: "#e9edef",
        bubbleMeta: "#8696a0",
        composerBg: "#1f2c33", composerInput: "#2a3942", composerText: "#8696a0",
        sysBubbleBg: "#1d2c2c", sysBubbleText: "#a8b3bc",
        sysBubbleBorder: "#2a3942",
      }
    : {
        bg: "#efeae2", pattern: "rgba(0,30,43,.06)",
        headerBg: AG.tealDeep,
        bubbleIn: "#ffffff", bubbleOut: "#d9fdd3",
        bubbleInText: "#111b21", bubbleOutText: "#111b21",
        bubbleMeta: "#667781",
        composerBg: "#f0f2f5", composerInput: "#ffffff", composerText: "#667781",
        sysBubbleBg: "#fff4ed", sysBubbleText: "#5c6c7a",
        sysBubbleBorder: "#e1e5e8",
      };

  return (
    <PhoneShell bg={wa.bg} statusBarStyle="light" statusBarColor={wa.headerBg}>
      {/* Header — admin view */}
      <div style={{
        background: wa.headerBg, color: "#fff",
        padding: "8px 12px 10px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ background: "transparent", border: 0, color: "#fff", fontSize: 18, padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 9999, background: AG.surfaceSoft,
            color: AG.greenDark, fontSize: 13, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>MC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              Mariana Costa
            </div>
            <div style={{ fontSize: 11, color: "#a8b3bc", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: AG.green }}/>
              Online · +55 11 9 8421-3344
            </div>
          </div>
          <button style={{ background: "transparent", border: 0, color: "#fff", padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
          </button>
        </div>
        {/* Admin context bar */}
        <div style={{
          marginTop: 10, padding: "8px 10px", borderRadius: 8,
          background: "rgba(0,237,100,0.08)", border: "1px solid rgba(0,237,100,0.2)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            background: AG.green, color: AG.tealDeep,
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 9999,
            letterSpacing: 0.5,
          }}>🤖 AGENTE RESPONDENDO</span>
          <span style={{ fontSize: 11, color: "#a8b3bc", flex: 1 }}>Você está observando</span>
          <button style={{
            background: AG.green, color: AG.ink, border: 0,
            borderRadius: 9999, padding: "5px 12px", fontSize: 11, fontWeight: 600,
            cursor: "pointer",
          }}>Assumir</button>
        </div>
      </div>

      {/* Messages (mostly from customer perspective, with one system event) */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "12px 10px 70px",
        display: "flex", flexDirection: "column", gap: 4,
        background: wa.bg,
        backgroundImage: `radial-gradient(${wa.pattern} 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
      }}>
        <ChatBubbleAdmin side="in" wa={wa} text="oi, queria 1000 panfletos pro evento de sábado" t="14:32"/>
        <ChatBubbleAdmin side="out" wa={wa} agent text={"Boa tarde, Mariana! 👋 Aqui é o agente da Autograph. 1.000 panfletos pro sábado dá tempo sim.\n\nPra fechar o orçamento: A6, A5 ou A4? Frente só ou frente e verso? Couché brilho 115g está ótimo, manda esse?"} t="14:32"/>
        <ChatBubbleAdmin side="in" wa={wa} text="A5 frente e verso, couché tá bom 👍" t="14:33"/>
        <SystemBubble wa={wa}>
          <b>🤖 14:33 · agente</b> gerou Orçamento <b>#A-2847</b> · R$ 189,00 · entrega quinta-feira
        </SystemBubble>
        <ChatBubbleAdmin side="out" wa={wa} agent text={"Prontinho! Orçamento R$ 189,00 (couché 115g, 4×4). Entrega quinta-feira. Posso te mandar o boleto/Pix?"} t="14:33"/>
        <ChatBubbleAdmin side="in" wa={wa} text="fechado 💚 já te mando a arte" t="14:34"/>
        <SystemBubble wa={wa}>
          <b>📎 14:34 · cliente</b> enviou <b>festival-da-rua-final.pdf</b> (2.4 MB)
        </SystemBubble>
      </div>

      {/* Composer (admin) */}
      <div style={{
        position: "absolute", left: 8, right: 8, bottom: 26,
        background: wa.composerBg, borderRadius: 24,
        display: "flex", alignItems: "center", gap: 6,
        padding: 6, zIndex: 5,
      }}>
        <span style={{ width: 28, textAlign: "center", color: wa.composerText, fontSize: 16 }}>/</span>
        <div style={{
          flex: 1, background: wa.composerInput, borderRadius: 20, padding: "8px 14px",
          color: wa.composerText, fontSize: 13,
        }}>Mensagem como atendente…</div>
        <span style={{ width: 24, textAlign: "center", color: wa.composerText, fontSize: 14 }}>📎</span>
        <div style={{
          width: 36, height: 36, borderRadius: 9999, background: "#00a884", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </div>
      </div>
    </PhoneShell>
  );
}

const tickAdmin = (
  <svg width="14" height="9" viewBox="0 0 16 11" style={{ flexShrink: 0 }}>
    <path d="M1 6L4 9L10 2" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M6 6L9 9L15 2" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// In the admin view, the "out" side is the gráfica (agent/admin), "in" is the customer.
function ChatBubbleAdmin({ side, text, t, wa, agent }) {
  const isOut = side === "out";
  return (
    <div className="ag-msg-in" style={{
      alignSelf: isOut ? "flex-end" : "flex-start",
      background: isOut ? wa.bubbleOut : wa.bubbleIn,
      color: isOut ? wa.bubbleOutText : wa.bubbleInText,
      borderRadius: isOut ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
      padding: "6px 10px 4px",
      maxWidth: "82%",
      boxShadow: "0 1px 0.5px rgba(0,0,0,.06)",
      fontSize: 13, lineHeight: 1.45,
      marginBottom: 2,
    }}>
      {agent && (
        <div style={{ fontSize: 9, color: AG.greenDark, fontWeight: 700, fontFamily: AG.mono, marginBottom: 2, letterSpacing: 0.5 }}>
          🤖 AGENTE
        </div>
      )}
      {text.split("\n").map((l, i) => <div key={i}>{l || "\u00A0"}</div>)}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, alignItems: "center", marginTop: 2, fontSize: 10, color: wa.bubbleMeta }}>
        <span>{t}</span>
        {isOut && tickAdmin}
      </div>
    </div>
  );
}

function SystemBubble({ children, wa }) {
  return (
    <div style={{
      alignSelf: "center", background: wa.sysBubbleBg, color: wa.sysBubbleText,
      border: `1px dashed ${wa.sysBubbleBorder}`,
      borderRadius: 6, padding: "5px 10px",
      fontSize: 11, lineHeight: 1.4, maxWidth: "85%", textAlign: "center",
    }}>{children}</div>
  );
}

Object.assign(window, {
  AdmMobileLogin, AdmMobileMore, AdmMobileChatConversation,
  ChatBubbleAdmin, SystemBubble, SectionHeading2,
});
