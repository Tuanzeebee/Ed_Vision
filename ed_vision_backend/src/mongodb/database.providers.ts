import * as mongooseNS from 'mongoose';
const mongoose = mongooseNS.default || mongooseNS;

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async () => {
      const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ed_vision';

      return mongoose.connect(uri, {
        auth: {
          username: process.env.MONGO_USER || undefined,
          password: process.env.MONGO_PASS || undefined,
        },
      });
    },
  },
];
