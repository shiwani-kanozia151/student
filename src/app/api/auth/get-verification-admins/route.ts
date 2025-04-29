import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Extract course_id from the URL params
    const url = new URL(request.url);
    const courseId = url.searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing course_id parameter' },
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

    // Fetch verification admins for the specified course
    const { data, error } = await supabase
      .from('verification_admins')
      .select('id, email, course_id, course_name, created_at, last_login')
      .eq('course_id', courseId);

    if (error) {
      return NextResponse.json(
        { error: 'Error fetching verification admins: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
    
  } catch (error: any) {
    console.error('Error fetching verification admins:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
} 