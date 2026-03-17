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
    if (score > 0.5) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm">中优先级</Badge>;
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl relative min-h-[844px] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-sm">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col font-sans">
      <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden relative min-h-[844px] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/30 bg-white/20">
          <h1 className="text-xl font-bold flex items-center text-indigo-950">
            <Clock className="mr-2 text-indigo-500" size={20} />
            Today's Review
          </h1>
          <p className="text-xs text-indigo-600 font-medium">
            {reviews.length} due
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {error && (
            <div className="glass-card p-4 rounded-2xl border border-red-200 bg-red-50/50 text-center">
              <p className="text-sm text-red-600 mb-3">❌ {error}</p>
              <Button 
                size="sm" 
                onClick={fetchDueReviews}
                className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl"
              >
                Reload
              </Button>
            </div>
          )}

          {!error && reviews.length === 0 && (
            <div className="glass-card p-8 rounded-2xl border border-indigo-100 bg-white/60 text-center mt-10">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-lg font-bold text-indigo-950 mb-2">Awesome!</p>
              <p className="text-sm text-gray-600 mb-6">You've completed all your reviews for today.</p>
              <Button 
                onClick={() => router.push('/word-learning-entrance')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 h-12"
              >
                Learn New Words
              </Button>
            </div>
          )}

          {reviews.map((review, index) => (
            <div 
              key={`${review.word_id}-${index}`}
              className="glass-card p-4 rounded-2xl border border-white/60 bg-white/40 hover:bg-white/60 transition-colors shadow-sm cursor-pointer"
              onClick={() => setSelectedReview(review)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-indigo-950">{review.word}</h3>
                  <p className="text-xs text-gray-500">
                    Reviewed {review.review_count} times
                  </p>
                </div>
                {getPriorityBadge(review.priority_score)}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Mastery</span>
                  <span className={`font-semibold ${getMasteryColor(review.mastery_level)}`}>
                    {(review.mastery_level * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-indigo-100/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${
                      review.mastery_level >= 0.8 ? 'bg-emerald-400' :
                      review.mastery_level >= 0.6 ? 'bg-blue-400' :
                      review.mastery_level >= 0.4 ? 'bg-amber-400' :
                      'bg-rose-400'
                    }`}
                    style={{ width: `${review.mastery_level * 100}%` }}
                  ></div>
                </div>
                
                {review.days_overdue > 0 && (
                  <p className="text-xs text-rose-500 font-medium mt-1">
                    ⚠️ {review.days_overdue} days overdue
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-indigo-50/50">
                <span className="text-xs text-gray-500 flex items-center font-medium">
                  <BookOpen size={12} className="mr-1.5" />
                  {getModuleLabel(review.recommended_module)}
                </span>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startReview(review);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 h-8 rounded-full shadow-md shadow-indigo-600/20"
                >
                  Start Review
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-6 bg-white/30 backdrop-blur-md border-t border-white/40 space-y-3 pb-8">
          {reviews.length > 0 && (
            <Button
              onClick={() => {
                if (reviews[0]) {
                  startReview(reviews[0]);
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 h-12 text-base font-semibold"
            >
              Start First Review
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full bg-white/50 border-white/60 text-gray-700 hover:bg-white/80 hover:text-indigo-600 h-12 rounded-xl font-semibold backdrop-blur-md"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TodayReview;

