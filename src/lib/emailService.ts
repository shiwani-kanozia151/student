import { supabase } from './supabaseClient';

// This is a mock email service - replace with actual email service
export const sendOTP = async (email: string, otp: string) => {
  console.log(`Sending OTP ${otp} to ${email}`);
  // In production, integrate with a real email service
  return true;
};

export async function sendStatusEmail(
  email: string,
  status: 'pending' | 'approved' | 'rejected',
  remarks?: string
) {
  try {
    // Call your email service endpoint
    const { data, error } = await supabase.functions.invoke('send-status-email', {
      body: {
        to: email,
        status,
        remarks,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending status email:', error);
    throw error;
  }
}