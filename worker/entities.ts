import { IndexedEntity } from "./core-utils";
import type { Ingredient, User, Chat, ChatMessage } from "@shared/types";
import { MOCK_INGREDIENTS, MOCK_CHATS, MOCK_USERS, MOCK_CHAT_MESSAGES } from "@shared/mock-data";
export class IngredientEntity extends IndexedEntity<Ingredient> {
  static readonly entityName = "ingredient";
  static readonly indexName = "ingredients";
  static readonly initialState: Ingredient = { 
    id: "", 
    name: "", 
    pricePerUnit: 0, 
    stockQuantity: 0, 
    minimumStock: 0, 
    unit: "g" 
  };
  static seedData = MOCK_INGREDIENTS;
}
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}