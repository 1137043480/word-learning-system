import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buildApiUrl } from "@/src/lib/apiClient";
import { useLearningContext } from '@/src/context/LearningContext';
import { useLearningSession } from '@/src/context/LearningSessionContext';
import { 
  Battery, Signal, Wifi, TrendingUp, BookOpen, 
  Clock, Target, Award, ChevronRight 
} from 'lucide-react';

interface Recommendation {
  type: string;
  priority: string;
  word_id: number;
  word: string;
  reason: string;
  recommended_module: string;
  confidence: number;
  estimated_time: number;
  recommendationId?: number;
}

interface DashboardData {
  overallProgress: {
    totalWords: number;
    studiedWords: number;
    masteredWords: number;
    averageMastery: number;
  };
  todayStats: {
    studyTimeMinutes: number;
    wordsReviewed: number;
    exercisesCompleted: number;
    averageAccuracy: number;
  };
  recommendations: Recommendation[];
  dueReviews: number;
  strengths: string[];
  weaknesses: string[];
}

const LearningDashboard = () => {
  const router = useRouter();
  const { userId } = useLearningContext();
  const { updateSession } = useLearningSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecommendation();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/analytics/user/${userId}/dashboard`));
      const result = await response.json();

      if (response.ok && result.success) {
        setDashboardData(result.data);
      }
    } catch (err) {
      console.error('加载Dashboard数据失败:', err);
    }
  };

  const fetchRecommendation = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/adaptive/recommendation/${userId}`));
      const result = await response.json();

      if (response.ok && result.success) {
        setRecommendation(result.data);
      } else {
        setError(result.error || 'API服务未运行');
      }
    } catch (err) {
      setError('无法连接到API服务');
    } finally {
      setLoading(false);
    }
  };

  const startRecommendedLearning = () => {
    if (!recommendation) return;

    updateSession({
      wordId: recommendation.word_id,
      word: recommendation.word,
      module: recommendation.recommended_module,
      vksLevel: undefined
    });

    const moduleRoutes: Record<string, string> = {
      character: '/character-learning',
      word: '/word-learning',
      collocation: '/collocation-learning',
      sentence: '/sentence-learning',
      exercise: '/exercise',
      urgent_review: '/exercise',
      scheduled_review: '/exercise',
      new_learning: '/word-learning'
    };

    const route = moduleRoutes[recommendation.recommended_module] || moduleRoutes[recommendation.type] || '/word-learning';
    router.push(route);
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      character: '字学习',
      word: '词学习',
      collocation: '搭配学习',
      sentence: '例句学习',
      exercise: '练习',
      urgent_review: '紧急复习',
      scheduled_review: '计划复习',
      new_learning: '新词学习'
    };
    return labels[module] || module;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      urgent_review: '🚨 紧急复习',
      scheduled_review: '📅 计划复习',
      new_learning: '✨ 新词学习',
      explore_learning: '🔍 探索学习',
      system_default: '📚 系统推荐'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500',
      medium: 'bg-orange-500',
      low: 'bg-blue-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `约 ${minutes} 分钟`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-black rounded-[40px]">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-3 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-3xl"></div>

            {/* Status Bar */}
            <div className="relative z-10 flex justify-between items-center px-4 pt-1.5 text-black text-xs h-6">
              <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              <div className="flex items-center space-x-1">
                <Signal size={14} />
                <Wifi size={14} />
                <Battery size={14} />
              </div>
            </div>

            {/* Content */}
            <div className="h-full pt-6 pb-4 flex flex-col">
              {/* Header */}
              <div className="bg-orange-200 p-3 pb-2">
                <h1 className="text-xl font-bold flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  学习Dashboard
                </h1>
                <p className="text-xs text-gray-700 mt-1">
                  账号：{userId}
                </p>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loading && !recommendation && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-600">加载推荐中...</p>
                    </CardContent>
                  </Card>
                )}

                {error && !recommendation && (
                  <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-3">
                      <p className="text-xs text-red-600">❌ {error}</p>
                    </CardContent>
                  </Card>
                )}

                {/* 智能推荐卡片 */}
                {recommendation && (
                  <Card className="border-green-500 border-2 shadow-lg">
                    <CardHeader className="p-3 pb-2 bg-gradient-to-r from-green-50 to-blue-50">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center">
                          <Target className="mr-1" size={16} />
                          智能推荐
                        </span>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority === 'high' ? '高' : 
                           recommendation.priority === 'medium' ? '中' : '低'}优先级
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">
                            {getTypeLabel(recommendation.type)}
                          </div>
                          <h3 className="font-bold text-lg">{recommendation.word}</h3>
                        </div>
                      </div>
                      
                      <div className="p-2 bg-blue-50 rounded text-xs text-gray-700">
                        💡 {recommendation.reason}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600 mb-1">推荐模块</div>
                          <div className="font-semibold flex items-center">
                            <BookOpen size={12} className="mr-1" />
                            {getModuleLabel(recommendation.recommended_module || recommendation.type)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600 mb-1">预计时间</div>
                          <div className="font-semibold flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTime(recommendation.estimated_time)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">推荐置信度</span>
                        <span className="font-semibold">{(recommendation.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={recommendation.confidence * 100} className="h-1.5" />

                      <Button
                        onClick={startRecommendedLearning}
                        className="w-full bg-green-500 hover:bg-green-600 text-white mt-2"
                      >
                        立即开始
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* 今日统计 */}
                {dashboardData && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Award className="mr-1" size={16} />
                        今日学习
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {dashboardData.todayStats.wordsReviewed}
                          </div>
                          <div className="text-gray-600 mt-1">复习词汇</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {dashboardData.todayStats.exercisesCompleted}
                          </div>
                          <div className="text-gray-600 mt-1">完成练习</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {dashboardData.todayStats.studyTimeMinutes}
                          </div>
                          <div className="text-gray-600 mt-1">学习分钟</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="text-2xl font-bold text-orange-600">
                            {(dashboardData.todayStats.averageAccuracy * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-600 mt-1">准确率</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 整体进度 */}
                {dashboardData && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">整体进度</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>已学词汇</span>
                        <span className="font-semibold">
                          {dashboardData.overallProgress.studiedWords} / {dashboardData.overallProgress.totalWords}
                        </span>
                      </div>
                      <Progress 
                        value={(dashboardData.overallProgress.studiedWords / dashboardData.overallProgress.totalWords) * 100} 
                        className="h-2"
                      />
                      
                      <div className="flex justify-between text-xs mt-2">
                        <span>平均掌握度</span>
                        <span className="font-semibold text-green-600">
                          {(dashboardData.overallProgress.averageMastery * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={dashboardData.overallProgress.averageMastery * 100} 
                        className="h-2"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* 快捷操作 */}
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <Button
                      onClick={() => router.push('/today-review')}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center">
                        <Clock className="mr-2" size={16} />
                        今日复习
                      </span>
                      {dashboardData && (
                        <Badge variant="destructive">{dashboardData.dueReviews}</Badge>
                      )}
                    </Button>
                    <Button
                      onClick={() => router.push('/word-learning-entrance')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <BookOpen className="mr-2" size={16} />
                      开始学习
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 pt-2 bg-orange-50">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  返回首页
                </Button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;

