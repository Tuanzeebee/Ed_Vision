const fs = require('fs');
const path = require('path');

async function testSpeaking() {
  const sessionId = 'd6254fef-94dd-44db-acaf-95938e85534c';
  const questionId = '71a94521-d7c2-4813-a987-d3757599c308';
  const audioFile = path.join(__dirname, 'uploads', 'audio', 'passages', '3a944e79-3ef3-460a-81bc-eaf3c22d2d1f.mp3');
  
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('questionId', questionId);
  formData.append('speakingPrompt', 'Tell me about the area where you grew up.');
  formData.append('timeTakenSec', '30');
  
  const blob = new Blob([fs.readFileSync(audioFile)], { type: 'audio/webm' });
  formData.append('audio', blob, 'test.webm');

  try {
    const res = await fetch('http://127.0.0.1:3000/placement/speaking-submit', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

testSpeaking();
