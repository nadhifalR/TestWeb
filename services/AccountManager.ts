
import { User, UserRole, Permission } from '../types';
import { LogManager } from './LogManager';
import { supabase } from './SupabaseClient';

export class AccountManager {
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .is('deleted_at', null);

    if (error) {
      console.error('Supabase fetch error:', error);
      return [];
    }
    return data as User[];
  }

  static async getPermissionMatrix(): Promise<Record<UserRole, Permission[]>> {
    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'permission_matrix')
        .maybeSingle();

      if (error || !data) {
        return {
          [UserRole.ADMIN]: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'SYSTEM_CONFIG', 'FINANCIAL_RECON', 'USER_PROVISION', 'COMMENT'],
          [UserRole.REVIEWER]: ['VIEW', 'APPROVE', 'COMMENT', 'FINANCIAL_RECON'],
          [UserRole.SUPERVISOR]: ['VIEW', 'EDIT', 'COMMENT', 'APPROVE'],
          [UserRole.REQUESTER]: ['VIEW_OWN', 'CREATE', 'EDIT_OWN', 'COMMENT']
        };
      }
      return data.value;
    } catch (e) {
      return {} as any;
    }
  }

  static async updatePermissionMatrix(matrix: Record<UserRole, Permission[]>) {
    await supabase
      .from('system_configs')
      .upsert({ key: 'permission_matrix', value: matrix });

    LogManager.addLog('system', 'SECURITY_UPDATE', 'Permission routing matrix updated globally.');
  }

  static hasPermission(user: User, permission: Permission, resourceOwnerId?: string): boolean {
    if (user.role === UserRole.ADMIN) return true;

    const hardcodedMatrix: Record<string, string[]> = {
      [UserRole.ADMIN]: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'SYSTEM_CONFIG', 'FINANCIAL_RECON', 'USER_PROVISION', 'COMMENT'],
      [UserRole.REVIEWER]: ['VIEW', 'APPROVE', 'COMMENT', 'FINANCIAL_RECON'],
      [UserRole.SUPERVISOR]: ['VIEW', 'EDIT', 'COMMENT', 'APPROVE'],
      [UserRole.REQUESTER]: ['VIEW_OWN', 'CREATE', 'EDIT_OWN', 'COMMENT']
    };

    const userPerms = hardcodedMatrix[user.role] || [];
    if (userPerms.includes(permission)) return true;

    if (resourceOwnerId && user.id === resourceOwnerId) {
      if (permission === 'VIEW' && userPerms.includes('VIEW_OWN')) return true;
      if (permission === 'EDIT' && userPerms.includes('EDIT_OWN')) return true;
      if (permission === 'DELETE' && (userPerms.includes('EDIT_OWN') || userPerms.includes('DELETE'))) return true;
    }

    return false;
  }

  static async createUser(user: Omit<User, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert([{
        ...user,
        avatar: `https://picsum.photos/seed/${user.username}/100`
      }]);

    if (error) throw error;
    LogManager.addLog('admin', 'PROVISION_USER', `Identity node created for ${user.username}`);
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
}
