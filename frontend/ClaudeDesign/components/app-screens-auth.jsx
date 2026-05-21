/* Autograph mobile — Auth screens: Login + Signup (cliente).
   Both adapt to dark mode via theme(dark). */

// =============== LOGIN (Cliente) ===============
function LoginScreen({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "8px 24px 32px" }}>
        {/* Top: back + theme toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0 16px" }}>
          <button style={{
            width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <ThemeToggleIcon dark={dark}/>
        </div>

        {/* Brand + heading */}
        <div style={{ marginTop: 12 }}>
          <AGLogoMark size={48} bg={dark ? AG.green : AG.tealDeep} stroke={dark ? AG.tealDeep : AG.green}/>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, color: T.text, marginTop: 24, lineHeight: 1.1 }}>
            Bem-vinda de volta
          </div>
          <div style={{ fontSize: 14, color: T.textMuted, marginTop: 6, lineHeight: 1.45 }}>
            Entre pra acompanhar seus pedidos e voltar a falar com o agente.
          </div>
        </div>

        {/* Form */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="E-mail" placeholder="seu@email.com" type="email" value="mariana@dezembro.studio" dark={dark}/>
          <Field label="Senha" placeholder="••••••••" type="password" value="••••••••" dark={dark} trailing={
            <span style={{ fontSize: 11, color: T.textMuted, padding: "0 4px" }}>👁</span>
          }/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: AG.green,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L5 9l5-6" stroke={AG.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              Lembrar de mim
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
            Entrar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>

        {/* Divider + social */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
          <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>ou continue com</span>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <SocialBtn dark={dark} icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.6.3-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 .5C5.4.5 0 5.9 0 12.5c0 2.2.6 4.3 1.7 6.1L0 24l5.5-1.7c1.8 1 3.9 1.5 6 1.5h.5c6.6 0 12-5.4 12-12s-5.4-12-12-12z"/></svg>
          } label="WhatsApp"/>
          <SocialBtn dark={dark} icon={<span style={{ fontWeight: 700, fontSize: 13 }}>G</span>} label="Google"/>
        </div>

        <div style={{ flex: 1 }}/>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ fontSize: 13, color: T.textMuted }}>Não tem conta? </span>
          <a style={{ fontSize: 13, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Criar conta</a>
        </div>
      </div>
    </PhoneShell>
  );
}

// =============== SIGNUP (Cliente) ===============
function SignupScreen({ dark = false }) {
  const T = theme(dark);
  return (
    <PhoneShell bg={T.bg} statusBarStyle={dark ? "light" : "dark"} statusBarColor={T.bg}>
      <div style={{ height: "100%", overflowY: "auto", padding: "8px 24px 32px" }}>
        {/* Top: back + theme toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0 16px" }}>
          <button style={{
            width: 36, height: 36, borderRadius: 9999, background: T.surface, border: `1px solid ${T.border}`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <ThemeToggleIcon dark={dark}/>
        </div>

        {/* Brand + heading */}
        <div style={{ marginTop: 4 }}>
          <AGLogoMark size={40} bg={dark ? AG.green : AG.tealDeep} stroke={dark ? AG.tealDeep : AG.green}/>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, color: T.text, marginTop: 18, lineHeight: 1.1 }}>
            Crie sua conta
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6, lineHeight: 1.45 }}>
            Em 30 segundos você já está conversando com o agente.
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: AG.green }}/>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: AG.green }}/>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.border }}/>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: dark ? AG.green : AG.greenDark, marginBottom: 16 }}>
          Passo 2 de 3 · Seus dados
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nome" placeholder="Como prefere ser chamada" value="Mariana Costa" dark={dark}/>
          <Field label="E-mail" placeholder="seu@email.com" type="email" value="mariana@dezembro.studio" dark={dark}/>
          <Field label="WhatsApp" placeholder="+55 11 9 0000-0000" type="tel" value="+55 11 9 8421-3344" dark={dark} leading={
            <span style={{ fontSize: 16 }}>🇧🇷</span>
          }/>
          <Field label="Senha" placeholder="Mínimo 8 caracteres" type="password" value="••••••••••" dark={dark}/>

          {/* Password strength */}
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: AG.green }}/>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: AG.green }}/>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: AG.green }}/>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.border }}/>
            </div>
            <div style={{ fontSize: 11, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Senha forte ✓</div>
          </div>

          {/* Terms */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 4, fontSize: 12, color: T.text, lineHeight: 1.4 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
              background: AG.green, marginTop: 1,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L5 9l5-6" stroke={AG.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span>
              Eu li e aceito os <a style={{ color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Termos</a> e a <a style={{ color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Política de privacidade</a>.
            </span>
          </label>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24 }}>
          <button style={{
            width: "100%", background: AG.green, color: AG.ink, border: 0,
            borderRadius: 9999, padding: "14px 22px",
            fontSize: 15, fontWeight: 600, fontFamily: AG.font, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            Criar conta
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: T.textMuted }}>Já tem conta? </span>
          <a style={{ fontSize: 13, color: dark ? AG.green : AG.greenDark, fontWeight: 600 }}>Entrar</a>
        </div>
      </div>
    </PhoneShell>
  );
}

// ─── Helpers ───
function Field({ label, placeholder, value, type = "text", dark = false, leading, trailing }) {
  const T = theme(dark);
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: T.bgElevated, border: `1px solid ${T.borderStrong}`,
        borderRadius: 10, padding: "11px 14px", minHeight: 44,
      }}>
        {leading}
        <input
          type={type}
          placeholder={placeholder}
          defaultValue={value}
          style={{
            border: 0, background: "transparent", outline: "none", flex: 1,
            fontSize: 14, fontFamily: AG.font, color: T.text,
          }}/>
        {trailing}
      </div>
    </div>
  );
}

function SocialBtn({ icon, label, dark = false }) {
  const T = theme(dark);
  return (
    <button style={{
      flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      background: T.bgElevated, border: `1px solid ${T.borderStrong}`,
      borderRadius: 9999, padding: "11px 16px",
      fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer",
    }}>
      {icon}{label}
    </button>
  );
}

Object.assign(window, { LoginScreen, SignupScreen, Field, SocialBtn });
