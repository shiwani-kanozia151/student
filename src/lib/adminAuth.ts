// This is a mock admin authentication service - replace with actual implementation

type AdminRole = "super" | "content" | "verification";

interface AdminUser {
  email: string;
  role: AdminRole;
  name: string;
  password: string;
}

// In production, this would be in a secure database
const adminUsers: AdminUser[] = [
  {
    email: "admin@nitt.edu",
    role: "super",
    name: "Super Admin",
    password: "admin123",
  },
  {
    email: "content@nitt.edu",
    role: "content",
    name: "Content Manager",
    password: "content123",
  },
  {
    email: "verify@nitt.edu",
    role: "verification",
    name: "Verification Officer",
    password: "verify123",
  },
];

export const validateAdminCredentials = (
  email: string,
  password: string,
): AdminUser | null => {
  const user = adminUsers.find((u) => u.email === email);
  if (!user) return null;

  if (password === user.password) {
    return user;
  }
  return null;
};

export const isAuthorized = (
  email: string,
  requiredRole: AdminRole,
): boolean => {
  const user = adminUsers.find((u) => u.email === email);
  if (!user) return false;

  if (user.role === "super") return true;
  return user.role === requiredRole;
};
