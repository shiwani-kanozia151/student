import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, password, course_id, course_name } = await req.json();

    // Validate required fields
    if (!email || !password || !course_id || !course_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (email, password, course_id, course_name)' }),
        { status: 400 }
      );
    }

    // Check if admin with this email already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('verification_admins')
      .select('id')
      .eq('email', email)
      .single();
    
    if (checkError && !checkError.message.includes('No rows found')) {
      console.error('Error checking existing admin:', checkError);
      return new Response(
        JSON.stringify({ error: 'Error checking existing user' }),
        { status: 500 }
      );
    }

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'A verification officer with this email already exists' }),
        { status: 409 }
      );
    }

    // Create verification admin record
    const { data: adminData, error: adminError } = await supabase
      .from('verification_admins')
      .insert([
        {
          email,
          password_hash: password, // Note: In production, you should hash the password
          course_id,
          course_name,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (adminError) {
      console.error('Error creating verification admin:', adminError);
      return new Response(
        JSON.stringify({ error: 'Failed to create verification admin record' }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(adminData), { 
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Error in add-verification-admin:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
} 