import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  course_type: string;
  courses: {
    name: string;
  } | null;
  status: string;
  verification_officer_id: string | null;
}

interface DatabaseStudent {
  id: string;
  name: string;
  email: string;
  course_type: string;
  courses: {
    name: string;
  };
  status: string;
  verification_officer_id: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        email,
        course_type,
        courses!inner (
          name
        ),
        status,
        verification_officer_id
      `)
      .eq('course_id', params.courseId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json([]);
    }

    // Transform the data to match the expected format
    const transformedStudents = data.map(student => {
      const typedStudent = student as unknown as DatabaseStudent;
      return {
        id: typedStudent.id,
        name: typedStudent.name,
        email: typedStudent.email,
        courseType: typedStudent.course_type,
        courseName: typedStudent.courses.name,
        status: typedStudent.status,
        verificationOfficerId: typedStudent.verification_officer_id
      };
    });

    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
} 