/* Autograph Admin Desktop — Login screen.
   Renders inside ChromeWindow at full 1280x780. */

function AdminLoginScreen() {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex",
      fontFamily: ADMIN.font, color: ADMIN.ink,
    }}>
      {/* Left: deep teal brand panel */}
      <div style={{
        flex: 1, background: ADMIN.tealDeep, color: "#fff",
        padding: "48px 64px", display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background:
            "radial-gradient(500px 300px at 80% 20%, rgba(0,237,100,.18), transparent 60%)," +
            "radial-gradient(500px 300px at 0% 100%, rgba(0,163,92,.18), transparent 60%)",
        }}/>
        <div style={{ position: "relative", flex: 1 }}>
          <AGLogo markSize={36} textSize={22} color="#fff" accent={ADMIN.green} bg={ADMIN.green} stroke={ADMIN.tealDeep}/>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            color: ADMIN.green,
            padding: "5px 12px", borderRadius: 9999,
            background: "rgba(0,237,100,.08)",
            border: "1px solid rgba(0,237,100,.18)",
            marginTop: 80,
          }}>
            🔒 Painel administrativo
          </div>
          <h1 style={{
            fontSize: 44, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1,
            color: "#fff", margin: "20px 0 16px", maxWidth: 480,
          }}>
            A gráfica que conversa.<br/>O painel que executa.
          </h1>
          <p style={{ fontSize: 15, color: ADMIN.muted, lineHeight: 1.55, margin: 0, maxWidth: 460 }}>
            Acompanhe orçamentos do agente, organize OSs no Kanban, libere produção e fale com clientes — tudo num lugar só.
          </p>

          {/* Marketing bullets */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🤖", title: "Agente sempre online", sub: "Resposta média de 38s em 100% das conversas" },
              { icon: "📋", title: "Kanban arrastável", sub: "5 colunas: aguardando · aprovado · progresso · revisão · concluída" },
              { icon: "💸", title: "Financeiro consolidado", sub: "Receita, custos e margem em uma visão" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: "rgba(0,237,100,.1)", color: ADMIN.green,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, border: "1px solid rgba(0,237,100,.18)",
                }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: ADMIN.muted, marginTop: 2 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", fontSize: 11, color: ADMIN.muted }}>
          © 2026 Autograph Gráfica · todos os direitos reservados
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        width: 460, background: "#fff",
        padding: "56px 56px", display: "flex", flexDirection: "column",
        borderLeft: `1px solid ${ADMIN.hairline}`,
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ThemeToggleIcon dark={false} size={36}/>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: ADMIN.greenDark, letterSpacing: 1, textTransform: "uppercase" }}>
            Entrar
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5, color: ADMIN.ink, margin: "8px 0 6px" }}>
            Bem-vindo de volta
          </h2>
          <p style={{ fontSize: 14, color: ADMIN.steel, margin: 0, lineHeight: 1.5 }}>
            Acesse o painel da gráfica
          </p>

          {/* Form */}
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
            <DesktopField label="E-mail corporativo" value="davi@autograph.com.br" type="email"/>
            <DesktopField label="Senha" value="••••••••••" type="password" trailing={
              <span style={{ fontSize: 13, color: ADMIN.steel, cursor: "pointer" }}>👁</span>
            }/>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN.charcoal }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 4, background: ADMIN.green,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L5 9l5-6" stroke={ADMIN.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Manter conectado
              </label>
              <a style={{ fontSize: 13, color: ADMIN.greenDark, fontWeight: 600 }}>
                Esqueci a senha
              </a>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 28 }}>
            <AdminBtn variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
              Entrar no painel
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </AdminBtn>
          </div>

          {/* 2FA note */}
          <div style={{
            marginTop: 16, padding: "12px 14px",
            background: "#f4efff", border: "1px solid #e0d4ff",
            borderRadius: 8, display: "flex", alignItems: "center", gap: 10,
            fontSize: 12, color: ADMIN.charcoal,
          }}>
            <span style={{ fontSize: 16 }}>🔐</span>
            <div style={{ flex: 1 }}>
              <b>Verificação em 2 etapas</b> · vamos te pedir um código de 6 dígitos depois
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 12, color: ADMIN.steel }}>
          Não é da equipe? <a style={{ color: ADMIN.greenDark, fontWeight: 600 }}>App do cliente</a>
        </div>
      </div>
    </div>
  );
}

function DesktopField({ label, value, type = "text", trailing }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: ADMIN.charcoal, marginBottom: 6 }}>{label}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#fff", border: `1px solid ${ADMIN.hairlineStrong}`,
        borderRadius: 8, padding: "12px 14px", minHeight: 48,
      }}>
        <input
          type={type}
          defaultValue={value}
          style={{
            border: 0, background: "transparent", outline: "none", flex: 1,
            fontSize: 14, fontFamily: ADMIN.font, color: ADMIN.ink,
          }}/>
        {trailing}
      </div>
    </div>
  );
}

Object.assign(window, { AdminLoginScreen, DesktopField });
