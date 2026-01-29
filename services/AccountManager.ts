
import { User, UserRole, Permission } from '../types';
import { AuthManager } from './AuthManager';
import { LogManager } from './LogManager';
import { TemporaryDatabase } from './TemporaryDatabase';
import { MockApiService } from './MockApiService';

export class AccountManager {
  private static USERS_KEY = 'nexus_users';

  static async getUsers(): Promise<User[]> {
    return MockApiService.request(() => {
      const data = localStorage.getItem(this.USERS_KEY);
      if (!data) {
        const initial = AuthManager.getDummyAccounts();
        this.saveUsers(initial);
        return initial;
      }
      const users = JSON.parse(data);
      return users.filter((u: any) => !u.deletedAt);
    });
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  static getPermissionMatrix(): Record<UserRole, Permission[]> {
    const db = TemporaryDatabase.getDB();
    if (db.permissionMatrix) return db.permissionMatrix;

    const initial: Record<UserRole, Permission[]> = {
      [UserRole.ADMIN]: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'SYSTEM_CONFIG', 'FINANCIAL_RECON', 'USER_PROVISION', 'COMMENT'],
      [UserRole.REVIEWER]: ['VIEW', 'APPROVE', 'COMMENT', 'FINANCIAL_RECON'],
      [UserRole.SUPERVISOR]: ['VIEW', 'EDIT', 'COMMENT', 'APPROVE'],
      [UserRole.REQUESTER]: ['VIEW_OWN', 'CREATE', 'EDIT_OWN', 'COMMENT']
    };
    this.updatePermissionMatrix(initial);
    return initial;
  }

  static updatePermissionMatrix(matrix: Record<UserRole, Permission[]>) {
    const db = TemporaryDatabase.getDB();
    db.permissionMatrix = matrix;
    TemporaryDatabase.saveDB(db);
    LogManager.addLog('system', 'SECURITY_UPDATE', 'Permission routing matrix updated globally.');
  }

  static hasPermission(user: User, permission: Permission, resourceOwnerId?: string): boolean {
    if (user.role === UserRole.ADMIN) return true;

    const matrix = this.getPermissionMatrix();
    const userPerms = matrix[user.role] || [];

    if (userPerms.includes(permission)) return true;

    if (resourceOwnerId && user.id === resourceOwnerId) {
      if (permission === 'VIEW' && userPerms.includes('VIEW_OWN')) return true;
      if (permission === 'EDIT' && userPerms.includes('EDIT_OWN')) return true;
      if (permission === 'DELETE' && (userPerms.includes('EDIT_OWN') || userPerms.includes('DELETE'))) return true;
    }

    return false;
  }

  static async createUser(user: Omit<User, 'id'>): Promise<void> {
    const users = await this.getUsers();
    const newUser = { 
      ...user, 
      id: Date.now().toString(),
      avatar: `https://picsum.photos/seed/${user.username}/100`
    };
    this.saveUsers([...users, newUser]);
    LogManager.addLog('admin', 'PROVISION_USER', `Identity node created for ${user.username}`);
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const users = (await this.getUsers()).map(u => u.id === id ? { ...u, ...updates } : u);
    this.saveUsers(users);
  }

  static async deleteUser(id: string): Promise<void> {
    const users = (await this.getUsers()).map(u => u.id === id ? { ...u, deletedAt: new Date().toISOString() } : u);
    this.saveUsers(users);
  }
}
