const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function directTest() {
  console.log('🧪 DIRECT TEST: IRT Placement Service\n');
  
  try {
    // Import the compiled service
    const { 
      startPlacementTest, 
      submitAnswer, 
      getPlacementResult 
    } = require('./dist/placement/adaptive.service');
    
    // Step 0: Clear old sessions
    console.log('📦 Step 0: Clearing old sessions for accountId=1...');
    await prisma.ieltsPlacementSession.updateMany({
      where: { accountId: 1, status: 'in_progress' },
      data: { status: 'abandoned', completedAt: new Date() },
    });
    console.log('✅ Old sessions cleared\n');
    
    // Step 1: Start test
    console.log('📦 Step 1: Starting placement test...');
    const startResult = await startPlacementTest({
      accountId: 1,
      skillsToTest: ['reading', 'listening', 'writing', 'speaking'],
    });
    
    const { sessionId, firstQuestion } = startResult;
    console.log(`✅ Session started: ${sessionId}`);
    console.log(`   First question: ${firstQuestion.questionText.substring(0, 60)}...`);
    console.log(`   Type: ${firstQuestion.questionType}`);
    console.log(`   Progress: ${firstQuestion.progress.current}/${firstQuestion.progress.total}\n`);
    
    // Step 2: Answer questions
    let currentQuestion = firstQuestion;
  let questionCount = 1;
  const maxQuestions = 20;
    const answers = [];
    
  while (currentQuestion && questionCount <= maxQuestions) {
      console.log(`📝 Step 2.${questionCount}: Answering question ${questionCount}...`);
      
      // Get the actual correct answer from DB
      const questionData = await prisma.ieltsQuestion.findUnique({
        where: { id: currentQuestion.id },
      });
      
      // Simulate: 70% correct, 30% wrong
      const shouldBeCorrect = Math.random() > 0.3;
      let userAnswer;
      
      if (currentQuestion.questionType === 'mcq') {
        if (shouldBeCorrect) {
          userAnswer = questionData.correctAnswer;
        } else {
          // Pick a wrong answer
          const options = currentQuestion.options || [];
          const wrongOptions = options.filter(opt => opt !== questionData.correctAnswer);
          userAnswer = wrongOptions[0] || 'Wrong';
        }
      } else {
        userAnswer = shouldBeCorrect ? questionData.correctAnswer : 'wrong_answer';
      }
      
      const answerResult = await submitAnswer({
        sessionId,
        questionId: currentQuestion.id,
        userAnswer,
        timeTakenSec: Math.floor(Math.random() * 30) + 20,
      });
      
      answers.push({
        question: questionCount,
        correct: answerResult.isCorrect,
        band: answerResult.currentBand,
      });
      
      console.log(`   ${answerResult.isCorrect ? '✅' : '❌'} Answer: ${answerResult.isCorrect ? 'Correct' : 'Incorrect'}`);
      console.log(`   Current Band: ${answerResult.currentBand}`);
  console.log(`   Progress: ${answerResult.progress.current}/${answerResult.progress.total}`);
  console.log(`   Actual Total: ${answerResult.actualTotal}`);
      
      if (answerResult.nextQuestion) {
        console.log(`   Next: ${answerResult.nextQuestion.questionText.substring(0, 60)}...\n`);
        currentQuestion = answerResult.nextQuestion;
        questionCount++;
      } else {
        console.log('   ✅ Test completed (early stop or max questions)!\n');
        break;
      }
    }
    
    // Step 3: Get result
    console.log('📊 Step 3: Getting final result...');
    const result = await getPlacementResult(sessionId);
    
    console.log('\n🎉 FINAL RESULT:');
    console.log(`   Final Band: ${result.finalBand}`);
    console.log(`   Confidence: ${result.confidenceLevel}`);
    console.log(`   SEM (Standard Error): ${result.sem.toFixed(3)}`);
    console.log(`   Skill Bands:`);
    for (const [skill, band] of Object.entries(result.skillBands)) {
      console.log(`     - ${skill}: ${band}`);
    }
    
    console.log('\n📈 Answer History:');
    const correctCount = answers.filter(a => a.correct).length;
    console.log(`   Total: ${answers.length} questions`);
    console.log(`   Correct: ${correctCount} (${Math.round(correctCount/answers.length*100)}%)`);
    console.log(`   Band progression:`);
    answers.forEach(a => {
      console.log(`     Q${a.question}: ${a.correct ? '✅' : '❌'} → Band ${a.band}`);
    });
    
    console.log('\n✅ DIRECT TEST PASSED!\n');
    
  } catch (error) {
    console.error('\n❌ DIRECT TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

directTest();
