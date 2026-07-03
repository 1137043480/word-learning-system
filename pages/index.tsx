import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, ArrowRight, Activity, Zap, BarChart2, RefreshCw } from 'lucide-react';
import { fetchJson } from '@/src/lib/apiClient';
import { useLearningContext } from '@/src/context/LearningContext';

const Home = () => {
  const router = useRouter();
  const { userId } = useLearningContext();
  // null = 加载中，加载失败按 0 处理（不阻塞主流程）
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchJson<{ success: boolean; data: unknown[] }>(`/api/review/user/${userId}/due?limit=99`)
      .then(result => {
        if (!cancelled) setDueCount(result.success && Array.isArray(result.data) ? result.data.length : 0);
      })
      .catch(() => {
        if (!cancelled) setDueCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 主入口的智能路由：有到期复习先复习（记忆曲线优先），否则直接学新词
  const hasDue = (dueCount ?? 0) > 0;
  const handleStartLearning = () => {
    router.push(hasDue ? '/today-review' : '/word-learning-entrance');
  };

  const mainSubtitle =
    dueCount === null
      ? '正在为你规划今日任务…'
      : hasDue
        ? `${dueCount} 个词到期 · 先复习，再学新词`
        : '今日无待复习 · 直接学习新词';

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-gray-50">
      <div className="w-full max-w-[430px] h-[100dvh] overflow-hidden modern-gradient-bg relative">
        <div className="h-full pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] px-5 flex flex-col justify-center relative z-10">
          {/* Header section with glass effect */}
          <div className="text-center mb-6 glass-panel py-6 px-5 rounded-3xl mx-1 shadow-lg border border-white/50 backdrop-blur-xl">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-indigo-200">
              <BookOpen className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 leading-tight mb-2 tracking-tight">
              智能学习系统
            </h1>
            <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">
              自适应中级对外汉语
            </p>
          </div>

          <div className="space-y-4">
            {/* 智能主入口：系统决定“下一步做什么”，用户只需要点它 */}
            <button
              onClick={handleStartLearning}
              className="w-full relative overflow-hidden rounded-2xl p-5 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-300 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <div className="flex items-center relative z-10 gap-4">
                <div className="bg-white/20 p-3 rounded-xl text-white backdrop-blur-sm">
                  <GraduationCap size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-lg">开始学习</p>
                  <p className="text-sm text-indigo-100">{mainSubtitle}</p>
                </div>
              </div>
              <div className="bg-white/20 p-2 rounded-full text-white relative z-10">
                <ArrowRight size={20} />
              </div>
            </button>

            {/* 学习路线说明：回答“到底怎么学” */}
            <div className="glass-card rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 mb-1.5 tracking-wide">学习路线</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                复习到期词汇 → VKS 自评新词 → 按水平进入
                <span className="text-indigo-600 font-medium">字 / 词 / 搭配 / 例句</span>
                → 练习巩固，系统按记忆曲线安排下次复习
              </p>
            </div>

            {/* Grid Actions：各入口标注职责，避免与主线混淆 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/today-review')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-2 relative"
              >
                {hasDue && (
                  <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {dueCount}
                  </span>
                )}
                <div className="bg-rose-50 text-rose-500 p-3 rounded-xl">
                  <RefreshCw size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">今日复习</span>
                <span className="text-xs text-gray-400">只做到期词复习</span>
              </button>

              <button
                onClick={() => router.push('/confusable-words')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-2"
              >
                <div className="bg-amber-50 text-amber-500 p-3 rounded-xl">
                  <Zap size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">易混词辨</span>
                <span className="text-xs text-gray-400">专项辨析练习</span>
              </button>

              <button
                onClick={() => router.push('/learning-dashboard')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-2"
              >
                <div className="bg-blue-50 text-blue-500 p-3 rounded-xl">
                  <Activity size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">我的数据</span>
                <span className="text-xs text-gray-400">进度与智能推荐</span>
              </button>

              <button
                onClick={() => router.push('/learning-stats')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-2"
              >
                <div className="bg-emerald-50 text-emerald-500 p-3 rounded-xl">
                  <BarChart2 size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">分析报告</span>
                <span className="text-xs text-gray-400">系统统计数据</span>
              </button>
            </div>

            {/* Bottom minor actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="flex-1 text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-white/50 h-10 rounded-xl"
              >
                登录账户
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/system-status')}
                className="flex-1 text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-white/50 h-10 rounded-xl"
              >
                诊断工具
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative floating blur circles */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
        <div className="absolute top-40 -left-20 w-48 h-48 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Home;
