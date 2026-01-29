
import { RequestItem } from '../types';

export interface FormSchema {
  fields: string[];
  defaultValues: Record<string, any>;
  presets: Partial<RequestItem>[];
}

export class RequestFormManager {
  static getSchemaByCategory(category: string): FormSchema {
    const commonFields = ['name', 'eventDate', 'budgetSource', 'cashAdvance'];
    
    const schemas: Record<string, FormSchema> = {
      'Brand': {
        fields: [...commonFields, 'brandGuidelines', 'campaignTag'],
        defaultValues: {
          budgetSource: 'Corporate Brand Fund',
          cashAdvance: 0,
        },
        presets: [
          { name: 'Billboard Printing', quantity: 1, price: 5000000, unit: 'Pcs' },
          { name: 'Social Media Ad Spend', quantity: 1, price: 10000000, unit: 'Campaign' }
        ]
      },
      'Production': {
        fields: [...commonFields, 'factoryId', 'supervisorCode'],
        defaultValues: {
          budgetSource: 'Operational Expense',
          cashAdvance: 5000000,
        },
        presets: [
          { name: 'Raw Material Alpha', quantity: 100, price: 15000, unit: 'Kg' },
          { name: 'Packaging Units', quantity: 500, price: 2000, unit: 'Units' }
        ]
      },
      'Activation': {
        fields: [...commonFields, 'locationName', 'permitStatus'],
        defaultValues: {
          budgetSource: 'Activation Budget',
          cashAdvance: 2000000,
        },
        presets: [
          { name: 'Event Crew (Daily)', quantity: 5, price: 350000, unit: 'Pax' },
          { name: 'Sound System Rental', quantity: 1, price: 2500000, unit: 'Day' }
        ]
      },
      'Logistics': {
        fields: [...commonFields, 'routePath', 'carrierId'],
        defaultValues: {
          budgetSource: 'Operations Budget',
          cashAdvance: 10000000,
        },
        presets: [
          { name: 'Fuel Allocation', quantity: 1, price: 15000000, unit: 'Batch' },
          { name: 'Driver Overtime', quantity: 10, price: 200000, unit: 'Man/Day' }
        ]
      },
      'Entertainment': {
        fields: [...commonFields, 'venueId', 'talentRoster'],
        defaultValues: {
          budgetSource: 'Engagement Fund',
          cashAdvance: 5000000,
        },
        presets: [
          { name: 'Talent Fee (Deposit)', quantity: 1, price: 25000000, unit: 'Contract' },
          { name: 'Venue Insurance', quantity: 1, price: 5000000, unit: 'Policy' }
        ]
      }
    };

    return schemas[category] || { 
      fields: commonFields, 
      defaultValues: { budgetSource: 'General Fund', cashAdvance: 0 }, 
      presets: [] 
    };
  }
}
