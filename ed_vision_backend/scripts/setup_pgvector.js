const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log('✅ pgvector extension enabled');

    await client.query(`ALTER TABLE "RagChunk" ADD COLUMN IF NOT EXISTS embedding vector(768)`);
    console.log('✅ embedding column added to RagChunk');

    // HNSW index for cosine similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS rag_chunk_embedding_hnsw
        ON "RagChunk" USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    `);
    console.log('✅ HNSW index created');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await client.end();
  }
}

main();
