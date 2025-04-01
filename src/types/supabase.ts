// src/types/supabase.ts
// Remove the import and just declare the Database interface directly

export interface Database {
    public: {
      Tables: {
        applications: {
          Row: {
            id: string;
            created_at: string;
            updated_at: string;
            student_id: string;
            course_id: string;
            personal_details: {
              firstName: string;
              middleName: string;
              lastName: string;
              sex: string;
              age: string;
              contactNumber: string;
              parentContactNumber: string;
              fatherName: string;
              motherName: string;
              fatherOccupation: string;
              motherOccupation: string;
            };
            academic_details: {
              tenthSchool: string;
              tenthPercentage: string;
              tenthBoard: string;
              twelfthSchool: string;
              twelfthPercentage: string;
              twelfthBoard: string;
              entranceExam: string;
              entranceScore: string;
              entranceRank: string;
              graduationSchool?: string;
              graduationPercentage?: string;
              graduationDegree?: string;
            };
            documents: Array<{
              type: string;
              url: string;
            }>;
            remarks: string | null;
            status: 'pending' | 'approved' | 'rejected';
            payment_status: boolean;
          };
          Insert: {
            id?: string;
            created_at?: string;
            updated_at?: string;
            student_id: string;
            course_id: string;
            personal_details: {
              firstName: string;
              middleName: string;
              lastName: string;
              sex: string;
              age: string;
              contactNumber: string;
              parentContactNumber: string;
              fatherName: string;
              motherName: string;
              fatherOccupation: string;
              motherOccupation: string;
            };
            academic_details: {
              tenthSchool: string;
              tenthPercentage: string;
              tenthBoard: string;
              twelfthSchool: string;
              twelfthPercentage: string;
              twelfthBoard: string;
              entranceExam: string;
              entranceScore: string;
              entranceRank: string;
              graduationSchool?: string;
              graduationPercentage?: string;
              graduationDegree?: string;
            };
            documents: Array<{
              type: string;
              url: string;
            }>;
            remarks?: string | null;
            status?: 'pending' | 'approved' | 'rejected';
            payment_status?: boolean;
          };
          Update: {
            id?: string;
            updated_at?: string;
            status?: 'pending' | 'approved' | 'rejected';
            payment_status?: boolean;
            remarks?: string | null;
          };
        };
        students: {
          Row: {
            id: string;
            created_at: string;
            name: string;
            email: string;
            department: string;
          };
        };
      };
    };
  }
  
  // Helper types
  export type Application = Database['public']['Tables']['applications']['Row'];
  export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
  export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];
  export type Student = Database['public']['Tables']['students']['Row'];
  export type ApplicationDocument = {
    type: string;
    url: string;
  };