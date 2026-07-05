import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/context/auth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand heading */}
        <h1 className="font-heading text-[2.25rem] text-text text-center mb-8 leading-tight">
          Patient <span className="text-teal">CRM</span>
        </h1>

        <Card hover={false}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="huseyinajuz@clinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p
                role="alert"
                className="text-[0.8rem] text-coral font-medium bg-coral-glow rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>
        </Card>

        <p className="text-center text-text-muted text-[0.7rem] mt-6">
          Hüseyin Ajuz — Physiotherapy &amp; Osteopathy
        </p>
      </div>
    </div>
  );
}
