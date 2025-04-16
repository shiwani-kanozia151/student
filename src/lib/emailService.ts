// This is a mock email service - replace with actual email service
export const sendOTP = async (email: string, otp: string) => {
  console.log(`Sending OTP ${otp} to ${email}`);
  // In production, integrate with a real email service
  return true;
};

export const sendStatusEmail = async (
  email: string, 
  status: string,
  remarks?: string
) => {
  console.log(`Sending status update (${status}) to ${email}`);
  if (remarks) console.log(`Remarks: ${remarks}`);
  // In production, integrate with your email service
  return true;
};