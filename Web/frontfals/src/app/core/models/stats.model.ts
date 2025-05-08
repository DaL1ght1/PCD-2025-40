export interface SystemStats {
  alerts: Alert[];
  lastLogin: string;
  systemStatus: string;
  admin: string;
  statistics: {
    usersByRole: Record<string, number>;
    totalUsers: number;
    recentRegistrations: UserRegistration[];
    activeUsers: number;
  };
}

export interface Alert {
  type: string;
  message: string;
  timestamp: string;
}

export interface UserRegistration {
  role: string;
  name: string;
  registeredAt: string;
  id: string;
  email: string;
}
