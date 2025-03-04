import { supabase } from "./supabase";

// Function to set up real-time subscription for content updates
export const subscribeToContentUpdates = (callback: (payload: any) => void) => {
  // Subscribe to content table changes with a unique channel name
  const contentSubscription = supabase
    .channel(`content-changes-${Math.random().toString(36).substring(2, 9)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "content",
      },
      (payload) => {
        console.log("Content update received:", payload);
        // Force callback to run even if the payload looks the same
        // Use a longer timeout to ensure the database has fully processed the change
        setTimeout(() => {
          console.log("Executing callback for content update");
          callback({
            ...payload,
            table: "content",
          });
        }, 300);
      },
    )
    .subscribe();

  // Subscribe to courses table changes with a unique channel name
  const coursesSubscription = supabase
    .channel(`courses-changes-${Math.random().toString(36).substring(2, 9)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "courses",
      },
      (payload) => {
        console.log("Courses update received:", payload);
        callback({
          ...payload,
          table: "courses",
        });
      },
    )
    .subscribe();

  return () => {
    contentSubscription.unsubscribe();
    coursesSubscription.unsubscribe();
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
