/**
 * 简化版学习分析Dashboard
 * 展示用户学习数据、进度分析和个性化推荐
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buildApiUrl, fetchRecentSessions } from "@/src/lib/apiClient";
import { useLearningContext } from "@/src/context/LearningContext";
import { useLearningSession } from '@/src/context/LearningSessionContext';

interface DashboardData {
  overview: {
    totalSessions: number;
    totalStudyTime: number;
    averageSessionTime: number;
    completionRate: number;
  };
  masteryDistribution: {
    mastered: number;
    learning: number;
    struggling: number;
    total: number;
  };
  accuracyByType: Array<{
    questionType: string;
    accuracy: number;
    totalAttempts: number;
  }>;
  dailyProgress: Array<{
    date: string;
    studyTime: number;
    sessions: number;
  }>;
}

interface Recommendation {
  type: string;
  priority: string;
  word: string;
  reason: string;
  recommended_module: string;
  confidence: number;
  estimated_time: number;
}

interface DueReview {
  word_id: number;
  word: string;
  mastery_level: number;
  days_overdue: number;
  priority_score: number;
  recommended_module: string;
}

const LearningDashboardSimple: React.FC = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [error, setError] = useState<string | null>(null);

  const { userId } = useLearningContext();
  const { session: learningSession } = useLearningSession();

  const moduleRouteMap: Record<string, string> = {
    character: '/character-learning',
    word: '/word-learning',
    word_learning: '/word-learning',
    collocation: '/collocation-learning',
    collocation_learning: '/collocation-learning',
    sentence: '/sentence-learning',
    sentence_learning: '/sentence-learning',
    exercise: '/exercise',
    review: '/exercise',
    urgent_review: '/exercise',
    scheduled_review: '/exercise'
  };

  const resumeModuleLabel = useCallback((module?: string | null) => {
    if (!module) return null;
    switch (module.toLowerCase()) {
      case 'character': return '字学习';
      case 'word':
      case 'word_learning': return '词学习';
      case 'collocation':
      case 'collocation_learning': return '搭配学习';
      case 'sentence':
      case 'sentence_learning': return '例句学习';
      case 'exercise': return '练习';
      case 'review': return '复习';
      case 'urgent_review': return '紧急复习';
      case 'scheduled_review': return '计划复习';
      default: return module;
    }
  }, []);

  const resumeModulePath = learningSession.module ? moduleRouteMap[learningSession.module.toLowerCase()] || null : null;

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/analytics/user/${userId}/dashboard?range=${timeRange}`));
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to connect to server');
    }
  }, [timeRange, userId]);

  const fetchRecommendation = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/adaptive/recommendation/${userId}`));
      const result = await response.json();
      
      if (result.success) {
        setRecommendation(result.data);
      } else {
        setRecommendation(null);
      }
    } catch (err) {
      console.error('Recommendation fetch error:', err);
    }
  }, [userId]);

  const fetchDueReviews = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/review/user/${userId}/due?limit=5`));
      const result = await response.json();
      
      if (result.success) {
        setDueReviews(result.data);
      } else {
        setDueReviews([]);
      }
    } catch (err) {
      console.error('Due reviews fetch error:', err);
    }
  }, [userId]);

  const fetchRecentSessionsData = useCallback(async () => {
    try {
      const sessions = await fetchRecentSessions(userId, { limit: 5 });
      setRecentSessions(sessions);
    } catch (err) {
      console.error('Recent sessions fetch error:', err);
      setRecentSessions([]);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDashboardData(null);
    setRecommendation(null);
    setDueReviews([]);

    const run = async () => {
      await Promise.all([
        fetchDashboardData(),
        fetchRecommendation(),
        fetchDueReviews(),
        fetchRecentSessionsData()
      ]);
      if (!cancelled) {
        setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchDashboardData, fetchRecommendation, fetchDueReviews, fetchRecentSessionsData]);

  const handleAcceptRecommendation = async (accepted: boolean) => {
    if (!recommendation) return;

    try {
      await fetch(buildApiUrl('/api/adaptive/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recommendation.recommendationId,
          userId: userId,
          accepted: accepted,
          actualChoice: accepted ? recommendation.recommended_module : 'declined'
        })
      });

      if (accepted) {
        // 跳转到推荐的学习模块
        const moduleRoutes = {
          'character': '/character-learning',
          'word': '/word-learning',
          'collocation': '/collocation-learning',
          'sentence': '/sentence-learning',
          'exercise': '/exercise'
        };
        
        const route = moduleRoutes[recommendation.recommended_module] || '/word-learning';
        router.push(route);
      } else {
        // 获取新的推荐
        fetchRecommendation();
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatAccuracy = (accuracy: number) => {
    return `${(accuracy * 100).toFixed(1)}%`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'character': return '字';
      case 'word': return '词';
      case 'collocation': return '配';
      case 'sentence': return '句';
      case 'exercise': return '练';
      default: return '学';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载学习数据中...</p>
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

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">没有找到学习数据</p>
          <Button onClick={() => router.push('/')} className="mt-4">回到首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 学习分析Dashboard</h1>
            <p className="text-gray-600 mt-1">个性化学习数据分析和智能推荐</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              本周
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              本月
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('all')}
            >
              全部
            </Button>
          </div>
        </div>

        {/* 当前学习上下文 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">当前学习上下文</CardTitle>
            <CardDescription className="text-xs text-blue-600">来源于最近的学习流程与本地会话记录</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-1">
            <p>用户：{userId}</p>
            <p>最近词汇：{learningSession.word ?? '尚未选择'}</p>
            <p>最近模块：{resumeModuleLabel(learningSession.module) ?? '未记录'}</p>
            <p>VKS 选择：{learningSession.vksLevel ?? '未记录'}</p>
            <p>更新时间：{learningSession.lastUpdated ? new Date(learningSession.lastUpdated).toLocaleString() : '—'}</p>
            <div className="pt-2">
              <Button
                size="sm"
                disabled={!resumeModulePath}
                onClick={() => {
                  if (resumeModulePath) {
                    router.push(resumeModulePath);
                  }
                }}
              >
                继续学习
              </Button>
            </div>
          </CardContent>
        </Card>

        {recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>最近学习会话</CardTitle>
              <CardDescription>最近 5 次学习活动概览</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentSessions.map(session => (
                <div key={session.sessionId} className="flex justify-between items-center border border-gray-100 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.word ?? '未知词汇'} · {resumeModuleLabel(session.moduleType)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.startTime ? new Date(session.startTime).toLocaleString() : '时间未知'}
                      {typeof session.durationSeconds === 'number' && session.durationSeconds > 0 && (
                        <span> · 时长 {Math.round(session.durationSeconds)} 秒</span>
                      )}
                    </p>
                  </div>
                  {session.moduleType && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const moduleKey = session.moduleType?.toLowerCase();
                        const path = moduleKey ? moduleRouteMap[moduleKey] : null;
                        if (path) {
                          router.push(path);
                        }
                      }}
                    >
                      打开
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 智能推荐卡片 */}
        {recommendation && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                🧠 智能推荐
                <Badge variant={getPriorityColor(recommendation.priority)} className="ml-2">
                  {recommendation.priority}
                </Badge>
              </CardTitle>
              <CardDescription>
                基于您的学习表现，AI为您推荐最适合的学习内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center">
                      <span className="mr-2">{getModuleIcon(recommendation.recommended_module)}</span>
                      {recommendation.word ? `学习词汇: ${recommendation.word}` : '继续学习'}
                    </h3>
                    <p className="text-gray-600 mt-1">{recommendation.reason}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        ⏰ 预计 {Math.round(recommendation.estimated_time / 60)} 分钟
                      </span>
                      <span className="flex items-center">
                        🎯 置信度 {(recommendation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAcceptRecommendation(false)}
                    >
                      下次再说
                    </Button>
                    <Button
                      onClick={() => handleAcceptRecommendation(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      开始学习 →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 学习概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-4">📚</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">学习会话</p>
                  <p className="text-2xl font-bold">{dashboardData.overview.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-4">⏰</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">总学习时间</p>
                  <p className="text-2xl font-bold">{formatTime(dashboardData.overview.totalStudyTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-4">📈</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">平均会话</p>
                  <p className="text-2xl font-bold">{formatTime(dashboardData.overview.averageSessionTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-4">🏆</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">完成率</p>
                  <p className="text-2xl font-bold">{formatAccuracy(dashboardData.overview.completionRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 掌握程度分布 */}
        <Card>
          <CardHeader>
            <CardTitle>词汇掌握程度分布</CardTitle>
            <CardDescription>您对不同词汇的掌握情况统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  已掌握 (≥80%)
                </span>
                <span className="font-semibold">{dashboardData.masteryDistribution.mastered}</span>
              </div>
              <Progress value={(dashboardData.masteryDistribution.mastered / dashboardData.masteryDistribution.total) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  学习中 (60-80%)
                </span>
                <span className="font-semibold">{dashboardData.masteryDistribution.learning}</span>
              </div>
              <Progress value={(dashboardData.masteryDistribution.learning / dashboardData.masteryDistribution.total) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  需要加强 (&lt;60%)
                </span>
                <span className="font-semibold">{dashboardData.masteryDistribution.struggling}</span>
              </div>
              <Progress value={(dashboardData.masteryDistribution.struggling / dashboardData.masteryDistribution.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 复习计划 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🔄 复习计划
            </CardTitle>
            <CardDescription>基于遗忘曲线的智能复习安排</CardDescription>
          </CardHeader>
          <CardContent>
            {dueReviews.length > 0 ? (
              <div className="space-y-3">
                {dueReviews.slice(0, 3).map((review) => (
                  <div key={review.word_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">{getModuleIcon(review.recommended_module)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{review.word}</p>
                        <p className="text-sm text-gray-500">
                          掌握度: {(review.mastery_level * 100).toFixed(0)}%
                          {review.days_overdue > 0 && (
                            <span className="text-red-500 ml-2">逾期 {review.days_overdue} 天</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={review.days_overdue > 0 ? 'destructive' : 'secondary'}>
                      复习
                    </Badge>
                  </div>
                ))}
                {dueReviews.length > 3 && (
                  <p className="text-center text-gray-500 text-sm">
                    还有 {dueReviews.length - 3} 个词汇待复习
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500">暂无待复习内容</p>
                <p className="text-sm text-gray-400">继续学习来建立复习计划</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 题型准确率 */}
        <Card>
          <CardHeader>
            <CardTitle>各题型准确率</CardTitle>
            <CardDescription>不同练习题型的正确率统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.accuracyByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 text-sm font-medium">{item.questionType}</div>
                    <div className="flex-1 mx-4">
                      <Progress value={item.accuracy * 100} className="h-2" />
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatAccuracy(item.accuracy)} ({item.totalAttempts}次)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 底部操作区域 */}
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

export default LearningDashboardSimple;
