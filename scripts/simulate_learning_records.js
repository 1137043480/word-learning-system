#!/usr/bin/env node
/**
 * Quick helper script to simulate learning sessions so that the
 * adaptive recommendation engine has recent data to work with.
 *
 * Usage:
 *   node simulate_learning_records.js [userId] [wordId]
 *
 * Assumes the second phase API is running locally on port 5004.
 */

const DEFAULT_API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004').replace(/\/$/, '');
const DEFAULT_USER_ID = process.argv[2] || 'user123';
const DEFAULT_WORD_ID = Number.parseInt(process.argv[3] || '1', 10);

const moduleSequence = ['entrance', 'character', 'word', 'collocation', 'sentence', 'exercise'];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const apiRequest = async (path, options = {}) => {
  const url = `${DEFAULT_API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
};

const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const simulateSession = async (userId, wordId, moduleType, index) => {
  const sessionId = `${userId}_${wordId}_${moduleType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = new Date(Date.now() - randomInt(60, 300) * 1000).toISOString();

  await apiRequest('/api/learning/session/start', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      userId,
      wordId,
      sessionType: moduleType === 'exercise' ? 'exercise' : 'learning',
      moduleType,
      startTime,
      deviceType: 'simulation'
    })
  });

  // Simulate a couple of exercises for learning-focused modules
  const exerciseCount = moduleType === 'exercise' ? 3 : 1;

  for (let i = 0; i < exerciseCount; i += 1) {
    const questionId = `${moduleType}_q${index}_${i}`;
    const responseTime = randomFloat(3, 12);

    await apiRequest('/api/learning/exercise/record', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        questionId,
        questionType: moduleType === 'exercise' ? 'fill_word' : 'definition',
        questionContent: `Simulated question for ${moduleType} #${i + 1}`,
        userAnswer: 'simulated_answer',
        correctAnswer: 'simulated_answer',
        isCorrect: Math.random() > 0.2,
        confidenceLevel: randomInt(3, 5),
        startTime: new Date(Date.now() - responseTime * 1000).toISOString(),
        endTime: new Date().toISOString(),
        responseTimeSeconds: responseTime,
        hesitationCount: randomInt(0, 1)
      })
    });

    await delay(100);
  }

  await apiRequest('/api/learning/session/end', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      endTime: new Date().toISOString(),
      durationSeconds: randomInt(120, 480),
      activeTimeSeconds: randomInt(90, 420),
      completed: true,
      eventCount: exerciseCount + 2
    })
  });

  console.log(`✅ Simulated ${moduleType} session with id ${sessionId}`);
};

const run = async () => {
  console.log(`🚀 Simulating learning records for user=${DEFAULT_USER_ID}, wordId=${DEFAULT_WORD_ID}`);
  for (let i = 0; i < moduleSequence.length; i += 1) {
    const moduleType = moduleSequence[i];
    try {
      await simulateSession(DEFAULT_USER_ID, DEFAULT_WORD_ID, moduleType, i + 1);
    } catch (error) {
      console.error(`❌ Failed to simulate ${moduleType} session:`, error.message);
    }
    await delay(200);
  }

  console.log('📊 Simulation complete. You can now request a recommendation to see updated behaviour.');
};

run();
