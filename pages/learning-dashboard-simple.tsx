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
      <div className="min-h-screen bg-[#F5F5F9] flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-[390px] mx-auto bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative min-h-[844px] flex flex-col items-center justify-center border-[8px] border-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B4BFF] mb-4"></div>
          <p className="text-gray-500 font-medium">加载数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F9] flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-[390px] mx-auto bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative min-h-[844px] flex flex-col items-center justify-center px-6 border-[8px] border-black">
          <div className="w-full p-6 text-center rounded-3xl bg-red-50">
            <p className="text-red-500 mb-4 font-medium">❌ {error}</p>
            <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-[#6B4BFF] hover:bg-[#5A3EE0] text-white rounded-2xl shadow-lg shadow-[#6B4BFF]/20 font-bold"
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
      <div className="min-h-screen bg-[#F5F5F9] flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-[390px] mx-auto bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative min-h-[844px] flex flex-col items-center justify-center px-6 border-[8px] border-black">
          <div className="w-full p-6 text-center rounded-3xl bg-[#F8F9FA]">
            <p className="text-[#1C1D24] font-medium mb-4">没有找到学习数据</p>
            <Button 
                onClick={() => router.push('/')}
                className="w-full bg-[#6B4BFF] hover:bg-[#5A3EE0] text-white rounded-2xl shadow-lg shadow-[#6B4BFF]/20 font-bold"
            >
                回到首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F9] flex flex-col font-sans items-center py-8">
      <div className="w-full max-w-[390px] mx-auto bg-[#FBFBFF] rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative min-h-[844px] flex flex-col border-[8px] border-black">
        
        {/* iOS Status Bar Mock */}
        <div className="h-12 flex items-center justify-between px-6 pt-2 select-none relative z-10">
          <div className="text-[14px] font-semibold text-gray-800 tracking-tight">6:00</div>
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-b-[20px]"></div>
          <div className="flex items-center space-x-1.5 opacity-80">
            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2z"/></svg>
            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm0-10h2v8h-2z"/></svg>
            <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 22 1.34-21.4 1.34-20.67V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
          </div>
        </div>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-[#6B4BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h1 className="text-2xl font-bold text-[#1C1D24] tracking-tight">学习Dashboard</h1>
          </div>
          <p className="text-[13px] text-gray-500 font-medium">账号: {userId || 'test_user_001'}</p>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-5">
          
          {/* 智能推荐 Card */}
          {recommendation ? (
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                {/* Header inside card */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#6B4BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-[#1C1D24] text-[15px]">智能推荐</h3>
                    </div>
                    <div className="bg-gradient-to-r from-[#FF8B4B] to-[#FF6B2C] text-white text-[12px] font-bold px-3 py-1 rounded-full shadow-sm">
                        {recommendation.priority === 'high' ? '高优先级' : recommendation.priority === 'medium' ? '中优先级' : '低优先级'}
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[#FFD700] text-sm">✨</span>
                        <span className="text-[#6B4BFF] text-[13px] font-bold">新词学习</span>
                    </div>
                    <h2 className="text-[32px] font-bold text-[#1C1D24] leading-tight mb-4">
                        {recommendation.word || '发生'}
                    </h2>

                    <div className="bg-[#FCFCFD] border border-[#F1F1F5] rounded-2xl p-4 flex items-center gap-3 mb-4">
                        <span className="text-xl">💡</span>
                        <p className="text-[13px] text-gray-600 font-medium">推荐学习新词汇，当前掌握程度较低</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-[#FCFCFD] border border-[#F1F1F5] rounded-2xl p-4">
                            <p className="text-[12px] text-gray-500 font-medium mb-1">推荐模块</p>
                            <p className="text-[#6B4BFF] font-bold flex items-center gap-2 text-[15px]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                {resumeModuleLabel(recommendation.recommended_module)}
                            </p>
                        </div>
                        <div className="bg-[#FCFCFD] border border-[#F1F1F5] rounded-2xl p-4">
                            <p className="text-[12px] text-gray-500 font-medium mb-1">预计时间</p>
                            <p className="text-[#6B4BFF] font-bold flex items-center gap-2 text-[15px]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                约 {Math.round(recommendation.estimated_time / 60)} 分钟
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[13px] font-bold text-gray-500">推荐匹配度</span>
                            <span className="text-[15px] font-bold text-[#6B4BFF]">{Math.round(recommendation.confidence * 100)}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-[#F5F5F9] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#9073FF] to-[#6B4BFF] rounded-full" style={{ width: `${Math.round(recommendation.confidence * 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => handleAcceptRecommendation(true)}
                    className="w-full bg-[#834BFF] hover:bg-[#6B2CEB] h-14 rounded-2xl text-[16px] font-bold text-white shadow-[0_8px_20px_rgba(131,75,255,0.3)] transition-all flex items-center justify-center gap-2"
                >
                    立即开始
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </Button>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative flex flex-col items-center justify-center min-h-[300px]">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl">🎉</div>
                 <h3 className="font-bold text-[#1C1D24] text-lg mb-2">今日任务已完成</h3>
                 <p className="text-gray-500 text-sm mb-6 text-center">您已经完成了所有的智能推荐任务，休息一下或者自由探索吧！</p>
                 <Button
                    onClick={() => router.push('/word-learning-entrance')}
                    className="bg-[#834BFF] hover:bg-[#6B2CEB] px-8 h-12 rounded-2xl font-bold text-white shadow-[0_8px_20px_rgba(131,75,255,0.3)] transition-all"
                >
                    自由练习
                </Button>
            </div>
          )}

          {/* 今日学习 Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#834BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="font-bold text-[#1C1D24] text-[15px]">今日学习</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#FCFCFD] border border-[#F1F1F5] rounded-[20px] p-5 flex flex-col items-center justify-center text-center">
                    <div className="text-[32px] font-bold text-[#6B4BFF] leading-tight mb-1">{dashboardData.overview.totalSessions}</div>
                    <div className="text-[12px] text-gray-500 font-medium">总会话数</div>
                </div>
                <div className="bg-[#FCFCFD] border border-[#F1F1F5] rounded-[20px] p-5 flex flex-col items-center justify-center text-center">
                    <div className="text-[32px] font-bold text-[#00C48C] leading-tight mb-1">{formatAccuracy(dashboardData.overview.completionRate)}</div>
                    <div className="text-[12px] text-gray-500 font-medium">综合完成率</div>
                </div>
                <div className="bg-[#FCFCFD] border border-[#F1F1F5] rounded-[20px] p-5 flex flex-col items-center justify-center text-center col-span-2">
                    <div className="text-[32px] font-bold text-[#FF8B4B] leading-tight mb-1">{formatTime(dashboardData.overview.totalStudyTime)}</div>
                    <div className="text-[12px] text-gray-500 font-medium">总学习时长</div>
                </div>
            </div>
            
            <div className="bg-[#F8F9FA] rounded-[16px] p-4 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                        <span className="text-xl">🔄</span>
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-[#1C1D24]">待复习词汇</p>
                        <p className="text-[12px] text-gray-500 font-medium">{dueReviews.length} 个单词需要巩固</p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    className="text-[#6B4BFF] font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-xl h-auto"
                    onClick={() => router.push('/today-review')}
                >
                    前往复习
                </Button>
            </div>
          </div>
          
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="bg-white/90 backdrop-blur-md border border-gray-100 hover:bg-white text-gray-500 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.06)] text-[14px] font-bold px-8 h-12 pointer-events-auto"
          >
              返回主会场
          </Button>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black rounded-full z-20"></div>

      </div>
    </div>
  );
};

export default LearningDashboardSimple;
