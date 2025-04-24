import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Extract data from request body
    const { email, password, course_id, course_name } = await request.json();

    // Validate required fields
    if (!email || !password || !course_id || !course_name) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, course_id, course_name)' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if admin with this email already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('verification_admins')
      .select('id')
      .eq('email', email)
      .single();
    
    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('Error checking existing admin:', checkError);
      return NextResponse.json(
        { error: 'Error checking existing user' },
        { status: 500 }
      );
    }

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'A verification officer with this email already exists' },
        { status: 409 }
      );
    }

    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Then create verification admin record
    const { data: adminData, error: adminError } = await supabase
      .from('verification_admins')
      .insert([
        {
          id: authData.user.id,
          email,
          course_id,
          course_name,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (adminError) {
      console.error('Error creating verification admin:', adminError);
      // Clean up auth user if admin creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create verification admin record' },
        { status: 500 }
      );
    }

    return NextResponse.json(adminData, { status: 201 });
  } catch (error: any) {
    console.error('Error in add-verification-admin:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 