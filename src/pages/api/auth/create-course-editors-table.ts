import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if admin token is provided (you should implement proper auth)
    const { adminToken } = req.headers;
    if (adminToken !== process.env.ADMIN_SECRET_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create the course_editors table
    const { error } = await supabase.rpc('create_course_editors_table', {});

    if (error && !error.message.includes('already exists')) {
      throw error;
    }

    // If no error or "already exists" error, consider it a success
    return res.status(200).json({ 
      success: true, 
      message: error?.message.includes('already exists') 
        ? 'Table already exists' 
        : 'Table created successfully' 
    });
  } catch (error) {
    console.error('Error creating course_editors table:', error);
    return res.status(500).json({ 
      error: 'Failed to create course_editors table',
      details: error.message 
    });
  }
} 