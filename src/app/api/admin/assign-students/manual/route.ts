import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { courseId, verificationOfficerId, startIndex, endIndex } = await request.json();

    if (!courseId || !verificationOfficerId || !startIndex || !endIndex) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get students within the specified range for the course
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
      .range(startIndex - 1, endIndex - 1);

    if (fetchError) {
      throw fetchError;
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'No students found in the specified range' },
        { status: 404 }
      );
    }

    // Update the verification officer assignment for these students
    const studentIds = students.map(student => student.id);
    const { error: updateError } = await supabase
      .from('students')
      .update({ verification_officer_id: verificationOfficerId })
      .in('id', studentIds);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: `Successfully assigned ${students.length} students to verification officer`,
      assignedCount: students.length
    });
  } catch (error) {
    console.error('Error assigning students:', error);
    return NextResponse.json(
      { error: 'Failed to assign students' },
      { status: 500 }
    );
  }
} 