import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Specify the runtime
export const runtime = 'nodejs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, course_id, course_name } = body;

    // Validate input
    if (!email || !password || !course_id || !course_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account: ' + authError.message },
        { status: 500 }
      );
    }

    if (!authData?.user?.id) {
      return NextResponse.json(
        { error: 'Failed to create user account: No user ID returned' },
        { status: 500 }
      );
    }

    // Then create the verification admin record
    const { data: adminData, error: adminError } = await supabase
      .from('verification_admins')
      .insert([
        {
          id: authData.user.id,
          email,
          password_text: password,
          course_id,
          course_name,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (adminError) {
      // Clean up auth user if admin creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('Error creating verification admin:', adminError);
      return NextResponse.json(
        { error: 'Failed to create verification admin: ' + adminError.message },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: adminData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in create-verification-admin:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error.message || 'Unknown error'),
        details: error.stack
      },
      { status: 500 }
    );
  }
} 