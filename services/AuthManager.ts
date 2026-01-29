
import { User, UserRole } from '../types';

export class AuthManager {
  private static STORAGE_KEY = 'nexus_auth_user';

  static login(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static getCurrentUser(): User | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  static checkAuth(): boolean {
    return !!this.getCurrentUser();
  }

  static getDummyAccounts(): User[] {
    return [
      {
        id: '1',
        username: 'admin_nexus',
        email: 'admin@nexus.com',
        department: 'Operations',
        title: 'System Administrator',
        role: UserRole.ADMIN,
        avatar: 'https://picsum.photos/seed/admin/100'
      },
      {
        id: '2',
        username: 'jane_reviewer',
        email: 'jane@nexus.com',
        department: 'Finance',
        title: 'Financial Controller',
        role: UserRole.REVIEWER,
        avatar: 'https://picsum.photos/seed/jane/100'
      },
      {
        id: '3',
        username: 'bob_requester',
        email: 'bob@nexus.com',
        department: 'Marketing',
        title: 'Brand Manager',
        role: UserRole.REQUESTER,
        avatar: 'https://picsum.photos/seed/bob/100'
      },
      {
        id: '4',
        username: 'alice_supervisor',
        email: 'alice@nexus.com',
        department: 'Logistics',
        title: 'Operations Supervisor',
        role: UserRole.SUPERVISOR,
        avatar: 'https://picsum.photos/seed/alice/100'
      }
    ];
  }
}
