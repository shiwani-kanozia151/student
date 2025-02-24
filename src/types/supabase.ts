export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string;
          department: string;
          status: "pending" | "approved" | "rejected";
          documents: Json[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          name: string;
          department: string;
          status?: "pending" | "approved" | "rejected";
          documents?: Json[];
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          name?: string;
          department?: string;
          status?: "pending" | "approved" | "rejected";
          documents?: Json[];
        };
      };
      courses: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          type: "btech" | "mtech" | "phd";
          description: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          type: "btech" | "mtech" | "phd";
          description: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          type?: "btech" | "mtech" | "phd";
          description?: string;
        };
      };
      content: {
        Row: {
          id: string;
          created_at: string;
          type: "about" | "news" | "academic";
          title: string;
          content: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          type: "about" | "news" | "academic";
          title: string;
          content: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          type?: "about" | "news" | "academic";
          title?: string;
          content?: Json;
        };
      };
    };
  };
}
