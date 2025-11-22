import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildApiUrl } from "@/src/lib/apiClient";
import { useLearningContext } from '@/src/context/LearningContext';
import { useLearningSession } from '@/src/context/LearningSessionContext';
import { Battery, Signal, Wifi, Clock, BookOpen, TrendingUp } from 'lucide-react';

interface ReviewItem {
  word_id: number;
  word: string;
  mastery_level: number;
  days_overdue: number;
  review_count: number;
  priority_score: number;
  recommended_module: string;
}

const TodayReview = () => {
  const router = useRouter();
  const { userId } = useLearningContext();
  const { updateSession } = useLearningSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  useEffect(() => {
    fetchDueReviews();
  }, [userId]);

  const fetchDueReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/review/user/${userId}/due?limit=20`));
      const result = await response.json();

      if (response.ok && result.success) {
        setReviews(result.data);
      } else {
        setError(result.error || 'API服务未运行');
      }
    } catch (err) {
      setError('无法连接到API服务');
    } finally {
      setLoading(false);
    }
  };

  const startReview = (review: ReviewItem) => {
    // 更新学习会话状态
    updateSession({
      wordId: review.word_id,
      word: review.word,
      module: review.recommended_module,
      vksLevel: undefined // 复习不需要VKS等级
    });

    // 根据推荐模块跳转到对应页面
    const moduleRoutes: Record<string, string> = {
      character: '/character-learning',
      word: '/word-learning',
      collocation: '/collocation-learning',
      sentence: '/sentence-learning',
      exercise: '/exercise'
    };

    const route = moduleRoutes[review.recommended_module] || '/exercise';
    router.push(route);
  };

  const getPriorityBadge = (score: number) => {
    if (score > 0.8) return <Badge variant="destructive">高优先级</Badge>;
    if (score > 0.5) return <Badge className="bg-orange-500">中优先级</Badge>;
    return <Badge variant="secondary">低优先级</Badge>;
  };

  const getMasteryColor = (level: number) => {
    if (level >= 0.8) return 'text-green-600';
    if (level >= 0.6) return 'text-blue-600';
    if (level >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      character: '字学习',
      word: '词学习',
      collocation: '搭配学习',
      sentence: '例句学习',
      exercise: '练习'
    };
    return labels[module] || module;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
          <div className="absolute inset-0 bg-black rounded-[40px]">
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-3 overflow-hidden">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-3xl"></div>
              
              <div className="h-full flex flex-col pt-8">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-sm">加载复习内容中...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <Clock className="mr-2" size={20} />
                  今日复习
                </h1>
                <p className="text-xs text-gray-700 mt-1">
                  账号：{userId} · {reviews.length} 个待复习词汇
                </p>
              </div>

              {/* Review List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {error && (
                  <Card className="border-red-300 bg-red-50">
                    <CardContent className="p-3">
                      <p className="text-xs text-red-600">❌ {error}</p>
                      <Button 
                        size="sm" 
                        onClick={fetchDueReviews}
                        className="mt-2 w-full"
                      >
                        重新加载
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {!error && reviews.length === 0 && (
                  <Card className="border-green-300 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">🎉</div>
                      <p className="text-sm font-semibold text-green-800">太棒了！</p>
                      <p className="text-xs text-green-700 mt-1">今天没有需要复习的词汇</p>
                      <Button 
                        size="sm"
                        onClick={() => router.push('/word-learning-entrance')}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600"
                      >
                        开始学习新词汇
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {reviews.map((review, index) => (
                  <Card 
                    key={`${review.word_id}-${index}`}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedReview(review)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base">{review.word}</h3>
                          <p className="text-xs text-gray-600">
                            已复习 {review.review_count} 次
                          </p>
                        </div>
                        {getPriorityBadge(review.priority_score)}
                      </div>
                      
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">掌握度：</span>
                          <span className={`font-semibold ${getMasteryColor(review.mastery_level)}`}>
                            {(review.mastery_level * 100).toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              review.mastery_level >= 0.8 ? 'bg-green-500' :
                              review.mastery_level >= 0.6 ? 'bg-blue-500' :
                              review.mastery_level >= 0.4 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${review.mastery_level * 100}%` }}
                          ></div>
                        </div>
                        
                        {review.days_overdue > 0 && (
                          <p className="text-xs text-orange-600">
                            ⚠️ 已逾期 {review.days_overdue} 天
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 flex items-center">
                          <BookOpen size={12} className="mr-1" />
                          {getModuleLabel(review.recommended_module)}
                        </span>
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startReview(review);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-xs px-3 py-1 h-auto"
                        >
                          开始复习
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="p-3 pt-2 space-y-2 bg-orange-50">
                {reviews.length > 0 && (
                  <Button
                    onClick={() => {
                      if (reviews[0]) {
                        startReview(reviews[0]);
                      }
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    开始第一个复习
                  </Button>
                )}
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

export default TodayReview;

