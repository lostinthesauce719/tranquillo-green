import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Branding header */}
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-accent">
          Tranquillo Labs
        </div>
        <div className="mt-2 text-3xl font-semibold text-text-primary">
          Green
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Reset your password to continue
        </p>
      </div>

      {/* Clerk sign-in with forgot password flow */}
      <SignIn
        routing="path"
        path="/forgot-password"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20",
            headerTitle: "text-text-primary",
            headerSubtitle: "text-text-muted",
            socialButtonsBlockButton:
              "border-border bg-surface-raised text-text-primary hover:bg-surface-overlay",
            dividerLine: "bg-border",
            dividerText: "text-text-muted",
            formFieldLabel: "text-text-muted text-xs uppercase tracking-wider",
            formFieldInput:
              "bg-surface-raised border-border text-text-primary rounded-xl focus:border-brand",
            formButtonPrimary:
              "bg-brand hover:bg-brand/90 text-white rounded-xl font-semibold",
            footerActionLink: "text-brand hover:text-brand/80",
            identityPreviewText: "text-text-secondary",
            identityPreviewEditButtonIcon: "text-text-muted",
            alertText: "text-text-primary",
            alert: "rounded-xl border border-border bg-surface-raised",
          },
          variables: {
            colorPrimary: "#22855a",
            colorBackground: "#0e1526",
            colorText: "#f1f5f9",
            colorTextSecondary: "#94A3B8",
            colorInputText: "#f1f5f9",
            colorInputBackground: "#141d33",
            borderRadius: "12px",
          },
        }}
      />

      {/* Back to sign-in link */}
      <div className="mt-6 text-center">
        <Link
          href="/sign-in"
          className="text-sm text-text-muted transition hover:text-text-primary"
        >
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  );
}
