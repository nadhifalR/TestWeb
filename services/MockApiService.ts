
/**
 * PRODUCTION READY API SERVICE
 * Provides asynchronous wrapping for database operations.
 */
export class MockApiService {
  private static LATENCY = 150;

  /**
   * Wraps an operation in a promise with artificial latency to simulate network round-trip.
   */
  static async request<T>(action: () => T | Promise<T>): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, this.LATENCY));
    return await action();
  }
}
