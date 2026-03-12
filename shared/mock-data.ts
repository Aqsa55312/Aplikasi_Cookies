import type { Ingredient, User, Chat, ChatMessage } from './types';
export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Pistachio Paste (Premium)', pricePerUnit: 450000, stockQuantity: 500, minimumStock: 1000, unit: 'g' },
  { id: 'i2', name: 'Anchor Unsalted Butter', pricePerUnit: 120000, stockQuantity: 2500, minimumStock: 5000, unit: 'g' },
  { id: 'i3', name: 'Callebaut Dark Chocolate 54%', pricePerUnit: 350000, stockQuantity: 3000, minimumStock: 2000, unit: 'g' },
  { id: 'i4', name: 'All-Purpose Flour', pricePerUnit: 18000, stockQuantity: 10000, minimumStock: 5000, unit: 'g' },
  { id: 'i5', name: 'Kunafa Dough', pricePerUnit: 85000, stockQuantity: 800, minimumStock: 1500, unit: 'g' },
  { id: 'i6', name: 'Organic Eggs', pricePerUnit: 3500, stockQuantity: 30, minimumStock: 24, unit: 'unit' },
  { id: 'i7', name: 'Brown Sugar', pricePerUnit: 22000, stockQuantity: 4000, minimumStock: 2000, unit: 'g' }
];
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Chef Baker' },
  { id: 'u2', name: 'Admin' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'Inventory Alerts' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Stock is arriving today.', ts: Date.now() },
];