const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/placement-test';

async function smokeTest() {
  console.log('🧪 SMOKE TEST: IRT Placement Test\n');
  
  try {
    // Step 0: Clear old sessions
    console.log('📦 Step 0: Clearing old sessions for accountId=1...');
    await prisma.ieltsPlacementSession.updateMany({
      where: { accountId: 1, status: 'in_progress' },
      data: { status: 'abandoned', completedAt: new Date() },
    });
    console.log('✅ Old sessions cleared\n');
    
    // Step 1: Start test
    console.log('📦 Step 1: Starting placement test...');
    const startRes = await axios.post(`${BASE_URL}/start`, {
      accountId: 1,
      skillsToTest: ['vocabulary', 'reading'],
    });
    
    const { sessionId, firstQuestion } = startRes.data;
    console.log(`✅ Session started: ${sessionId}`);
    console.log(`   First question: ${firstQuestion.questionText.substring(0, 60)}...`);
    console.log(`   Progress: ${firstQuestion.progress.current}/${firstQuestion.progress.total}\n`);
    
    // Step 2: Answer questions
    let currentQuestion = firstQuestion;
    let questionCount = 1;
    
    while (currentQuestion) {
      console.log(`📝 Step 2.${questionCount}: Answering question ${questionCount}...`);
      
      // Simulate answer (randomly correct/incorrect for testing)
      const isCorrectAnswer = Math.random() > 0.3; // 70% correct rate
      let userAnswer;
      
      if (currentQuestion.questionType === 'mcq') {
        const options = currentQuestion.options;
        if (Array.isArray(options) && options.length > 0) {
          userAnswer = isCorrectAnswer ? options[0] : (options[1] || options[0]);
        } else {
          userAnswer = 'A';
        }
      } else {
        userAnswer = isCorrectAnswer ? 'correct' : 'wrong';
      }
      
      const answerRes = await axios.post(`${BASE_URL}/answer`, {
        sessionId,
        questionId: currentQuestion.id,
        userAnswer,
        timeTakenSec: Math.floor(Math.random() * 30) + 20, // 20-50 seconds
      });
      
      const { isCorrect, nextQuestion, progress, currentBand } = answerRes.data;
      
      console.log(`   ${isCorrect ? '✅' : '❌'} Answer: ${isCorrect ? 'Correct' : 'Incorrect'}`);
      console.log(`   Current Band: ${currentBand}`);
      console.log(`   Progress: ${progress.current}/${progress.total}`);
      
      if (nextQuestion) {
        console.log(`   Next: ${nextQuestion.questionText.substring(0, 60)}...\n`);
        currentQuestion = nextQuestion;
        questionCount++;
      } else {
        console.log('   ✅ Test completed!\n');
        currentQuestion = null;
      }
    }
    
    // Step 3: Get result
    console.log('📊 Step 3: Getting final result...');
    const resultRes = await axios.get(`${BASE_URL}/result/${sessionId}`);
    const result = resultRes.data;
    
    console.log('\n🎉 FINAL RESULT:');
    console.log(`   Final Band: ${result.finalBand}`);
    console.log(`   Confidence: ${result.confidenceLevel}`);
    console.log(`   SEM (Standard Error): ${result.sem.toFixed(3)}`);
    console.log(`   Skill Bands:`);
    for (const [skill, band] of Object.entries(result.skillBands)) {
      console.log(`     - ${skill}: ${band}`);
    }
    
    console.log('\n✅ SMOKE TEST PASSED!\n');
    
  } catch (error) {
    console.error('\n❌ SMOKE TEST FAILED:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

smokeTest();
