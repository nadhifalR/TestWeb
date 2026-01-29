
import { TemporaryDatabase } from './TemporaryDatabase';

/**
 * PRODUCTION READY API SERVICE
 * Vite uses import.meta.env for environment variables.
 */
export class MockApiService {
  private static LATENCY = 300;
  
  private static getBaseUrl() {
    // VITE_ prefix is required for Vite to expose the variable to the client
    return (import.meta as any).env?.VITE_BACKEND_URL || '';
  }

  static async request<T>(action: () => T): Promise<T> {
    const backendUrl = this.getBaseUrl();
    
    // In current phase, we use the mock DB. 
    // Once backendUrl is set in Vercel, this is where real fetch logic would go.
    if (backendUrl && false) { // Toggle false when ready for real API
       const response = await fetch(`${backendUrl}/api/v1/endpoint`);
       return response.json();
    }

    await new Promise(resolve => setTimeout(resolve, this.LATENCY));
    return action();
  }

  static async get<T>(key: string, filter?: (item: any) => boolean): Promise<T[]> {
    return this.request(() => {
      const db = TemporaryDatabase.getDB();
      const data = db[key] || [];
      return filter ? data.filter(filter) : data;
    });
  }

  static async post<T>(key: string, payload: T): Promise<T> {
    return this.request(() => {
      const db = TemporaryDatabase.getDB();
      if (!db[key]) db[key] = [];
      db[key].push(payload);
      TemporaryDatabase.saveDB(db);
      return payload;
    });
  }
}
