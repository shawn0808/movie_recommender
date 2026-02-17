/**
 * Send SMS OTP via Tencent Cloud SMS (腾讯云短信).
 * Requires: TENCENT_SMS_SECRET_ID, TENCENT_SMS_SECRET_KEY, TENCENT_SMS_SDK_APP_ID,
 *           TENCENT_SMS_SIGN_NAME, TENCENT_SMS_TEMPLATE_ID
 * Without config, logs to console for dev.
 */
export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const secretId = process.env.TENCENT_SMS_SECRET_ID;
  const secretKey = process.env.TENCENT_SMS_SECRET_KEY;
  const sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID;
  const signName = process.env.TENCENT_SMS_SIGN_NAME;
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID;

  if (!secretId || !secretKey || !sdkAppId || !signName || !templateId) {
    console.log(`[DEV] SMS OTP for ${phone}: ${code}`);
    return true;
  }

  try {
    const { sms } = await import("tencentcloud-sdk-nodejs-sms");
    // v20190711: 国内短信 (China mainland)
    const SmsClient = sms.v20190711.Client;
    const client = new SmsClient({
      credential: { secretId, secretKey },
      region: "ap-guangzhou",
    });

    // China mainland: +86 + 11 digits (remove leading 0 if user typed 0138...)
    const digits = phone.replace(/\D/g, "").replace(/^0?86/, "") || phone;
    const formattedPhone = `+86${digits}`;

    const result = await client.SendSms({
      PhoneNumberSet: [formattedPhone],
      SmsSdkAppId: sdkAppId,
      SignName: signName,
      TemplateId: templateId,
      TemplateParamSet: [code],
    });

    const status = result.SendStatusSet?.[0];
    if (status?.Code === "Ok") {
      return true;
    }
    console.error("Tencent SMS error:", status?.Code, status?.Message);
    return false;
  } catch (err) {
    console.error("Tencent SMS send failed:", err);
    throw err;
  }
}
