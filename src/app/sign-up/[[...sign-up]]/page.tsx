import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20",
          },
        }}
      />
    </div>
  );
}
