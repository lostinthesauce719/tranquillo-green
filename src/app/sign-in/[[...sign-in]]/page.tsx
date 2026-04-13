import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">
            Tranquillo Labs
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-text-primary">
            Sign in to Green
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Cannabis accounting and compliance OS
          </p>
        </div>

        {/* Clerk Sign In */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20 w-full",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "rounded-xl border border-border bg-surface-mid text-text-primary hover:bg-surface-raised transition",
              socialButtonsBlockButtonText: "text-sm font-medium",
              dividerRow: "hidden",
              formFieldLabel: "text-sm font-medium text-text-secondary",
              formFieldInput:
                "rounded-xl border border-border bg-surface-mid text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:ring-1 focus:ring-accent/50",
              formButtonPrimary:
                "rounded-xl bg-brand text-white font-semibold text-sm py-3 hover:bg-brand/90 transition",
              footerActionLink: "text-accent hover:text-accent/80 font-medium",
              footerActionText: "text-text-muted text-sm",
              formFieldInputShowPasswordButton: "text-text-muted hover:text-text-primary",
              identityPreviewText: "text-text-secondary text-sm",
              identityPreviewEditButtonIcon: "text-accent",
              alertText: "text-red-300 text-sm",
              alert: "rounded-xl border border-red-500/30 bg-red-500/10",
            },
            variables: {
              colorPrimary: "#22855A",
              colorBackground: "#0B1020",
              colorText: "#E2E8F0",
              colorTextSecondary: "#94A3B8",
              colorInputText: "#E2E8F0",
              colorInputBackground: "#141B2D",
              colorDanger: "#EF4444",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "14px",
              borderRadius: "12px",
            },
          }}
        />

        {/* Cross-links */}
        <div className="text-center space-y-3">
          <p className="text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-accent hover:text-accent/80 font-medium">
              Create one
            </Link>
          </p>
          <p className="text-sm text-text-muted">
            Or{" "}
            <Link href="/dashboard" className="text-accent hover:text-accent/80 font-medium">
              open demo mode
            </Link>
          </p>
          <Link href="/" className="block text-xs text-text-faint hover:text-text-muted transition">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
