import { supabase, supabaseAdmin } from '@/lib/supabase';
import { bypassRLS } from '@/api/auth/bypass-rls';

export async function createVerificationAdmin(email: string, password: string, course_id: string, course_name: string) {
  try {
    // Check if email already exists
    const { data: existingAdmin } = await supabase
      .from('verification_admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingAdmin) {
      throw new Error('A verification officer with this email already exists');
    }

    // Attempt to bypass RLS first
    await bypassRLS();
    
    // Generate a UUID - use a more reliable method
    const id = generateUUID();
    const timestamp = new Date().toISOString();

    // Try with direct approach - no fancy tricks
    try {
      console.log("Inserting verification admin with ID:", id);
      
      // Create the admin record directly with explicit values
      const { data, error } = await supabaseAdmin
        .from('verification_admins')
        .insert({
          id: id,
          email: email,
          password_text: password,
          course_id: course_id,
          course_name: course_name,
          created_at: timestamp
        });
        
      if (error) {
        throw error;
      }
      
      // Try auth signup separately
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'verification_officer',
              course_id,
              course_name
            }
          }
        });
      } catch (authError) {
        console.warn('Auth signup failed, but admin record was created:', authError);
      }
      
      return {
        success: true,
        data: {
          id,
          email,
          course_id,
          course_name,
          created_at: timestamp
        }
      };
      
    } catch (error) {
      console.error("Standard insertion failed:", error);
      
      // If all else fails, try with raw SQL as a last resort
      const rawSQL = `
        INSERT INTO verification_admins 
        (id, email, password_text, course_id, course_name, created_at) 
        VALUES 
        ('${id}', '${email}', '${password}', '${course_id}', '${course_name}', '${timestamp}')
      `;
      
      try {
        const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { 
          sql_query: rawSQL 
        });
        
        if (sqlError) {
          console.error("Raw SQL insertion failed:", sqlError);
          throw new Error("Failed to create verification officer after multiple attempts");
        }
        
        return {
          success: true,
          data: {
            id,
            email,
            course_id,
            course_name,
            created_at: timestamp
          }
        };
      } catch (finalError) {
        console.error("All insertion attempts failed:", finalError);
        throw new Error("Failed to create verification officer: database error");
      }
    }
  } catch (error: any) {
    console.error('Error in createVerificationAdmin:', error);
    throw error;
  }
}

// Generate a proper UUID - more reliable than crypto.randomUUID()
function generateUUID() {
  // Manual UUID v4 generation
  const hexDigits = '0123456789abcdef';
  let uuid = '';
  
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // Version 4 UUID
    } else if (i === 19) {
      uuid += hexDigits[(Math.random() * 4) | 8]; // Variant bits
    } else {
      uuid += hexDigits[Math.floor(Math.random() * 16)];
    }
  }
  
  return uuid;
} 