import { supabase } from "./supabase";

// For development, generate a static OTP
const DEV_MODE = true;
let currentOTP = "";

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export const sendOTP = async (email: string): Promise<AuthResponse> => {
  try {
    if (DEV_MODE) {
      // Generate a 6-digit OTP
      currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`DEV MODE: OTP for ${email} is ${currentOTP}`);
      return { success: true, data: { otp: currentOTP } };
    }

    // Production mode - use Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, error: error.message };
  }
};

export const verifyOTP = async (
  email: string,
  token: string,
): Promise<AuthResponse> => {
  try {
    if (DEV_MODE) {
      // In dev mode, just check against the generated OTP
      if (token === currentOTP) {
        return { success: true, data: { user: { email } } };
      } else {
        throw new Error("Invalid OTP");
      }
    }

    // Production mode - use Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: error.message };
  }
};

export const signUp = async (
  email: string,
  password: string,
  userData: any,
): Promise<AuthResponse> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (authError) throw authError;

    // Create student profile
    const { error: profileError } = await supabase.from("students").insert([
      {
        id: authData.user.id,
        email: email,
        name: userData.name,
        department: userData.department,
        status: "pending",
      },
    ]);

    if (profileError) throw profileError;

    return { success: true, data: authData };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, error: error.message };
  }
};

export const signIn = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error signing in:", error);
    return { success: false, error: error.message };
  }
};

export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};
