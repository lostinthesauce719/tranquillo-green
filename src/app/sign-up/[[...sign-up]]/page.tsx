import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-accent">
            Tranquillo Labs
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-text-primary">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Get started with Green — cannabis accounting built right.
          </p>
        </div>

        {/* Clerk Sign Up */}
        <SignUp
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
              alertText: "text-red-300 text-sm",
              alert: "rounded-xl border border-red-500/30 bg-red-500/10",
              formFieldSuccessText: "text-emerald-300 text-sm",
              formFieldHintText: "text-text-faint text-xs",
              otpCodeFieldInput:
                "rounded-xl border border-border bg-surface-mid text-text-primary focus:border-accent/50",
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
            Already have an account?{" "}
            <Link href="/sign-in" className="text-accent hover:text-accent/80 font-medium">
              Sign in
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
