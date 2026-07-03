import React from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, ArrowRight, Activity, Zap, BarChart2, RefreshCw } from 'lucide-react';

const Home = () => {
  const router = useRouter();

  const handleStartLearning = () => {
    router.push('/word-learning-entrance');
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-gray-50">
      <div className="w-full max-w-[430px] h-[100dvh] overflow-hidden modern-gradient-bg relative">
        <div className="h-full pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] px-5 flex flex-col justify-center relative z-10">
          {/* Header section with glass effect */}
          <div className="text-center mb-8 glass-panel py-8 px-5 rounded-3xl mx-1 shadow-lg border border-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
              <BookOpen className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 leading-tight mb-3 tracking-tight">
              智能学习系统
            </h1>
            <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">
              自适应中级对外汉语
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="space-y-4">
            <button 
              onClick={handleStartLearning}
              className="w-full relative group overflow-hidden bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-indigo-100 flex items-center justify-between"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-5 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center relative z-10 gap-4">
                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-colors">
                  <GraduationCap size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 group-hover:text-white transition-colors text-lg">开始学习</p>
                  <p className="text-sm text-gray-400 group-hover:text-indigo-100 transition-colors">进入自适应路线</p>
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-white/20 group-hover:text-white transition-colors relative z-10">
                <ArrowRight size={20} />
              </div>
            </button>

            {/* Grid Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => router.push('/learning-dashboard')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3"
              >
                <div className="bg-blue-50 text-blue-500 p-3 rounded-xl">
                  <Activity size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">我的数据</span>
              </button>

              <button 
                onClick={() => router.push('/today-review')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3"
              >
                <div className="bg-rose-50 text-rose-500 p-3 rounded-xl">
                  <RefreshCw size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">今日复习</span>
              </button>

              <button 
                onClick={() => router.push('/confusable-words')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3"
              >
                <div className="bg-amber-50 text-amber-500 p-3 rounded-xl">
                  <Zap size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">易混词辨</span>
              </button>

              <button 
                onClick={() => router.push('/learning-stats')}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center gap-3"
              >
                <div className="bg-emerald-50 text-emerald-500 p-3 rounded-xl">
                  <BarChart2 size={22} />
                </div>
                <span className="text-base font-semibold text-gray-700">分析报告</span>
              </button>
            </div>

            {/* Bottom minor actions */}
            <div className="flex gap-3 pt-2">
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