import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  try {
    return new Resend(key);
  } catch {
    return null;
  }
}

const resend = getResend();

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: [to],
        subject: `约球啦验证码：${code}`,
        html: `
          <p>您的验证码是：<strong>${code}</strong></p>
          <p>验证码10分钟内有效，请勿泄露。</p>
        `,
      });
      if (error) {
        console.error("Resend error:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Resend send failed:", err);
      throw err;
    }
  }
  // Dev fallback: log to console
  console.log(`[DEV] OTP for ${to}: ${code}`);
  return true;
}
