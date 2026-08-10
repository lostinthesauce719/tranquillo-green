/**
 * Email notification middleware for business events using Resend.
 *
 * Handles:
 * - captureLead: sales notification
 * - startTrial: customer welcome email
 * - activateSubscription: receipt/invoice email
 */

import { Resend } from "resend";

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

/**
 * New lead notification email to sales team.
 */
export function buildLeadNotificationEmail(lead: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  operatorType: string;
  state: string;
  monthlyRevenueRange?: string;
  painPoints: string[];
  score: number;
}) {
  return {
    from: "Tranquillo Green <notifications@tranquillogreen.com>",
    to: ["admin@tranquillogreen.com"],
    subject: `[NEW LEAD] ${lead.companyName} — ${lead.operatorType} in ${lead.state} (score: ${lead.score})`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <div style="border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 20px; color: #1e40af;">
              🚀 New Lead: ${lead.companyName}
            </h1>
          </div>

          <p style="font-size: 16px; margin: 16px 0;">
            A new lead has been captured from the website. Here are the details:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 40%;">Company</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lead.companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Contact</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lead.contactName} &lt;${lead.email}&gt;</td>
            </tr>
            ${lead.phone ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Phone</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lead.phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Operator Type</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lead.operatorType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">State</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lead.state}</td>
            </tr>
            ${lead.monthlyRevenueRange ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Monthly Revenue</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${lead.monthlyRevenueRange}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Lead Score</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lead.score}/98</td>
            </tr>
          </table>

          ${lead.painPoints.length > 0 ? `
          <div style="margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">Pain Points:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${lead.painPoints.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>` : ''}

          <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              <strong>Next Step:</strong> Reach out within 24 hours to qualify this lead and offer a personalized proposal.
            </p>
          </div>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            This notification was generated automatically by the Tranquillo Green platform.
          </p>
        </body>
      </html>
    `,
  };
}

/**
 * Welcome email sent to customer when they start a trial.
 */
export function buildTrialWelcomeEmail(customer: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  tier: string;
  tierDisplayName: string;
  monthlyPrice: number;
  trialEndsAt: number;
  portalUrl: string;
}) {
  const trialEndDate = new Date(customer.trialEndsAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    from: "Tranquillo Green <welcome@tranquillogreen.com>",
    to: [customer.contactEmail],
    subject: `Welcome to Tranquillo Green — Your ${customer.tierDisplayName} Trial Is Live!`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <div style="border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 20px; color: #1e40af;">
              🎉 Welcome to Tranquillo Green, ${customer.contactName}!
            </h1>
          </div>

          <p style="font-size: 16px; margin: 16px 0;">
            Your <strong>${customer.tierDisplayName}</strong> trial is now live. We're excited to help you streamline compliance and accounting for your cannabis business.
          </p>

          <div style="margin: 16px 0; padding: 20px; background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%); color: white; border-radius: 12px;">
            <h2 style="margin: 0 0 12px 0; font-size: 18px;">Your Trial Details</h2>
            <table style="width: 100%; color: white;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Plan:</td>
                <td style="padding: 8px 0;">${customer.tierDisplayName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Regular Price:</td>
                <td style="padding: 8px 0;">$${customer.monthlyPrice}/month</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Trial Expires:</td>
                <td style="padding: 8px 0;">${trialEndDate}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">Getting Started</h3>
            <ol style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Log in to your dashboard and complete your company profile</li>
              <li style="margin-bottom: 8px;">Connect your accounting data or import demo transactions</li>
              <li style="margin-bottom: 8px;">Explore the compliance dashboard and AI assistant</li>
              <li>Schedule a onboarding call if you need help</li>
            </ol>
          </div>

          <div style="margin: 24px 0; text-align: center;">
            <a href="${customer.portalUrl}"
               style="display: inline-block; padding: 14px 32px; background: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Access Your Dashboard
            </a>
          </div>

          <div style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              <strong>Questions?</strong> Reply to this email or contact support@tranquillogreen.com. We're here to help you succeed.
            </p>
          </div>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            Tranquillo Green — Intelligent compliance and accounting for the cannabis industry.
          </p>
        </body>
      </html>
    `,
  };
}

/**
 * Subscription activation receipt email.
 */
export function buildSubscriptionReceiptEmail(customer: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  tier: string;
  tierDisplayName: string;
  monthlyPrice: number;
  billingCycle: string;
  invoiceNumber: string;
  invoiceId: string;
  periodStart: number;
  periodEnd: number;
}) {
  const startDate = new Date(customer.periodStart).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endDate = new Date(customer.periodEnd).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const billingCycleLabel =
    customer.billingCycle === "monthly"
      ? "Monthly"
      : customer.billingCycle === "quarterly"
        ? "Quarterly"
        : "Annual";

  const total = customer.monthlyPrice;

  return {
    from: "Tranquillo Green <billing@tranquillogreen.com>",
    to: [customer.contactEmail],
    subject: `Your Tranquillo Green ${customer.tierDisplayName} Subscription is Active`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <div style="border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 20px; color: #1e40af;">
              ✅ Subscription Activated — ${customer.tierDisplayName}
            </h1>
          </div>

          <p style="font-size: 16px; margin: 16px 0;">
            Congratulations! Your <strong>${customer.tierDisplayName}</strong> subscription is now active. Thank you for choosing Tranquillo Green.
          </p>

          <div style="margin: 16px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 16px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
              Invoice: ${customer.invoiceNumber}
            </h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Billed To:</td>
                <td style="padding: 8px 0;">${customer.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Plan:</td>
                <td style="padding: 8px 0;">${customer.tierDisplayName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Billing Cycle:</td>
                <td style="padding: 8px 0;">${billingCycleLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Period:</td>
                <td style="padding: 8px 0;">${startDate} — ${endDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Total Due:</td>
                <td style="padding: 8px 0; font-size: 20px; font-weight: 700; color: #059669;">$${total}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">What's Next?</h3>
            <ul style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 6px;">You'll receive invoices automatically at the start of each billing cycle</li>
              <li style="margin-bottom: 6px;">Access all features and integrations immediately</li>
              <li style="margin-bottom: 6px;">Need to add team members? Visit Settings → Billing</li>
              <li>Questions about your invoice? Contact billing@tranquillogreen.com</li>
            </ul>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <p style="margin: 0 0 12px 0;">
              <a href="/dashboard"
                 style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Go to Dashboard
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              Invoice ID: ${customer.invoiceId}
            </p>
          </div>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            Tranquillo Green — Intelligent compliance and accounting for the cannabis industry.
            <br />
            Questions? Contact our support team at support@tranquillogreen.com.
          </p>
        </body>
      </html>
    `,
  };
}

// ─── EMAIL SENDING UTILITY ────────────────────────────────────────────────────

/**
 * Send an email using Resend.
 */
export async function sendEmail(data: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: data.from,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
    });

    console.log(`✅ Email sent: ${result.data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ─── NOTIFICATION FUNCTIONS ───────────────────────────────────────────────────

/**
 * Send new lead notification to sales team.
 */
export async function notifyLeadCaptured(lead: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  operatorType: string;
  state: string;
  monthlyRevenueRange?: string;
  painPoints: string[];
  score: number;
}) {
  const email = buildLeadNotificationEmail(lead);
  return sendEmail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}

/**
 * Send welcome email to customer starting a trial.
 */
export async function notifyTrialStarted(customer: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  tier: string;
  tierDisplayName: string;
  monthlyPrice: number;
  trialEndsAt: number;
  portalUrl: string;
}) {
  const email = buildTrialWelcomeEmail(customer);
  return sendEmail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}

/**
 * Send subscription activation receipt email.
 */
export async function notifySubscriptionActivated(customer: {
  companyName: string;
  contactName: string;
  contactEmail: string;
  tier: string;
  tierDisplayName: string;
  monthlyPrice: number;
  billingCycle: string;
  invoiceNumber: string;
  invoiceId: string;
  periodStart: number;
  periodEnd: number;
}) {
  const email = buildSubscriptionReceiptEmail(customer);
  return sendEmail({
    from: email.from,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}

// ─── INTEGRATION OBJECT ───────────────────────────────────────────────────────

/**
 * Unified export for business mutation integration.
 */
export const emailNotifications = {
  captureLead: notifyLeadCaptured,
  startTrial: notifyTrialStarted,
  activateSubscription: notifySubscriptionActivated,
};
