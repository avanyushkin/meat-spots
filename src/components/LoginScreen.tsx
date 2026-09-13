import { useState, type FormEvent } from "react";

interface LoginScreenProps {
  onSubmit: (password: string) => Promise<void>;
  error: string | null;
}

export function LoginScreen({ onSubmit, error }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <h1>Мясные точки — Минск</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={submitting || !password}>
          {submitting ? "Входим…" : "Войти"}
        </button>
        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
}
