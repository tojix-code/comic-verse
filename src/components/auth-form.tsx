"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, PanelsTopLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = isRegister
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(result.error.message || "Authentication failed. Please try again.");
        return;
      }
      router.replace("/library");
      router.refresh();
    } catch {
      setError("We couldn't reach the authentication service. Check your database and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to ComicVerse</Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark"><PanelsTopLeft size={20} /></span>
          <span>Comic<span>Verse</span></span>
        </Link>
        <p className="auth-kicker">YOUR READING LIFE, IN ONE PLACE</p>
        <h1 id="auth-title">{isRegister ? "Create your account." : "Welcome back."}</h1>
        <p className="auth-subtitle">
          {isRegister ? "Build your library and keep your reading progress together." : "Sign in to continue to your personal library."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label>
              <span>Display name</span>
              <input autoComplete="name" maxLength={80} onChange={(event) => setName(event.target.value)} required value={name} />
            </label>
          )}
          <label>
            <span>Email address</span>
            <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={10}
              maxLength={128}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {isRegister && <small>Use at least 10 characters.</small>}
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={busy} type="submit">
            {busy && <LoaderCircle className="spin" size={16} />}
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to ComicVerse?"}{" "}
          <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
        </p>
        <p className="auth-note">Your account is for your personal library and reading preferences.</p>
      </section>
    </main>
  );
}
