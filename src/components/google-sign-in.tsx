"use client";

import { createAuthClient } from "@neondatabase/auth/next";

const authClient = createAuthClient();
export default function GoogleSignIn() {
  return <button className="primary-button login-button" type="button" onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/login?error=access_denied" })}>Masuk dengan Google</button>;
}
