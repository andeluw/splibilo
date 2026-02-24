import { Inject, Injectable } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail.constants';

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

@Injectable()
export class MailService {
  private readonly fromAddress: string;
  private readonly fromName: string;

  constructor(
    @Inject(MAIL_TRANSPORTER)
    private readonly transporter: Transporter,
  ) {
    this.fromAddress = process.env.MAIL_FROM_ADDRESS ?? 'no-reply@example.com';
    this.fromName = process.env.MAIL_FROM_NAME ?? 'Splibilo';
  }

  private get from() {
    return `"${this.fromName}" <${this.fromAddress}>`;
  }

  /** Base HTML layout so all emails look consistent */
  private wrapHtml({
    title,
    previewText,
    content,
  }: {
    title: string;
    previewText?: string;
    content: string;
  }) {
    // previewText will be hidden but used by email clients as preview snippet
    const preview = previewText ?? title;

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="
    margin:0;
    padding:0;
    background-color:#f4f4ff;
    font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
    color:#111827;
  ">
    <!-- Hidden preview text -->
    <div style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
      visibility:hidden;
    ">
      ${preview}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4ff; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:transparent; padding:0 16px;">
            <!-- Brand header -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <span style="
                  display:inline-block;
                  font-weight:700;
                  font-size:20px;
                  letter-spacing:-0.02em;
                  color:#3730a3;
                ">
                  Splibilo
                </span>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="
                  background-color:#ffffff;
                  border-radius:16px;
                  border:1px solid #e5e7eb;
                  box-shadow:0 10px 25px rgba(15,23,42,0.06);
                  overflow:hidden;
                ">
                  <tr>
                    <td style="padding:24px 24px 8px 24px;">
                      <h1 style="
                        margin:0;
                        font-size:22px;
                        line-height:1.3;
                        font-weight:700;
                        letter-spacing:-0.02em;
                        color:#111827;
                      ">
                        ${title}
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 8px 24px;">
                      <p style="
                        margin:8px 0 0 0;
                        font-size:14px;
                        line-height:1.6;
                        color:#6b7280;
                      ">
                        ${preview}
                      </p>
                    </td>
                  </tr>

                  <!-- Dynamic content -->
                  <tr>
                    <td style="padding:16px 24px 24px 24px;">
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:18px;">
                <p style="
                  margin:0;
                  font-size:11px;
                  line-height:1.5;
                  color:#9ca3af;
                ">
                  You are receiving this email because you use Splibilo to track shared expenses.
                </p>
                <p style="
                  margin:4px 0 0 0;
                  font-size:11px;
                  line-height:1.5;
                  color:#9ca3af;
                ">
                  © ${new Date().getFullYear()} Splibilo. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim();
  }

  async sendGroupInviteMail(params: {
    to: string;
    groupName: string;
    inviteCode: string;
    inviteId: string;
  }) {
    const joinUrl = `${frontendUrl}/login`;

    const subject = `You have been invited to join "${params.groupName}"`;
    const previewText = `Join the group "${params.groupName}" on Splibilo and start sharing expenses.`;

    const text = [
      `You have been invited to join the group "${params.groupName}".`,
      ``,
      `Use this invite link:`,
      joinUrl,
      ``,
      `Or use this invite code inside the app: ${params.inviteCode}`,
    ].join('\n');

    const content = `
      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#374151;">
        You have been invited to join the group <strong>${params.groupName}</strong> on Splibilo.
      </p>

      <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5563;">
        Join the group to start tracking shared expenses, keep balances clear, and settle up with everyone with less friction.
      </p>

      <!-- Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 8px 0;">
        <tr>
          <td>
            <a
              href="${joinUrl}"
              style="
                display:inline-block;
                padding:10px 18px;
                border-radius:9999px;
                background-color:#4f46e5;
                color:#f9fafb;
                font-size:14px;
                font-weight:600;
                text-decoration:none;
              "
            >
              Join group
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:8px 0 0 0; font-size:12px; line-height:1.6; color:#6b7280;">
        Or open Splibilo and use this invite code:
      </p>

      <div style="
        margin-top:8px;
        padding:10px 12px;
        display:inline-block;
        border-radius:9999px;
        border:1px dashed #c7d2fe;
        background-color:#eff6ff;
        font-size:14px;
        letter-spacing:0.16em;
        font-weight:600;
        color:#3730a3;
      ">
        ${params.inviteCode}
      </div>
    `;

    const html = this.wrapHtml({
      title: subject,
      previewText,
      content,
    });

    await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject,
      text,
      html,
    });
  }

  async sendSettlementReceivedMail(params: {
    to: string; // receiver email
    receiverName: string;
    senderName: string;
    amount: number;
    currency?: string;
    groupName: string;
    groupId: string;
    settlementId: string;
    notes?: string | null;
  }) {
    const currency = params.currency ?? 'IDR';
    const groupUrl = `${frontendUrl}/groups/${params.groupId}/settlements`;

    const subject = `You received a settlement from ${params.senderName} in "${params.groupName}"`;
    const previewText = `${params.senderName} recorded a settlement to you in "${params.groupName}" on Splibilo.`;

    const lines: string[] = [
      `Hi ${params.receiverName},`,
      ``,
      `${params.senderName} recorded a settlement to you in the group "${params.groupName}".`,
      `Amount: ${currency} ${params.amount.toLocaleString('id-ID')}`,
      `From: ${params.senderName}`,
    ];

    if (params.notes) {
      lines.push(`Notes: ${params.notes}`);
    }

    lines.push(``, `You can review this settlement in the app:`, groupUrl);

    const text = lines.join('\n');

    const notesBlock = params.notes
      ? `
      <tr>
        <td style="padding-top:4px;">
          <span style="font-size:12px; font-weight:600; color:#6b7280;">Notes:</span>
          <div style="
            margin-top:4px;
            font-size:13px;
            line-height:1.6;
            color:#4b5563;
          ">
            ${params.notes}
          </div>
        </td>
      </tr>
    `
      : '';

    const content = `
      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#374151;">
        Hi ${params.receiverName},
      </p>

      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#4b5563;">
        <strong>${params.senderName}</strong> recorded a settlement to you in the group <strong>${params.groupName}</strong>.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="
        width:100%;
        margin:8px 0 12px 0;
        border-radius:12px;
        border:1px solid #e5e7eb;
        background:#f9fafb;
        padding:12px 14px;
      ">
        <tr>
          <td style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; padding-bottom:4px;">
            Amount
          </td>
        </tr>
        <tr>
          <td style="font-size:18px; font-weight:700; color:#111827;">
            ${currency} ${params.amount.toLocaleString('id-ID')}
          </td>
        </tr>
        <tr>
          <td style="padding-top:10px; font-size:12px; color:#6b7280;">
            From <span style="font-weight:600; color:#374151;">${params.senderName}</span>
          </td>
        </tr>
        ${notesBlock}
      </table>

      <p style="margin:8px 0 16px 0; font-size:13px; line-height:1.6; color:#6b7280;">
        You can review this settlement and your updated balance inside the group.
      </p>

      <!-- Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px 0;">
        <tr>
          <td>
            <a
              href="${groupUrl}"
              style="
                display:inline-block;
                padding:10px 18px;
                border-radius:9999px;
                background-color:#4f46e5;
                color:#f9fafb;
                font-size:14px;
                font-weight:600;
                text-decoration:none;
              "
            >
              View settlement
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:12px 0 0 0; font-size:12px; line-height:1.6; color:#9ca3af;">
        If the button does not work, copy and paste this link into your browser:
        <br />
        <a href="${groupUrl}" style="color:#4f46e5; text-decoration:underline; word-break:break-all;">
          ${groupUrl}
        </a>
      </p>
    `;

    const html = this.wrapHtml({
      title: subject,
      previewText,
      content,
    });

    await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject,
      text,
      html,
    });
  }
}
