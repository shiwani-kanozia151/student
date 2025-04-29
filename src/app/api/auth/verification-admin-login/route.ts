import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function POST(request: NextRequest) {
  try {
    // Extract data from request body
    const { email, password, course_id } = await request.json();

    // Validate required fields
    if (!email || !password || !course_id) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, course_id)' },
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
    
    // Get the admin from the database
    const { data: admin, error } = await supabase
      .from('verification_admins')
      .select('*')
      .eq('email', email)
      .eq('course_id', course_id)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const [salt, storedHash] = admin.password_hash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    if (storedHash !== hash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login time
    await supabase
      .from('verification_admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Create and sign a JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'verification_admin_secret_key_change_me_in_production'
    );
    
    const token = await new jose.SignJWT({ 
      id: admin.id,
      email: admin.email,
      course_id: admin.course_id,
      role: 'verification_admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Set the cookie in the response
    const response = NextResponse.json({
      id: admin.id,
      email: admin.email,
      course_id: admin.course_id,
      course_name: admin.course_name
    });

    response.cookies.set('verification_admin_token', token, {
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return response;
    
  } catch (error: any) {
    console.error('Error during verification admin login:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
} 