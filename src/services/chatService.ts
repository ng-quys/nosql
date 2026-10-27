import { ApiService } from './api';

export type ChatRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

export class ChatService {
  static async send(message: string, history: ChatMessage[]): Promise<string> {
    const response = await ApiService.post<{ reply: string }>('/chat', {
      message,
      history: history.slice(-8).map(({ role, text }) => ({ role, text })),
    });
    return response.data.reply;
  }
}
