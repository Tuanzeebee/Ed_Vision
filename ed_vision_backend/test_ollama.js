// Test với /no_think suffix để tắt thinking mode của Qwen3
async function testOllama() {
  console.log('Test 1: with /no_think suffix...');
  const start = Date.now();
  
  const body = {
    model: 'qwen3',
    // /no_think trong prompt tắt thinking mode cho Qwen3
    prompt: 'Respond briefly: What is "prior to" in Vietnamese? 1 sentence only. /no_think',
    stream: false,
    options: {
      num_predict: 80,
      temperature: 0.1,
      num_ctx: 1024,
    },
  };

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });

    const elapsed = Date.now() - start;
    const data = await res.json();
    console.log(`Elapsed: ${elapsed}ms, done_reason: ${data.done_reason}`);
    console.log('response:', JSON.stringify(data.response));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testOllama();
