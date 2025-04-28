export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  authUserId?: string;
  createdAt: Date;
}

export interface UserProfile extends User {
  totalExpenses: number;
  expenseCount: number;
  tripCount: number;
  activeTrips: number;
}