"use client";

import { useState, type SubmitEvent } from "react";

type SignInMethod = "password" | "passkey";

export default function Home() {
  const [method, setMethod] = useState<SignInMethod>("password");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Authentication is not active yet. Connect Keycloak before signing in.");
  }

  function chooseMethod(nextMethod: SignInMethod) {
    setMethod(nextMethod);
    setNotice("");
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-label="Aster identity">
        <div className="brand-topline">
          <div className="brand-lockup" aria-label="Aster">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>aster<span className="brand-period">.</span></span>
          </div>
          <span className="panel-index">IDENTITY / 01</span>
        </div>

        <div className="brand-copy">
          <p className="eyebrow"><span className="status-dot" /> PRIVATE ACCESS</p>
          <h1>Good to have<br />you <span>back.</span></h1>
          <p className="brand-description">
            One considered place for your work, your people, and everything in between.
          </p>
        </div>

        <div className="panel-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-core"><span>A</span></div>
          <span className="art-coordinate coordinate-top">51°30&apos;26.4&quot;N</span>
          <span className="art-coordinate coordinate-bottom">IDENTITY / EST. 2024</span>
        </div>

        <div className="brand-footer">
          <span>CALM ACCESS. CLEAR INTENT.</span>
          <span className="footer-signal"><i /> SECURE BY DESIGN</span>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="signin-heading">
        <div className="mobile-brand brand-lockup" aria-label="Aster">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>aster<span className="brand-period">.</span></span>
        </div>

        <div className="form-content">
          <div className="form-heading">
            <p className="eyebrow form-eyebrow">YOUR ACCOUNT</p>
            <h2 id="signin-heading">Sign in to Aster</h2>
            <p className="form-subtitle">Use your work account to continue.</p>
          </div>

          <div className="method-switch" role="group" aria-label="Sign-in method">
            <button
              className={method === "password" ? "method-tab is-active" : "method-tab"}
              type="button"
              aria-pressed={method === "password"}
              onClick={() => chooseMethod("password")}
            >
              Password
            </button>
            <button
              className={method === "passkey" ? "method-tab is-active" : "method-tab"}
              type="button"
              aria-pressed={method === "passkey"}
              onClick={() => chooseMethod("passkey")}
            >
              <span className="key-icon" aria-hidden="true" /> Passkey
            </button>
          </div>

          <form className="signin-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">Work email</label>
              <input
                autoComplete="username webauthn"
                id="email"
                name="email"
                placeholder="name@company.com"
                type="email"
                required
              />
            </div>

            {method === "password" && (
              <div className="field-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setNotice("Password recovery will be available through Keycloak.")}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="password-wrap">
                  <input
                    autoComplete="current-password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="visibility-button"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="eye-icon" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {method === "passkey" && (
              <div className="passkey-note">
                <span className="passkey-symbol" aria-hidden="true"><span /></span>
                <div>
                  <strong>Sign in with a passkey</strong>
                  <p>Use your device&apos;s screen lock or a security key.</p>
                </div>
              </div>
            )}

            {notice && <p className="form-notice" role="status">{notice}</p>}

            <button className="submit-button" type="submit">
              <span>{method === "password" ? "Continue" : "Continue with passkey"}</span>
              <span className="button-arrow" aria-hidden="true">&#8594;</span>
            </button>
          </form>

          <div className="form-divider"><span /> <span>SECURE WORKSPACE ACCESS</span> <span /></div>

          <p className="security-note">
            <span className="status-dot" aria-hidden="true" />
            Keycloak connection pending. No credentials are sent.
          </p>
        </div>

        <footer className="form-footer">
          <span>© 2026 Aster Systems</span>
          <a href="mailto:help@aster.example">Need help?</a>
        </footer>
      </section>
    </main>
  );
}
