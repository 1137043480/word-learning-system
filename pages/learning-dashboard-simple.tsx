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
  recommendationId?: string;
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
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
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
        const moduleRoutes: Record<string, string> = {
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl relative min-h-[844px] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-sm">加载学习数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl relative min-h-[844px] flex flex-col items-center justify-center px-6">
          <div className="glass-card w-full p-6 text-center rounded-2xl border border-red-200 bg-red-50/50">
            <p className="text-red-600 mb-4 font-medium">❌ {error}</p>
            <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20"
            >
                重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl relative min-h-[844px] flex flex-col items-center justify-center px-6">
          <div className="glass-card w-full p-6 text-center rounded-2xl border border-indigo-100 bg-white/60">
            <p className="text-indigo-950 font-medium mb-4">没有找到学习数据</p>
            <Button 
                onClick={() => router.push('/')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20"
            >
                回到首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans">
      <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden relative min-h-[844px] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-12 pb-6 border-b border-white/30 bg-white/20">
          <h1 className="text-xl font-bold flex items-center justify-between text-indigo-950">
            <span>📊 分析简报</span>
            <div className="flex bg-white/50 p-1 rounded-lg border border-white/60">
                <button
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${timeRange === 'week' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white/40'}`}
                onClick={() => setTimeRange('week')}
                >本周</button>
                <button
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${timeRange === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white/40'}`}
                onClick={() => setTimeRange('month')}
                >本月</button>
                <button
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${timeRange === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white/40'}`}
                onClick={() => setTimeRange('all')}
                >全部</button>
            </div>
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-24">
          
          {/* 智能推荐卡片 */}
          {recommendation && (
            <div className="glass-card p-5 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    {recommendation.priority === 'high' ? '高优先级' : recommendation.priority === 'medium' ? '推荐' : '可选'}
                </div>
                <h3 className="font-bold text-amber-950 flex items-center mb-1 mt-1 text-lg">
                    🧠 智能推荐: {getModuleIcon(recommendation.recommended_module)} {recommendation.word || '继续学习'}
                </h3>
                <p className="text-sm text-amber-800/80 mb-3">{recommendation.reason}</p>
                
                <div className="flex items-center space-x-3 mb-4 text-[11px] text-amber-700 font-medium">
                    <span className="bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200/50">
                        ⏱️ 预计 {Math.round(recommendation.estimated_time / 60)} 分钟
                    </span>
                    <span className="bg-amber-100/80 px-2 py-1 rounded-md border border-amber-200/50">
                        🎯 置信度 {(recommendation.confidence * 100).toFixed(0)}%
                    </span>
                </div>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => handleAcceptRecommendation(false)}
                        className="flex-1 bg-white/60 border-amber-200 hover:bg-white text-amber-700 h-9 text-xs rounded-xl"
                    >忽略</Button>
                    <Button
                        onClick={() => handleAcceptRecommendation(true)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 h-9 text-xs rounded-xl"
                    >开始学习</Button>
                </div>
            </div>
          )}

          {/* 当前学习上下文 */}
          <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-indigo-950 text-sm">📍 当前上下文</h3>
            </div>
            <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">最近词汇</span>
                    <span className="font-medium text-indigo-900">{learningSession.word ?? '尚未选择'}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">最近模块</span>
                    <span className="font-medium text-indigo-900">{resumeModuleLabel(learningSession.module) ?? '未记录'}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">VKS 评级</span>
                    <span className="font-medium text-indigo-900">{learningSession.vksLevel ?? '未记录'}</span>
                </div>
            </div>
            <Button
                size="sm"
                disabled={!resumeModulePath}
                onClick={() => {
                  if (resumeModulePath) {
                    router.push(resumeModulePath);
                  }
                }}
                className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 shadow-none border border-indigo-200 h-8 text-xs rounded-xl"
            >继续当前学习</Button>
          </div>

          {/* 学习概览 Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40 flex flex-col items-center justify-center text-center">
                <div className="text-2xl mb-1">📚</div>
                <div className="text-xl font-bold text-indigo-950">{dashboardData.overview.totalSessions}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-1">会话总数</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40 flex flex-col items-center justify-center text-center">
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-xl font-bold text-indigo-950">{formatTime(dashboardData.overview.totalStudyTime)}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-1">总学时</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40 flex flex-col items-center justify-center text-center">
                <div className="text-2xl mb-1">📈</div>
                <div className="text-xl font-bold text-indigo-950">{formatTime(dashboardData.overview.averageSessionTime)}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-1">均会话时长</div>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40 flex flex-col items-center justify-center text-center">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-xl font-bold text-indigo-950">{formatAccuracy(dashboardData.overview.completionRate)}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-1">完成率</div>
            </div>
          </div>

          {/* 复习计划 */}
          <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40">
            <h3 className="font-bold text-indigo-950 text-sm mb-3">🔄 待复习</h3>
            {dueReviews.length > 0 ? (
              <div className="space-y-2">
                {dueReviews.slice(0, 3).map((review) => (
                  <div key={review.word_id} className="flex flex-col p-2.5 bg-white/50 border border-white/80 rounded-xl cursor-pointer hover:bg-white/70 transition-colors" onClick={() => router.push('/today-review')}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-100/50 px-1.5 py-0.5 rounded">{getModuleIcon(review.recommended_module)}</span>
                          <p className="font-bold text-sm text-indigo-950">{review.word}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${review.days_overdue > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {review.days_overdue > 0 ? `逾期 ${review.days_overdue} 天` : '今日待复习'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-indigo-100/50 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${review.mastery_level * 100}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium w-6 text-right">{(review.mastery_level * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
                {dueReviews.length > 3 && (
                  <Button variant="ghost" className="w-full text-xs text-indigo-600 mt-2 h-8" onClick={() => router.push('/today-review')}>
                    查看其余 {dueReviews.length - 3} 个待复习词汇 →
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/30 rounded-xl border border-white/50">
                <div className="text-3xl mb-1">📅</div>
                <p className="text-sm font-medium text-emerald-700">暂无待复习内容</p>
                <p className="text-xs text-emerald-600/70">您已经完成所有复习任务！</p>
              </div>
            )}
          </div>

          {/* 掌握度分布 */}
          <div className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40">
            <h3 className="font-bold text-indigo-950 text-sm mb-4">掌握分布</h3>
            <div className="space-y-4">
              <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>已掌握 (≥80%)
                    </span>
                    <span className="text-xs font-bold text-indigo-900">{dashboardData.masteryDistribution.mastered}</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden border border-white/60">
                      <div className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${(dashboardData.masteryDistribution.mastered / dashboardData.masteryDistribution.total) * 100 || 0}%` }}></div>
                  </div>
              </div>
              
              <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>学习中 (60-80%)
                    </span>
                    <span className="text-xs font-bold text-indigo-900">{dashboardData.masteryDistribution.learning}</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden border border-white/60">
                      <div className="bg-amber-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" style={{ width: `${(dashboardData.masteryDistribution.learning / dashboardData.masteryDistribution.total) * 100 || 0}%` }}></div>
                  </div>
              </div>
              
              <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>需加强 (&lt;60%)
                    </span>
                    <span className="text-xs font-bold text-indigo-900">{dashboardData.masteryDistribution.struggling}</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden border border-white/60">
                      <div className="bg-rose-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.5)]" style={{ width: `${(dashboardData.masteryDistribution.struggling / dashboardData.masteryDistribution.total) * 100 || 0}%` }}></div>
                  </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/40 backdrop-blur-xl border-t border-white/50">
          <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="flex-[0.8] bg-white/60 border-white/80 hover:bg-white text-gray-700 rounded-xl shadow-sm text-xs font-semibold h-10"
            >首 页</Button>
            <Button 
                variant="outline" 
                onClick={() => router.push('/phase2-demo')}
                className="flex-[0.8] bg-white/60 border-white/80 hover:bg-white text-indigo-600 rounded-xl shadow-sm text-xs font-semibold h-10"
            >演 示</Button>
            <Button 
                onClick={() => router.push('/word-learning-entrance')}
                className="flex-[1.5] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 text-xs font-semibold h-10"
            >开始学习</Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LearningDashboardSimple;
