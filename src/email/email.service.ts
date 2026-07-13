import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  // Sends the 6-digit registration code via Resend.
  // Throws on failure so the caller can surface a clear error to the app.
  async sendVerificationCode(to: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('EMAIL_FROM') ?? 'FishMap <onboarding@resend.dev>';
    // Replies to verification emails land in the project inbox.
    const replyTo =
      this.config.get<string>('EMAIL_REPLY_TO') ?? 'fishmapgeorgia@gmail.com';

    if (!apiKey) {
      // No key configured — log the code so local dev still works without email.
      this.logger.warn(
        `RESEND_API_KEY missing — verification code for ${to} is: ${code}`,
      );
      return;
    }

    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: replyTo,
        subject: 'ფიშმეპ — დადასტურების კოდი',
        html: this.buildHtml(code),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`Resend failed (${response.status}): ${detail}`);
      throw new Error('ვერ მოხერხდა კოდის გაგზავნა. სცადეთ მოგვიანებით.');
    }
  }

  private buildHtml(code: string): string {
    return `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 440px; margin: 0 auto; padding: 24px; background: #0f172a; border-radius: 16px; color: #f8fafc;">
        <h1 style="font-size: 20px; margin: 0 0 8px;">🎣 ფიშმეპ საქართველო</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">
          რეგისტრაციის დასასრულებლად შეიყვანე ეს კოდი აპლიკაციაში:
        </p>
        <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; text-align: center; color: #5eead4; background: #022c22; border: 1px solid rgba(45,212,191,0.3); border-radius: 12px; padding: 16px 0;">
          ${code}
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 20px 0 0;">
          კოდი მოქმედია 10 წუთის განმავლობაში. თუ რეგისტრაცია შენ არ მოგითხოვია, უბრალოდ უგულებელყავი ეს წერილი.
        </p>
      </div>
    `;
  }
}
