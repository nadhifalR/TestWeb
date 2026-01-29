
import { User, UserRole, Permission } from '../types';
import { LogManager } from './LogManager';
import { supabase } from './SupabaseClient';

export class AccountManager {
  static async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username', { ascending: true });

      if (error) {
        console.error('AccountManager: profiles fetch error', error);
        return [];
      }
      return data as User[];
    } catch (err) {
      return [];
    }
  }

  static async getPermissionMatrix(): Promise<Record<UserRole, Permission[]>> {
    const defaultMatrix = {
      [UserRole.ADMIN]: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'SYSTEM_CONFIG', 'FINANCIAL_RECON', 'USER_PROVISION', 'COMMENT'] as Permission[],
      [UserRole.REVIEWER]: ['VIEW', 'APPROVE', 'COMMENT', 'FINANCIAL_RECON'] as Permission[],
      [UserRole.SUPERVISOR]: ['VIEW', 'EDIT', 'COMMENT', 'APPROVE'] as Permission[],
      [UserRole.REQUESTER]: ['VIEW_OWN', 'CREATE', 'EDIT_OWN', 'COMMENT'] as Permission[]
    };

    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'permission_matrix')
        .maybeSingle();

      if (error || !data) return defaultMatrix;
      return data.value;
    } catch (e) {
      return defaultMatrix;
    }
  }

  static async updatePermissionMatrix(matrix: Record<UserRole, Permission[]>) {
    try {
      await supabase
        .from('system_configs')
        .upsert({ key: 'permission_matrix', value: matrix });

      LogManager.addLog('system', 'SECURITY_UPDATE', 'Permission routing matrix updated globally.');
    } catch (e) {
      console.warn('AccountManager: system_configs update failed.');
    }
  }

  static hasPermission(user: User, permission: Permission, resourceOwnerId?: string): boolean {
    if (user.role === UserRole.ADMIN) return true;

    // Hardcoded fallback if matrix load fails
    const userPerms: string[] = user.role === UserRole.REVIEWER ? ['VIEW', 'APPROVE', 'COMMENT', 'FINANCIAL_RECON'] : 
                              user.role === UserRole.SUPERVISOR ? ['VIEW', 'EDIT', 'COMMENT', 'APPROVE'] : 
                              user.role === UserRole.REQUESTER ? ['VIEW_OWN', 'CREATE', 'EDIT_OWN', 'COMMENT'] : [];

    if (userPerms.includes(permission)) return true;

    if (resourceOwnerId && user.id === resourceOwnerId) {
      if (permission === 'VIEW' && userPerms.includes('VIEW_OWN')) return true;
      if (permission === 'EDIT' && userPerms.includes('EDIT_OWN')) return true;
      if (permission === 'DELETE' && (userPerms.includes('EDIT_OWN') || userPerms.includes('DELETE'))) return true;
    }

    return false;
  }

  static async createUser(user: Omit<User, 'id'>): Promise<void> {
    // Generate a unique TEXT id (matching public.profiles id requirement)
    const newId = Math.random().toString(36).substring(2, 15);
    
    const { error } = await supabase
      .from('profiles')
      .insert([{
        id: newId,
        username: user.username,
        email: user.email,
        department: user.department,
        title: user.title,
        role: user.role,
        avatar: user.avatar || `https://picsum.photos/seed/${user.username}/100`
      }]);

    if (error) throw error;
    
    LogManager.addLog('system', 'PROVISION_USER', `Identity node created for ${user.username} (ID: ${newId})`);
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
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
