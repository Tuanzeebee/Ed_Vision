import { Connection } from 'mongoose';
import { MessageSchema, ConversationSchema } from './schemas/message.schema';

export const messageProviders = [
  {
    provide: 'MESSAGE_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Message', MessageSchema),
    inject: ['DATABASE_CONNECTION'],
  },
  {
    provide: 'CONVERSATION_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Conversation', ConversationSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
