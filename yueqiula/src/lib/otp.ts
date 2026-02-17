/** Generate 6-digit OTP */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** OTP expiry in minutes */
export const OTP_EXPIRY_MINUTES = 10;
