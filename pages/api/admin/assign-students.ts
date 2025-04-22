// student/pages/api/admin/assign-students.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { courseId, courseName } = req.body
  try {
    // 1) Fetch officers for this course
    const { data: officers, error: officersError } = await supabaseAdmin
      .from('verification_admins')
      .select('id')
      .eq('course_id', courseId)

    if (officersError) throw officersError
    if (!officers?.length) {
      return res.status(400).json({ error: `No officers for ${courseName}` })
    }

    // 2) Fetch all student IDs who applied to this course
    const { data: apps, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('student_id')
      .eq('course_id', courseId)
    if (appsError) throw appsError
    const studentIds = apps!.map(a => a.student_id)

    // 3) Clear old assignments for this course
    await supabaseAdmin
      .from('student_assignments')
      .delete()
      .eq('course_id', courseId)

    // 4) Distribute evenly
    const total = studentIds.length
    const perOfficer = Math.floor(total / officers.length)
    const extra = total % officers.length

    const toInsert: Array<{
      student_id: string
      verification_officer_id: string
      course_id: string
      assigned_at?: string
      assigned_by?: string
    }> = []

    for (let i = 0; i < officers.length; i++) {
      const count = i < extra ? perOfficer + 1 : perOfficer
      const offset = i * perOfficer + Math.min(i, extra)
      const slice = studentIds.slice(offset, offset + count)
      slice.forEach((sid) => {
        toInsert.push({
          student_id: sid,
          verification_officer_id: officers[i].id,
          course_id: courseId,
          assigned_at: new Date().toISOString(),
          assigned_by: 'system'
        })
      })
    }

    // 5) Bulk insert
    if (toInsert.length) {
      const { error: insertError } = await supabaseAdmin
        .from('student_assignments')
        .insert(toInsert)
      if (insertError) throw insertError
    }

    return res
      .status(200)
      .json({ message: `Assigned ${toInsert.length} students to ${officers.length} officers.` })
  } catch (e: any) {
    console.error('API assign-students error:', e)
    return res.status(500).json({ error: e.message || e.toString() })
  }
}