
import { RequestItem } from '../types';

export class RequestItemManager {
  static calculateTotal(items: RequestItem[]): number {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  static createNewItem(): RequestItem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      quantity: 1,
      unit: 'Pcs',
      price: 0,
      total: 0
    };
  }

  static validateItem(item: RequestItem): boolean {
    return item.name.length > 0 && item.quantity > 0 && item.price >= 0;
  }
}
