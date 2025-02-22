// This is a mock email service - replace with actual email service
export const sendOTP = async (email: string, otp: string) => {
  console.log(`Sending OTP ${otp} to ${email}`);
  // In production, integrate with a real email service
  return true;
};
