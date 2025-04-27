import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;

    if (!courseId) {
      return new NextResponse(
        JSON.stringify({ error: 'Course ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all students who have applications for this course
    const { data, error } = await supabase
      .from('applications')
      .select('student_id')
      .eq('course_id', courseId);

    if (error) {
      console.error('Error counting students:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to count students' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Count unique student IDs
    const uniqueStudentIds = new Set(data?.map(app => app.student_id) || []);
    const count = uniqueStudentIds.size;

    return new NextResponse(
      JSON.stringify({ count }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in student count API:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Server error: ' + error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 