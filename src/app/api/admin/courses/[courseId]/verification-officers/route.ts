import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    const courseId = params.courseId;
    console.log('Received request for course:', courseId);

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400, headers }
      );
    }

    // Fetch verification officers assigned to this course
    const { data: officers, error } = await supabase
      .from('verification_admins')
      .select('id, email, course_id, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers }
      );
    }

    if (!officers) {
      console.log('No officers found for course:', courseId);
      return NextResponse.json([], { status: 200, headers });
    }

    console.log('Found officers:', officers);

    // Transform the data
    const transformedOfficers = officers.map(officer => ({
      id: officer.id,
      name: officer.email,
      email: officer.email
    }));

    return NextResponse.json(transformedOfficers, { headers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
} 