import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-6">About Tranquillo Green</h1>
        <p className="text-text-secondary leading-relaxed mb-4">
          Tranquillo Green is a Cannabis Financial Operations Platform (CFOP) built specifically for multi-state operators and their CPAs. We automate 280E + 471(c) tax compliance, Metrc-integrated inventory reconciliation, and month-end close workflows.
        </p>
        <p className="text-text-secondary leading-relaxed mb-8">
          Founded to solve the gap between generic accounting software and the unique regulatory demands of the cannabis industry, Tranquillo Green serves dispensaries, cultivators, manufacturers, and distributors across the United States.
        </p>
        <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition">Get Started</Link>
      </div>
    </main>
  );
}