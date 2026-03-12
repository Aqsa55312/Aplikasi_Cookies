import { IndexedEntity } from "./core-utils";
import type { Ingredient, User, Chat, ChatMessage, Recipe } from "@shared/types";
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
export class RecipeEntity extends IndexedEntity<Recipe> {
  static readonly entityName = "recipe";
  static readonly indexName = "recipes";
  static readonly initialState: Recipe = {
    id: "",
    name: "",
    ingredients: [],
    yieldCount: 1,
    laborCost: 0,
    packagingCost: 0,
    markupPercentage: 30
  };
  static seedData: Recipe[] = [
    {
      id: "r1",
      name: "Dubai Pistachio Kunafa Cookie",
      ingredients: [
        { ingredientId: "i1", quantity: 50 }, // 50g Pistachio
        { ingredientId: "i2", quantity: 30 }, // 30g Butter
        { ingredientId: "i4", quantity: 100 }, // 100g Flour
        { ingredientId: "i5", quantity: 40 }, // 40g Kunafa
      ],
      yieldCount: 10,
      laborCost: 50000,
      packagingCost: 15000,
      markupPercentage: 50
    }
  ];
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