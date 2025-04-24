import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, password, course_id, course_name } = await req.json();

    // Validate input
    if (!email || !password || !course_id || !course_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('verification_admins')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && !checkError.message.includes('No rows found')) {
      return new Response(
        JSON.stringify({ error: 'Error checking existing user' }),
        { status: 500 }
      );
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A verification officer with this email already exists' }),
        { status: 409 }
      );
    }

    // Create verification admin
    const { data, error } = await supabase
      .from('verification_admins')
      .insert([
        {
          email,
          password_hash: password, // In production, you should hash the password
          course_id,
          course_name,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating verification admin:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create verification admin' }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (error: any) {
    console.error('Error in create-verification-admin:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
} 