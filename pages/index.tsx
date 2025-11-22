import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/router';

const Home = () => {
  const router = useRouter();

  const handleStartLearning = () => {
    console.log('Start Learning button clicked!');
    router.push('/word-learning-entrance');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-200 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        {/* iPhone frame */}
        <div className="absolute inset-0 bg-black rounded-[40px]">
          {/* Screen */}
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-2 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-2xl"></div>
            
            {/* Content */}
            <div className="h-full pt-8 pb-4 flex flex-col items-center justify-center text-center">
              <div className="space-y-4 px-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  欢迎使用<br />智能学习系统
                </h1>
                <p className="text-sm text-gray-600">
                  自适应对外汉语中级词汇学习
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/login')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-base rounded-lg shadow-lg"
                  >
                    🔐 登录账户
                  </Button>
                  <Button 
                    onClick={() => router.push('/learning-dashboard')}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 text-base rounded-lg shadow-lg"
                  >
                    🎓 我的Dashboard
                  </Button>
                  <Button 
                    onClick={handleStartLearning}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-base rounded-lg shadow-lg"
                  >
                    🎯 开始学习
                  </Button>
                  <Button 
                    onClick={() => router.push('/confusable-words')}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 text-base rounded-lg shadow-lg"
                  >
                    🔀 易混淆词辨析
                  </Button>
                  <Button 
                    onClick={() => router.push('/today-review')}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-base rounded-lg shadow-lg"
                  >
                    ⏰ 今日复习
                  </Button>
                  <div className="flex space-x-2">
                    <Button 
                    onClick={() => router.push('/system-status')}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 text-xs rounded-lg"
                  >
                    🖥️ 系统状态
                  </Button>
                  <Button 
                    onClick={() => router.push('/phase2-demo')}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 text-xs rounded-lg"
                  >
                    🚀 功能演示
                  </Button>
                  </div>
                  <Button 
                    onClick={() => router.push('/learning-stats')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 text-sm rounded-lg"
                  >
                    📊 学习统计
                  </Button>
                </div>
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

export default Home;