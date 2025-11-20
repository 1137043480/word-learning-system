import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildApiUrl } from "@/src/lib/apiClient";

const LearningStats = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/stats'));
      const result = await response.json();
      
      if (response.ok) {
        setStats(result.data);
      } else {
        setError('API服务未运行');
      }
    } catch (err) {
      setError('无法连接到API服务');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 学习统计</h1>
          <p className="text-gray-600">系统学习数据概览</p>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-2xl font-bold">{stats.totalSessions}</div>
                  <div className="text-sm text-gray-600">总学习会话</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">✏️</div>
                  <div className="text-2xl font-bold">{stats.totalExercises}</div>
                  <div className="text-sm text-gray-600">练习题目</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <div className="text-2xl font-bold">{(stats.averageMastery * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">平均掌握度</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-2xl font-bold">{stats.averageEfficiency.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">学习效率</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🧠 智能引擎状态</span>
                  <div className="flex space-x-2">
                    <Badge variant={stats.adaptiveEngine ? "default" : "secondary"}>
                      {stats.adaptiveEngine ? "✅ 推荐引擎" : "❌ 推荐引擎"}
                    </Badge>
                    <Badge variant={stats.spacedRepetition ? "default" : "secondary"}>
                      {stats.spacedRepetition ? "✅ 间隔重复" : "❌ 间隔重复"}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">📊 数据统计</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>近期会话:</span>
                        <span className="font-medium">{stats.recentSessions}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>进度记录:</span>
                        <span className="font-medium">{stats.progressRecords}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>平均掌握度:</span>
                        <span className="font-medium">{(stats.averageMastery * 100).toFixed(1)}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>学习效率:</span>
                        <span className="font-medium">{stats.averageEfficiency.toFixed(2)}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">🎯 系统功能</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${stats.adaptiveEngine ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>自适应推荐引擎</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${stats.spacedRepetition ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span>间隔重复算法</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>学习数据分析</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>实时追踪系统</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 使用建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🎯 开始学习</h4>
                    <p className="text-sm text-blue-700">
                      点击"开始自适应学习"体验VKS测试引导的个性化学习路径
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">📊 查看分析</h4>
                    <p className="text-sm text-green-700">
                      访问"第二阶段功能演示"了解智能推荐和数据分析功能
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/')}>
            返回首页
          </Button>
          <Button variant="outline" onClick={() => router.push('/phase2-demo')}>
            功能演示
          </Button>
          <Button onClick={() => router.push('/word-learning-entrance')}>
            开始学习
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LearningStats;
