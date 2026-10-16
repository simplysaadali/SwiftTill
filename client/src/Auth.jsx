import { useState } from "react";
import api from "./api.js";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const registering = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    if (registering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(`/api/auth/${mode}`, { name, email, password });
      localStorage.setItem("swifttill_token", data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Could not connect to the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="brand-mark">S</div>
        <p className="auth-kicker">SWIFTTILL / POINT OF SALE</p>
        <h1>Good business<br />starts here.</h1>
        <p className="auth-description">Sign in to manage your inventory, build orders, and keep every receipt close at hand.</p>
        <div className="auth-rule"><span /> DAILY SALES, MADE SIMPLE</div>
      </section>
      <section className="auth-form-wrap" aria-labelledby="auth-heading">
        <div className="auth-form-heading">
          <span className="auth-overline">YOUR WORKSPACE</span>
          <h2 id="auth-heading">{registering ? "Create your account" : "Welcome back"}</h2>
          <p>{registering ? "Set up an account to get started." : "Enter your details to continue."}</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {registering && (
            <>
              <label htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Morgan"
                required
              />
            </>
          )}
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@business.com"
            required
          />
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={registering ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={registering ? "At least 8 characters" : "Enter your password"}
            minLength={registering ? 8 : undefined}
            required
          />
          {registering && (
            <>
              <label htmlFor="auth-confirm-password">Confirm password</label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
              />
            </>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait..." : registering ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          {registering ? "Already have an account?" : "New to SwiftTill?"}{" "}
          <button type="button" onClick={() => { setMode(registering ? "login" : "register"); setError(""); }}>
            {registering ? "Sign in" : "Create an account"}
          </button>
        </p>
        <p className="auth-security">Your workspace is private to your account.</p>
      </section>
    </main>
  );
}