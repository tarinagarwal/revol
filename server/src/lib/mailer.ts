import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Transactional email via Gmail SMTP (app password).
 * Every template follows brand voice: calm, elegant, never loud.
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
      throw new Error("Gmail SMTP env not configured");
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

function otpTemplate(title: string, intro: string, code: string): string {
  return `
  <div style="margin:0;padding:0;background-color:#000000;">
    <div style="max-width:480px;margin:0 auto;padding:48px 24px;font-family:Georgia,'Times New Roman',serif;">
      <div style="text-align:center;margin-bottom:36px;">
        <span style="font-size:22px;letter-spacing:8px;color:#D4A64A;text-transform:uppercase;">revol</span>
      </div>
      <div style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:16px;padding:40px 32px;text-align:center;">
        <p style="color:#F8F6F1;font-size:20px;margin:0 0 12px;">${title}</p>
        <p style="color:#b8b5ae;font-size:14px;line-height:1.7;margin:0 0 32px;font-family:Arial,Helvetica,sans-serif;">${intro}</p>
        <div style="display:inline-block;background-color:#000000;border:1px solid rgba(212,166,74,0.4);border-radius:12px;padding:18px 32px;">
          <span style="color:#D4A64A;font-size:32px;letter-spacing:12px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">${code}</span>
        </div>
        <p style="color:#b8b5ae;font-size:12px;margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;">
          This code expires in 10 minutes. If it wasn't you, quietly ignore this.
        </p>
      </div>
      <p style="text-align:center;color:#4a4a4a;font-size:11px;margin-top:32px;font-style:italic;">
        Chemistry before clarity.
      </p>
    </div>
  </div>`;
}

export async function sendOtpEmail(
  to: string,
  purpose: "verify-email" | "reset-password",
  code: string,
): Promise<void> {
  const subject = purpose === "verify-email" ? "Your Revol verification code" : "Reset your Revol password";
  const title = purpose === "verify-email" ? "One step from the story." : "Let's get you back in.";
  const intro =
    purpose === "verify-email"
      ? "Enter this code to verify your email and begin."
      : "Enter this code to reset your password.";

  await getTransporter().sendMail({
    from: `"Revol" <${env.GMAIL_USER}>`,
    to,
    subject,
    html: otpTemplate(title, intro, code),
  });
}
