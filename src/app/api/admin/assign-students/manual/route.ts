import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface AssignmentRange {
  startIndex: number;
  endIndex: number;
  verificationOfficerId: string;
}

interface Student {
  id: string;
  roll_number: string;
}

export async function POST(req: Request) {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get session from cookie
    const cookieStore = await cookies();
    const supabaseAuthToken = cookieStore.get('sb-access-token');

    if (!supabaseAuthToken?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseAuthToken.value);
    
    if (authError || !user || user.user_metadata.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, assignments } = await req.json();

    if (!courseId || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get all students in the course
    const { rows: students } = await sql<Student>`
      SELECT id, roll_number 
      FROM students 
      WHERE course_id = ${courseId}
      ORDER BY roll_number ASC
    `;

    // Validate assignments
    for (const assignment of assignments) {
      if (
        !assignment.startIndex ||
        !assignment.endIndex ||
        !assignment.verificationOfficerId ||
        assignment.startIndex > assignment.endIndex ||
        assignment.startIndex < 1 ||
        assignment.endIndex > students.length
      ) {
        return NextResponse.json(
          { error: 'Invalid assignment range' },
          { status: 400 }
        );
      }
    }

    // Check for overlapping ranges
    assignments.sort((a, b) => a.startIndex - b.startIndex);
    for (let i = 1; i < assignments.length; i++) {
      if (assignments[i].startIndex <= assignments[i - 1].endIndex) {
        return NextResponse.json(
          { error: 'Assignment ranges overlap' },
          { status: 400 }
        );
      }
    }

    // Perform the assignments
    for (const assignment of assignments) {
      const studentsToAssign = students.slice(
        assignment.startIndex - 1,
        assignment.endIndex
      );

      // Update each student individually
      for (const student of studentsToAssign) {
        await sql`
          UPDATE students
          SET verification_officer_id = ${assignment.verificationOfficerId}
          WHERE id = ${student.id}
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in manual assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 