const { PrismaClient } = require('@prisma/client');
const { MongoDBAdapter } = require('@prisma/adapter-mongodb');

const prisma = new PrismaClient({
  adapter: new MongoDBAdapter({
    url: process.env.DATABASE_URL,
  }),
  log: ['error', 'warn'],
});

module.exports = prisma;
