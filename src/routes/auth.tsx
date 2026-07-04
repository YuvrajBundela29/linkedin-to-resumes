import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — ResumeForge AI" },
      { name: "description", content: "Sign in to build and edit your AI-powered resume." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = (next && next.startsWith("/")) ? next : "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: dest as any, replace: true });
    });
  }, [dest, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + dest },
        });
        if (error) throw error;
        toast.success("Account created. Redirecting…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: dest as any, replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: dest as any, replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[color:var(--color-surface)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Link to="/"><Logo /></Link></div>
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Free forever. No credit card required." : "Sign in to continue."}
          </p>

          <Button type="button" variant="outline" className="w-full mt-6 gap-2" onClick={handleGoogle} disabled={busy}>
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="relative my-5 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2 relative z-10">or</span>
            <div className="absolute inset-x-0 top-1/2 border-t" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Have an account? <button className="text-foreground underline underline-offset-2" onClick={() => setMode("signin")}>Sign in</button></>
            ) : (
              <>New here? <button className="text-foreground underline underline-offset-2" onClick={() => setMode("signup")}>Create an account</button></>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.59-5.17 3.59-8.8z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.86-2.98c-1.07.72-2.45 1.16-4.08 1.16-3.14 0-5.8-2.12-6.75-4.98H1.28v3.11C3.27 21.3 7.31 24 12 24z"/>
      <path fill="#FBBC05" d="M5.25 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.28C.46 8.22 0 10.06 0 12s.46 3.78 1.28 5.4l3.97-3.11z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.28 6.6l3.97 3.11C6.2 6.87 8.86 4.75 12 4.75z"/>
    </svg>
  );
}
