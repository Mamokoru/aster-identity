"use client";

import { signIn, signOut, getSession } from "next-auth/react";
import { useEffect, useState, type SubmitEvent } from "react";

export default function Home() {
  const [user, setUser] = useState<{ name?: string | null; email?: string | null } | null>(null);
  const [notice, setNotice] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getSession().then((session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);
    setNotice("Connecting to secure sign-in...");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      await signIn("keycloak", {
        callbackUrl: "/",
        ...(email ? { login_hint: email } : {}),
      });
    } catch {
      setIsSigningIn(false);
      setNotice("Could not connect to Keycloak. Check that the identity service is running.");
    }
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

          <form className="signin-form" onSubmit={handleSubmit}>
            {!user && (
              <div className="field-group">
                <label htmlFor="email">Work email <span className="optional-label">(optional)</span></label>
                <input
                  autoComplete="username"
                  id="email"
                  name="email"
                  placeholder="name@company.com"
                  type="email"
                />
              </div>
            )}

            {user ? (
              <div className="signed-in-state" role="status">
                <span className="signed-in-mark" aria-hidden="true">✓</span>
                <div>
                  <strong>You&apos;re signed in</strong>
                  <p>{user.name || user.email}</p>
                </div>
              </div>
            ) : (
              <button className="submit-button" type="submit" disabled={isSigningIn}>
                <span>{isSigningIn ? "Redirecting..." : "Continue to secure sign-in"}</span>
                <span className="button-arrow" aria-hidden="true">&#8594;</span>
              </button>
            )}

            {notice && <p className="form-notice" role="status">{notice}</p>}

            {user && (
              <button className="submit-button" type="button" onClick={() => void signOut({ callbackUrl: "/" })}>
                <span>Sign out</span>
                <span className="button-arrow" aria-hidden="true">&#8594;</span>
              </button>
            )}
          </form>

          <div className="form-divider"><span /> <span>SECURE WORKSPACE ACCESS</span> <span /></div>

          <p className="security-note">
            <span className="status-dot" aria-hidden="true" />
            Passwords and passkeys are handled by Keycloak.
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
