const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('📦 Reading migration file...');
    const sqlPath = path.join(__dirname, 'step1_irt_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove comments and split properly
    const lines = sql.split('\n');
    let currentStatement = '';
    const statements = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment-only lines
      if (trimmed.startsWith('--') || trimmed.length === 0) {
        continue;
      }
      
      currentStatement += ' ' + line;
      
      // Check if statement ends with semicolon
      if (trimmed.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.toUpperCase().includes('SELECT')) {
        // This is the verification query
        console.log('✅ Running verification query...');
        const result = await prisma.$queryRawUnsafe(stmt);
        console.log('\n📊 Verification Results:');
        console.table(result);
      } else {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(stmt);
        console.log(`✅ Statement ${i + 1} completed`);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
