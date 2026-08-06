"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Calendar,
  Play,
  BarChart3,
  FileText,
  AlertTriangle,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type Step = "info" | "schedule" | "confirmed";

/* ─── Calendar Picker ─────────────────────────────────────────────── */

function CalendarPicker({ onSelect }: { onSelect: (date: string, time: string) => void }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const generateDates = () => {
    const dates: { date: string; day: string; weekday: string }[] = [];
    const now = new Date();
    let added = 0;
    let dayOffset = 1;
    while (added < 10) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        dates.push({
          date: d.toISOString().split("T")[0],
          day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
        });
        added++;
      }
      dayOffset++;
    }
    return dates;
  };

  const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
  const dates = generateDates();

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">Select a Date & Time</h3>
      <p className="text-sm text-text-muted mb-6">All times are Eastern (ET). Demo calls are 30 minutes.</p>
      <div className="mb-6">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Pick a date</div>
        <div className="grid grid-cols-5 gap-2">
          {dates.map((d) => (
            <button key={d.date} onClick={() => setSelectedDate(d.date)}
              className={"rounded-lg border p-2 text-center transition-all " + (selectedDate === d.date ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-text-secondary hover:border-brand/30")}>
              <div className="text-[10px] text-text-muted">{d.weekday}</div>
              <div className="text-sm font-semibold">{d.day}</div>
            </button>
          ))}
        </div>
      </div>
      {selectedDate && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Pick a time (ET)</div>
          <div className="grid grid-cols-4 gap-2">
            {times.map((t) => (
              <button key={t} onClick={() => setSelectedTime(t)}
                className={"rounded-lg border px-3 py-2 text-sm text-center transition-all " + (selectedTime === t ? "border-brand bg-brand/10 text-brand font-semibold" : "border-border bg-surface text-text-secondary hover:border-brand/30")}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedDate && selectedTime && (
        <button onClick={() => onSelect(selectedDate, selectedTime)}
          className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all">
          Confirm Demo <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ─── Step: Company Info ──────────────────────────────────────────── */

function StepInfo({ onNext }: { onNext: (data: Record<string, string>) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", licenseNumber: "", state: "", operatorType: "dispensary", revenueRange: "" });
  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const isValid = form.firstName && form.lastName && form.email && form.company && form.state && form.licenseNumber;

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Verify Your Company</h2>
      <p className="text-sm text-text-muted mb-6">We verify every demo request to ensure we show you the right setup. This takes about 60 seconds.</p>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">First Name *</label>
            <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Last Name *</label>
            <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Work Email *</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" placeholder="you@company.com" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Company Name *</label>
            <input type="text" value={form.company} onChange={(e) => update("company", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">License Number *</label>
            <input type="text" value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" placeholder="e.g., C11-0000012-LIC" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">State *</label>
            <select value={form.state} onChange={(e) => update("state", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="">Select state...</option>
              {["California","Colorado","Michigan","Illinois","Ohio","Oregon","New York","Arizona","Nevada","Massachusetts","Maryland","Missouri","Oklahoma","Pennsylvania","Virginia","Connecticut","Maine","Vermont","Rhode Island","New Jersey","New Mexico","Montana","Alaska"].map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Operator Type</label>
            <select value={form.operatorType} onChange={(e) => update("operatorType", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="dispensary">Dispensary / Retail</option>
              <option value="cultivator">Cultivator / Grow</option>
              <option value="manufacturer">Manufacturer / Processor</option>
              <option value="distributor">Distributor / Transport</option>
              <option value="vertical">Vertical (Multi-operation)</option>
              <option value="delivery">Delivery</option>
              <option value="cpa">CPA Firm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Annual Revenue Range</label>
            <select value={form.revenueRange} onChange={(e) => update("revenueRange", e.target.value)} className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="">Select...</option>
              <option value="under-1m">Under $1M</option>
              <option value="1m-5m">$1M – $5M</option>
              <option value="5m-20m">$5M – $20M</option>
              <option value="20m-100m">$20M – $100M</option>
              <option value="100m+">$100M+</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-surface/50 p-3">
        <Shield className="h-4 w-4 text-brand shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">Your information is encrypted and used only to verify your cannabis license and prepare your demo. We never share your data.</p>
      </div>
      <button disabled={!isValid} onClick={() => onNext(form)}
        className="mt-6 w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        Continue to Payment <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Step: Schedule ──────────────────────────────────────────────── */

function StepSchedule({ onNext, onBack }: { onNext: (date: string, time: string) => void; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary mb-4 transition-colors"><ArrowLeft className="h-4 w-4" /> Back</button>
      <CalendarPicker onSelect={(date, time) => onNext(date, time)} />
    </div>
  );
}

/* ─── Step: Confirmed — Sandbox Access + Video Call ───────────────── */

function StepConfirmed({ date, time, companyName }: { date: string; time: string; companyName: string }) {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const sandboxUrl = "/dashboard?demo=true";

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 mb-4">
          <Check className="h-8 w-8 text-brand" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">You&apos;re All Set</h2>
        <p className="mt-2 text-text-muted">Your demo is confirmed and sandbox access is ready.</p>
      </div>

      {/* Sandbox access card */}
      <div className="rounded-xl border-2 border-brand/30 bg-gradient-to-br from-brand/5 to-surface p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 shrink-0">
            <Sparkles className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary">Sandbox Demo Ready</h3>
            <p className="mt-1 text-sm text-text-muted">Explore the full platform with pre-loaded sample data. No payment details required — subscribe only when you decide to.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand" /> 3 locations, 2 entities</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand" /> 100+ sample transactions</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand" /> Metrc sync simulation</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand" /> 280E allocation engine</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand" /> CPA export packets</span>
              <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-brand" /> Month-end close workflow</span>
            </div>
            <a
              href={sandboxUrl}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-all"
            >
              <Play className="h-4 w-4" />
              Launch Sandbox Demo
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Video call card */}
      <div className="rounded-xl border border-border bg-surface-raised p-5">
        <h3 className="text-base font-semibold text-text-primary mb-3">Live Demo Call</h3>
        <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 mb-4">
          <Calendar className="h-5 w-5 text-brand shrink-0" />
          <div>
            <div className="text-sm font-semibold text-text-primary">{formattedDate}</div>
            <div className="text-sm text-text-muted">{time} Eastern (30 min)</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
            <span>A calendar invite has been sent to your email with the video call link.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
            <span>We&apos;ll send a reminder 24 hours before your scheduled time.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
            <span>Your sandbox data will be preserved for the live walkthrough.</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <a href="/pricing" className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
          <DollarSign className="h-4 w-4" /> View Pricing
        </a>
        <a href="/calculator" className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
          <BarChart3 className="h-4 w-4" /> 280E Calculator
        </a>
        <a href="/" className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-text-secondary hover:border-brand/30 hover:text-brand transition-all">
          <FileText className="h-4 w-4" /> Back to Home
        </a>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */

export default function DemoPage() {
  const [step, setStep] = useState<Step>("info");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const steps: { key: Step; label: string; icon: typeof Check }[] = [
    { key: "info", label: "Verify Company", icon: Check },
    { key: "schedule", label: "Schedule", icon: Calendar },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(34, 133, 90, 0.06), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(212, 146, 42, 0.03), transparent 60%)" }} />
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16 lg:py-24">
        <section className="text-center mb-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Book a walkthrough</h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-text-secondary">Thirty minutes with someone who knows 280E, walking your operation&rsquo;s numbers rather than a slide deck.</p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-text-muted">Want to look around first? <a href="/try" className="font-medium text-brand hover:underline">Open the sandbox</a> — free account, no card, no call required.</p>
        </section>

        {step !== "confirmed" && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all " + (i <= currentStepIndex ? "bg-brand text-white" : "bg-surface border border-border text-text-faint")}>
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={"text-xs font-medium hidden sm:block " + (i <= currentStepIndex ? "text-text-primary" : "text-text-faint")}>{s.label}</span>
                {i < steps.length - 1 && (<div className={"h-px w-8 " + (i < currentStepIndex ? "bg-brand" : "bg-border")} />)}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface/60 p-6 sm:p-8 backdrop-blur-sm">
          {step === "info" && (<StepInfo onNext={(data) => { setFormData(data); setStep("schedule"); }} />)}
          {step === "schedule" && (<StepSchedule onNext={(date, time) => { setScheduledDate(date); setScheduledTime(time); setStep("confirmed"); }} onBack={() => setStep("info")} />)}
          {step === "confirmed" && (<StepConfirmed date={scheduledDate} time={scheduledTime} companyName={formData.company || "Your Company"} />)}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-brand" /> Encrypted & secure</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> No charge until demo</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand" /> 30-day money-back</span>
        </div>
      </div>
    </main>
  );
}
