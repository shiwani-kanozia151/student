import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, course_id } = await request.json();

    // Validate required fields
    if (!email || !course_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Supabase credentials from request cookies or headers
    const supabaseUrl = request.cookies.get('supabaseUrl')?.value || 
                        request.headers.get('X-Supabase-URL') || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const supabaseKey = request.cookies.get('supabaseKey')?.value || 
                       request.headers.get('X-Supabase-Key') || 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete the verification admin
    const { data, error } = await supabase
      .from('verification_admins')
      .delete()
      .eq('email', email)
      .eq('course_id', course_id);

    if (error) {
      return NextResponse.json(
        { error: 'Error deleting verification admin: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Verification admin deleted successfully' },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error deleting verification admin:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
} 