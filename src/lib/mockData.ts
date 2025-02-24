export interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  documents?: {
    type: string;
    url: string;
  }[];
}

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    department: "Computer Science",
    status: "pending",
    created_at: new Date().toISOString(),
    documents: [
      { type: "ID", url: "#" },
      { type: "Transcript", url: "#" },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    department: "Electronics",
    status: "approved",
    created_at: new Date().toISOString(),
    documents: [
      { type: "ID", url: "#" },
      { type: "Transcript", url: "#" },
    ],
  },
];
