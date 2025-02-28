import { supabase } from "./supabase";

// Function to set up real-time subscription for content updates
export const subscribeToContentUpdates = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel("content-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "content",
      },
      (payload) => {
        console.log("Content update received:", payload);
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Function to set up real-time subscription for student status updates
export const subscribeToStudentStatusUpdates = (
  studentId: string,
  callback: (payload: any) => void,
) => {
  const subscription = supabase
    .channel(`student-${studentId}-status`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "students",
        filter: `id=eq.${studentId}`,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Function to set up real-time subscription for application status updates
export const subscribeToApplicationUpdates = (
  studentId: string,
  callback: (payload: any) => void,
) => {
  const subscription = supabase
    .channel(`application-${studentId}-updates`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "applications",
        filter: `student_id=eq.${studentId}`,
      },
      (payload) => {
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
