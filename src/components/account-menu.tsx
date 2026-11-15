"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await authClient.signOut();
    } finally {
      setBusy(false);
    }
  }

  if (isPending) return <span className="account-loading" aria-label="Checking account" />;

  if (!session) {
    return (
      <div className="account-actions">
        <Link className="account-link" href="/login">Sign in</Link>
        <Link className="account-join" href="/register">Create account</Link>
      </div>
    );
  }

  return (
    <div className="account-actions">
      <Link className="account-link account-library-link" href="/profile"><UserRound size={15} /> Profile</Link>
      <Link className="account-link account-library-link" href="/library"><UserRound size={15} /> My Library</Link>
      <button className="account-join" onClick={signOut} disabled={busy} type="button">
        <LogOut size={14} /> {busy ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
