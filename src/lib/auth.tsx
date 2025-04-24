import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// For development, generate a static OTP
const DEV_MODE = true;
let currentOTP = "";

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// Define the auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { name: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData: { name: string }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create the student profile
    const { error: profileError } = await supabase
      .from('students')
      .insert({
        id: authData.user.id,
        email: email,
        name: userData.name,
        status: 'pending'
      });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export the useAuth hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the types
export type { AuthContextType };

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

export const signIn = async (
  email: string,
  password: string,
  otp?: string
): Promise<AuthResponse> => {
  try {
    // First verify OTP if provided
    if (otp) {
      const verified = await verifyOTP(email, otp);
      if (!verified.success) throw new Error(verified.error);
    }

    // Then proceed with sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

export const signUp = async (
  email: string,
  password: string,
  userData: { name: string }
): Promise<AuthResponse> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create the student profile
    const { error: profileError } = await supabase
      .from('students')
      .insert({
        id: authData.user.id,
        email: email,
        name: userData.name,
        status: 'pending'
      });

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return {
      success: true,
      data: authData
    };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
