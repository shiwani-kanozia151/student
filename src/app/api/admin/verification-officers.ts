import { supabaseAdmin } from '@/lib/supabase';

export async function getVerificationOfficers(courseId: string) {
  try {
    console.log('Fetching officers for course:', courseId);
    
    const { data: officers, error } = await supabaseAdmin
      .from('verification_admins')
      .select('id, email, course_id, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!officers) {
      console.log('No officers found for course:', courseId);
      return [];
    }

    console.log('Found officers:', officers);

    return officers.map(officer => ({
      id: officer.id,
      name: officer.email,
      email: officer.email
    }));
  } catch (error) {
    console.error('Error fetching verification officers:', error);
    throw error;
  }
} 