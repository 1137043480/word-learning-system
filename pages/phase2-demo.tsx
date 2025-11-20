/**
 * 第二阶段功能演示页面
 * 展示自适应推荐、学习分析和复习调度功能
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { buildApiUrl } from "@/src/lib/apiClient";

interface ApiTestResult {
  endpoint: string;
  method: string;
  success: boolean;
  responseTime: number;
  data?: any;
  error?: string;
}

const Phase2Demo: React.FC = () => {
  const router = useRouter();
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const testUserId = 'test_user_001';

  const apiTests = [
    {
      name: '系统统计',
      endpoint: '/api/stats',
      method: 'GET',
      description: '获取系统整体统计信息'
    },
    {
      name: '个性化推荐',
      endpoint: `/api/adaptive/recommendation/${testUserId}`,
      method: 'GET',
      description: '获取AI个性化学习推荐'
    },
    {
      name: '到期复习',
      endpoint: `/api/review/user/${testUserId}/due`,
      method: 'GET',
      description: '获取基于遗忘曲线的复习计划'
    },
    {
      name: '学习Dashboard',
      endpoint: `/api/analytics/user/${testUserId}/dashboard`,
      method: 'GET',
      description: '获取学习数据分析和可视化数据'
    },
    {
      name: '详细进度',
      endpoint: `/api/analytics/user/${testUserId}/progress`,
      method: 'GET',
      description: '获取用户详细学习进度'
    }
  ];

  const runApiTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    for (let i = 0; i < apiTests.length; i++) {
      const test = apiTests[i];
      const startTime = Date.now();

      try {
        const response = await fetch(buildApiUrl(test.endpoint));
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok) {
          const data = await response.json();
          setTestResults(prev => [...prev, {
            endpoint: test.endpoint,
            method: test.method,
            success: true,
            responseTime,
            data
          }]);
        } else {
          setTestResults(prev => [...prev, {
            endpoint: test.endpoint,
            method: test.method,
            success: false,
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`
          }]);
        }
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        setTestResults(prev => [...prev, {
          endpoint: test.endpoint,
          method: test.method,
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : String(error)
        }]);
      }

      setProgress(((i + 1) / apiTests.length) * 100);
      
      // 添加小延迟以便观察进度
      if (i < apiTests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsRunning(false);
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-500">成功</Badge>
    ) : (
      <Badge variant="destructive">失败</Badge>
    );
  };

  const formatResponseTime = (ms: number) => {
    return `${ms}ms`;
  };

  const navigateToFeature = (feature: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/learning-stats',
      'time-tracking': '/time-tracking-demo',
      'learning': '/word-learning-entrance',
      'exercise': '/exercise'
    };
    
    router.push(routes[feature] || '/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 页面标题 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🚀 第二阶段：自适应学习系统演示
            </CardTitle>
            <CardDescription>
              展示智能推荐引擎、学习分析Dashboard和间隔重复算法的完整功能
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 功能概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('dashboard')}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold">学习分析Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">数据可视化和学习洞察</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('time-tracking')}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <h3 className="font-semibold">时间追踪系统</h3>
              <p className="text-sm text-gray-600 mt-1">精确的学习行为记录</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('learning')}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold">智能推荐</h3>
              <p className="text-sm text-gray-600 mt-1">个性化学习路径推荐</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToFeature('exercise')}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-semibold">间隔重复</h3>
              <p className="text-sm text-gray-600 mt-1">科学的复习时间调度</p>
            </CardContent>
          </Card>
        </div>

        {/* API测试区域 */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 API功能测试</CardTitle>
            <CardDescription>
              测试第二阶段的自适应学习API接口功能和响应性能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* 测试控制 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">API接口测试</h3>
                  <p className="text-sm text-gray-600">测试 {apiTests.length} 个第二阶段核心API接口</p>
                </div>
                <Button 
                  onClick={runApiTests} 
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isRunning ? '测试中...' : '开始测试'}
                </Button>
              </div>

              {/* 进度条 */}
              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>测试进度</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* 测试结果 */}
              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">测试结果</h4>
                  <div className="grid gap-3">
                    {testResults.map((result, index) => {
                      const test = apiTests[index];
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{result.method}</Badge>
                              <span className="font-medium">{test.name}</span>
                              {getStatusBadge(result.success)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatResponseTime(result.responseTime)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {result.method} {result.endpoint}
                          </code>
                          
                          {result.success && result.data && (
                            <details className="mt-2">
                              <summary className="text-sm cursor-pointer text-blue-600">查看响应数据</summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                          
                          {!result.success && result.error && (
                            <Alert className="mt-2">
                              <AlertDescription className="text-sm">
                                ❌ {result.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 技术特性展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 自适应算法特性 */}
          <Card>
            <CardHeader>
              <CardTitle>🧠 自适应算法特性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">VKS测试适配</h4>
                    <p className="text-sm text-gray-600">基于用户词汇知识量表选择最适合的学习起点</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">学习模式识别</h4>
                    <p className="text-sm text-gray-600">分析学习效率、准确率和偏好，提供个性化推荐</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">错误模式分析</h4>
                    <p className="text-sm text-gray-600">识别薄弱环节，针对性推荐复习内容</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">间隔重复算法</h4>
                    <p className="text-sm text-gray-600">基于艾宾浩斯遗忘曲线的科学复习调度</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据分析特性 */}
          <Card>
            <CardHeader>
              <CardTitle>📈 数据分析特性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">实时学习追踪</h4>
                    <p className="text-sm text-gray-600">毫秒级精确记录学习时间和行为数据</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">多维度可视化</h4>
                    <p className="text-sm text-gray-600">掌握程度热力图、学习趋势图表和进度分析</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">学习效率评估</h4>
                    <p className="text-sm text-gray-600">基于时间和效果的多因子学习效率模型</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">预测性分析</h4>
                    <p className="text-sm text-gray-600">预测学习完成时间和掌握程度趋势</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 系统架构说明 */}
        <Card>
          <CardHeader>
            <CardTitle>🏗️ 第二阶段系统架构</CardTitle>
            <CardDescription>
              完整的自适应学习系统技术栈和组件说明
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div>
                <h4 className="font-semibold mb-3 text-blue-600">🎨 前端组件</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 学习分析Dashboard</li>
                  <li>• 时间追踪Hooks</li>
                  <li>• 智能推荐界面</li>
                  <li>• 数据可视化图表</li>
                  <li>• 响应式设计</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-green-600">⚙️ 后端算法</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 自适应推荐引擎</li>
                  <li>• 间隔重复算法 (SRS)</li>
                  <li>• 学习模式识别</li>
                  <li>• 个性化路径优化</li>
                  <li>• 数据分析API</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-purple-600">💾 数据基础</h4>
                <ul className="space-y-1 text-sm">
                  <li>• 扩展数据库模型</li>
                  <li>• 用户学习档案</li>
                  <li>• 详细行为事件</li>
                  <li>• 进度追踪记录</li>
                  <li>• 推荐反馈数据</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 底部导航 */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            返回首页
          </Button>
          <Button variant="outline" onClick={() => router.push('/learning-stats')}>
            查看Dashboard
          </Button>
          <Button onClick={() => router.push('/word-learning-entrance')}>
            开始自适应学习
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Phase2Demo;
