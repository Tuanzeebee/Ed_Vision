// Debug script to understand IRT calculation
const { 
  estimateTheta, 
  thetaToBand, 
  getFullEstimate,
  icc,
  itemInformation
} = require('./dist/placement/irt.engine');

console.log('🔍 DEBUG: IRT Calculation\n');

// Simulate a test sequence
const responses = [];

// Q1: Band 5-6 question (irt_b ≈ -0.82), answered CORRECT
responses.push({
  correct: true,
  params: { a: 1.4, b: -0.82, c: 0.25 }
});

console.log('After Q1 (correct, b=-0.82):');
let estimate = getFullEstimate(responses, 0);
console.log(`  Theta: ${estimate.theta.toFixed(3)}, Band: ${estimate.band}, SEM: ${estimate.sem.toFixed(3)}\n`);

// Q2: Band 5.5-6.5 question (irt_b ≈ -0.27), answered CORRECT
responses.push({
  correct: true,
  params: { a: 1.5, b: -0.27, c: 0.25 }
});

console.log('After Q2 (correct, b=-0.27):');
estimate = getFullEstimate(responses, estimate.theta);
console.log(`  Theta: ${estimate.theta.toFixed(3)}, Band: ${estimate.band}, SEM: ${estimate.sem.toFixed(3)}\n`);

// Q3: Band 7-8.5 question (irt_b ≈ 1.91), answered INCORRECT
responses.push({
  correct: false,
  params: { a: 2.0, b: 1.91, c: 0.25 }
});

console.log('After Q3 (incorrect, b=1.91):');
estimate = getFullEstimate(responses, estimate.theta);
console.log(`  Theta: ${estimate.theta.toFixed(3)}, Band: ${estimate.band}, SEM: ${estimate.sem.toFixed(3)}\n`);

// Show probability of correct answer at different theta levels
console.log('📊 Probability Analysis for Q3 (a=2.0, b=1.91, c=0.25):');
for (let theta = -2; theta <= 3; theta += 0.5) {
  const prob = icc(theta, { a: 2.0, b: 1.91, c: 0.25 });
  const band = thetaToBand(theta);
  const info = itemInformation(theta, { a: 2.0, b: 1.91, c: 0.25 });
  console.log(`  Theta=${theta.toFixed(1)} (Band ${band}): P(correct)=${(prob*100).toFixed(1)}%, Info=${info.toFixed(2)}`);
}

console.log('\n✅ Debug complete');
