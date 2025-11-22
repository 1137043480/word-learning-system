import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Battery, Signal, Wifi, ArrowLeft, ArrowRight } from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

interface ConfusablePair {
  id: number;
  word1: {
    id: number;
    pinyin: string;
    definition: string;
  };
  word2: {
    id: number;
    pinyin: string;
    definition: string;
  };
  reason: string;
  difference: string;
  examples: string;
  tips: string;
  difficulty_level: number;
}

/**
 * 易混淆词辨析学习页面
 */
export default function ConfusableWordsPage() {
  const [pairs, setPairs] = useState<ConfusablePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadConfusablePairs();
  }, []);

  const loadConfusablePairs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/confusable/pairs?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setPairs(data.pairs);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务');
      console.error('加载易混淆词失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPair = pairs[currentIndex];

  const handleNext = () => {
    if (currentIndex < pairs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          加载易混淆词数据中...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-red-500 text-center px-4">
          <p>{error}</p>
          <Button onClick={loadConfusablePairs} className="mt-4">
            重试
          </Button>
        </div>
      );
    }

    if (!currentPair) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          暂无易混淆词数据
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 标题 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h2 className="text-lg font-bold text-center text-blue-800">
            易混淆词辨析
          </h2>
          <p className="text-xs text-center text-blue-600 mt-1">
            第 {currentIndex + 1} / {pairs.length} 组
          </p>
        </div>

        {/* 词对比较 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 词1 */}
          <div className="bg-white p-3 rounded-lg shadow border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-purple-700">
                {currentPair.word1.pinyin}
              </h3>
              <AudioPlayer
                text={currentPair.word1.pinyin}
                language="zh-CN"
                buttonSize="sm"
              />
            </div>
            <p className="text-sm text-gray-600">
              {currentPair.word1.definition}
            </p>
          </div>

          {/* 词2 */}
          <div className="bg-white p-3 rounded-lg shadow border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-green-700">
                {currentPair.word2.pinyin}
              </h3>
              <AudioPlayer
                text={currentPair.word2.pinyin}
                language="zh-CN"
                buttonSize="sm"
              />
            </div>
            <p className="text-sm text-gray-600">
              {currentPair.word2.definition}
            </p>
          </div>
        </div>

        {/* 混淆原因 */}
        <div className="bg-yellow-50 p-3 rounded-lg shadow">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 为什么易混淆？</h4>
          <p className="text-sm text-gray-700">{currentPair.reason}</p>
        </div>

        {/* 显示答案按钮 */}
        {!showAnswer && (
          <Button
            onClick={() => setShowAnswer(true)}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            🔍 查看辨析详解
          </Button>
        )}

        {/* 详细辨析 */}
        {showAnswer && (
          <>
            <div className="bg-white p-3 rounded-lg shadow">
              <h4 className="font-semibold text-gray-800 mb-2">📖 详细区别</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {currentPair.difference}
              </pre>
            </div>

            {currentPair.examples && (
              <div className="bg-green-50 p-3 rounded-lg shadow">
                <h4 className="font-semibold text-green-800 mb-2">📝 例句对比</h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {currentPair.examples}
                </pre>
              </div>
            )}

            {currentPair.tips && (
              <div className="bg-purple-50 p-3 rounded-lg shadow">
                <h4 className="font-semibold text-purple-800 mb-2">💡 记忆技巧</h4>
                <p className="text-sm text-gray-700">{currentPair.tips}</p>
              </div>
            )}
          </>
        )}

        {/* 难度标识 */}
        <div className="text-center text-xs text-gray-500">
          难度等级: {'⭐'.repeat(currentPair.difficulty_level)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-black rounded-[40px]">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-2 overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-2xl"></div>
            
            {/* Status Bar */}
            <div className="relative z-10 flex justify-between items-center px-4 pt-1.5 text-black text-xs h-6">
              <span>6:00 PM</span>
              <div className="flex items-center space-x-1">
                <Signal size={14} />
                <Wifi size={14} />
                <Battery size={14} />
              </div>
            </div>

            {/* Content */}
            <div className="h-full pt-6 pb-4 flex flex-col">
              {/* Header */}
              <div className="bg-orange-200 p-3">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft size={20} /> 返回
                  </Button>
                  <h1 className="text-lg font-bold">易混淆词</h1>
                  <div className="w-20"></div>
                </div>
              </div>

              {/* Body */}
              {renderBody()}

              {/* Navigation */}
              {!loading && !error && pairs.length > 0 && (
                <div className="px-4 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    <ArrowLeft size={16} /> 上一组
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleNext}
                    disabled={currentIndex === pairs.length - 1}
                  >
                    下一组 <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

