import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { NotificationInbox } from "@/components/accounting/notification-inbox";

export const metadata = {
  title: "Notifications — Tranquillo Green",
  description: "Centralized alert inbox for compliance, close, and operational notifications.",
};

export default function NotificationsPage() {
  return (
    <AppShell
      title="Notification Inbox"
      description=" centralized view of all alerts, reminders, and action items across your cannabis financial operations."
    >
      <NotificationInbox />
    </AppShell>
  );
}
