/**
 * 时间追踪API测试脚本
 * 测试后端时间追踪API的功能
 */

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5004').replace(/\/$/, '');

// 生成测试会话ID
function generateSessionId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 测试会话开始API
async function testSessionStart() {
    console.log('🧪 测试会话开始API...');
    
    const sessionId = generateSessionId();
    const data = {
        sessionId: sessionId,
        userId: 'test_user_001',
        wordId: 1,
        sessionType: 'learning',
        moduleType: 'entrance',
        startTime: new Date().toISOString(),
        deviceType: 'web'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/learning/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            console.log('✅ 会话开始测试成功:', sessionId);
            return sessionId;
        } else {
            console.log('❌ 会话开始测试失败:', result.error);
            return null;
        }
    } catch (error) {
        console.log('❌ 会话开始API连接失败:', error.message);
        return null;
    }
}

// 测试练习记录API
async function testExerciseRecord(sessionId) {
    console.log('🧪 测试练习记录API...');
    
    const data = {
        sessionId: sessionId,
        questionId: 'test_question_001',
        questionType: 'definition',
        questionContent: 'Test question content',
        userAnswer: 'test_answer',
        correctAnswer: 'test_answer',
        isCorrect: true,
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString(),
        responseTimeSeconds: 5.0,
        hesitationCount: 0,
        attemptCount: 1,
        isFirstAttempt: true
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/learning/exercise/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            console.log('✅ 练习记录测试成功');
            return true;
        } else {
            console.log('❌ 练习记录测试失败:', result.error);
            return false;
        }
    } catch (error) {
        console.log('❌ 练习记录API连接失败:', error.message);
        return false;
    }
}

// 测试会话结束API
async function testSessionEnd(sessionId) {
    console.log('🧪 测试会话结束API...');
    
    const data = {
        sessionId: sessionId,
        endTime: new Date().toISOString(),
        durationSeconds: 30,
        activeTimeSeconds: 25,
        completed: true,
        eventCount: 5
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/learning/session/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            console.log('✅ 会话结束测试成功');
            return true;
        } else {
            console.log('❌ 会话结束测试失败:', result.error);
            return false;
        }
    } catch (error) {
        console.log('❌ 会话结束API连接失败:', error.message);
        return false;
    }
}

// 测试统计信息API
async function testStats() {
    console.log('🧪 测试统计信息API...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ 统计信息测试成功:');
            console.log('   - 总词汇数:', result.data.totalWords);
            console.log('   - 总会话数:', result.data.totalSessions);
            console.log('   - 总练习数:', result.data.totalExercises);
            return true;
        } else {
            console.log('❌ 统计信息测试失败:', result.error);
            return false;
        }
    } catch (error) {
        console.log('❌ 统计信息API连接失败:', error.message);
        return false;
    }
}

// 测试基础API连接
async function testBasicConnection() {
    console.log('🧪 测试基础API连接...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        const result = await response.json();
        
        if (result.message) {
            console.log('✅ API服务器连接成功:', result.message);
            return true;
        } else {
            console.log('❌ API服务器响应异常');
            return false;
        }
    } catch (error) {
        console.log('❌ API服务器连接失败:', error.message);
        console.log('💡 请确保后端服务在', API_BASE_URL, '运行');
        return false;
    }
}

// 运行完整测试套件
async function runAllTests() {
    console.log('🚀 开始时间追踪API测试...');
    console.log('=' * 50);
    
    let passedTests = 0;
    let totalTests = 5;
    
    // 1. 测试基础连接
    if (await testBasicConnection()) {
        passedTests++;
    }
    
    console.log('');
    
    // 2. 测试完整会话流程
    const sessionId = await testSessionStart();
    if (sessionId) {
        passedTests++;
        
        console.log('');
        
        // 3. 测试练习记录
        if (await testExerciseRecord(sessionId)) {
            passedTests++;
        }
        
        console.log('');
        
        // 4. 测试会话结束
        if (await testSessionEnd(sessionId)) {
            passedTests++;
        }
    }
    
    console.log('');
    
    // 5. 测试统计信息
    if (await testStats()) {
        passedTests++;
    }
    
    console.log('');
    console.log('=' * 50);
    console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！时间追踪API工作正常');
    } else {
        console.log('⚠️  部分测试失败，请检查API服务器状态');
    }
    
    return passedTests === totalTests;
}

// 如果作为独立脚本运行
if (typeof window === 'undefined') {
    // Node.js环境
    const fetch = require('node-fetch');
    runAllTests();
} else {
    // 浏览器环境
    window.testTimeTrackingAPI = runAllTests;
    console.log('💡 在浏览器控制台运行: testTimeTrackingAPI()');
}
