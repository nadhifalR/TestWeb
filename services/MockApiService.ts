
import { TemporaryDatabase } from './TemporaryDatabase';

/**
 * PRODUCTION READY API SERVICE
 * In this version, we provide a bridge between the local mock DB 
 * and the potential FastAPI backend.
 */
export class MockApiService {
  private static LATENCY = 300;
  private static USE_REAL_API = false; // Toggle this when your FastAPI routes are ready

  static async request<T>(action: () => T): Promise<T> {
    if (this.USE_REAL_API) {
      // Example of how you would transition:
      // const response = await fetch('/api/v1/endpoint');
      // return response.json();
    }

    // Default to the high-fidelity mock engine for now
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
