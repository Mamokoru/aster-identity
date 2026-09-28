"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function CompleteLogoutPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void signOut({ redirect: false, callbackUrl: "/" })
      .then((response) => {
        window.location.replace(response?.url ?? "/");
      })
      .catch(() => {
        if (isMounted) {
          setFailed(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="workspace-page">
      <section className="workspace-message" role={failed ? "alert" : "status"}>
        <p className="eyebrow">SECURE SIGN-OUT</p>
        <h1>{failed ? "Sign-out needs another try" : "Signing out..."}</h1>
        {failed && <p>Keycloak signed out, but this app could not clear its local session. Reload the page and try again.</p>}
      </section>
    </main>
  );
}