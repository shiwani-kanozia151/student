import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export async function sendEmail(to: string, subject: string, text: string) {
  try {
    // For development, just log the email
    if (import.meta.env.DEV) {
      console.log('Email would be sent in production:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text);
      return;
    }

    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, text }
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}

export async function sendStatusEmail(
  to: string,
  status: 'pending' | 'approved' | 'rejected',
  remarks?: string
) {
  console.log(`Sending status update (${status}) to ${to}`);
  if (remarks) console.log(`Remarks: ${remarks}`);

  const subject = `Application Status Update: ${status.toUpperCase()}`;
  const text = `Your application status has been updated to ${status.toUpperCase()}.
${remarks ? `\nRemarks: ${remarks}` : ''}

Please log in to your account to view more details.`;

  await sendEmail(to, subject, text);
}

// This is a mock email service - replace with actual email service
export const sendOTP = async (email: string, otp: string) => {
  try {
    // For development, just log the OTP
    if (import.meta.env.DEV) {
      console.log('OTP would be sent in production:');
      console.log('To:', email);
      console.log('OTP:', otp);
      return;
    }

    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Your OTP for verification',
        text: `Your OTP is: ${otp}`
      }
    });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw new Error(error.message || 'Failed to send OTP');
  }
};