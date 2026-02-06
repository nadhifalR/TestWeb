
/**
 * DEPRECATED: TemporaryDatabase
 * All state management has been migrated to Supabase Cloud Database.
 * This file is kept for architectural reference during transition.
 */
export class TemporaryDatabase {
  static getDB() { return {}; }
  static saveDB() { }
  static performSelect() { return []; }
  static performInsert() { return []; }
  static performUpdate() { return {}; }
}
