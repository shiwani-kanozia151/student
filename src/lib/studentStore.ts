import { create } from "zustand";
import { Student, mockStudents } from "./mockData";

type StudentStore = {
  students: Student[];
  addStudent: (student: Student) => void;
  updateStudentStatus: (
    id: string,
    status: "pending" | "approved" | "rejected",
  ) => void;
};

export const useStudentStore = create<StudentStore>((set) => ({
  students: mockStudents,
  addStudent: (student) =>
    set((state) => ({
      students: [...state.students, student],
    })),
  updateStudentStatus: (id, status) =>
    set((state) => ({
      students: state.students.map((student) =>
        student.id === id ? { ...student, status } : student,
      ),
    })),
}));
