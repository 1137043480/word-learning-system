import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi, Volume2 } from 'lucide-react';
import { useWordData } from '@/hooks/useWordData';
import { useLearningSession } from '@/src/context/LearningSessionContext';
import { useLearningNavigation, resolveModuleLabel } from '@/src/hooks/useLearningNavigation';
import AudioPlayer from '@/components/AudioPlayer';

export default function Component() {
  const { session: learningSession, updateSession: updateLearningSession } = useLearningSession();
  const { word, loading, error } = useWordData({ initialWordId: learningSession.wordId ?? undefined });
  const { previous, next, goTo } = useLearningNavigation('sentence');
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  const playAudio = (id: string) => {
    setAudioPlaying(id);
    // In a real app, logic to play audio goes here.
    setTimeout(() => setAudioPlaying(null), 1500);
  };

  useEffect(() => {
    updateLearningSession({ module: 'sentence' });
  }, [updateLearningSession]);

  useEffect(() => {
    if (word) {
      updateLearningSession({ wordId: word.id, word: word.hanzi });
    }
  }, [word, updateLearningSession]);

  const handleNavigate = (direction: 'previous' | 'next') => {
    const target = direction === 'previous' ? previous : next;
    if (!target) return;
    goTo(target.key);
  };

  const mainExample = word?.examples?.[0];

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex-1 p-3 flex flex-col justify-center items-center text-gray-500 text-sm">
          加载例句数据中...
        </div>
      );
    }

    if (error || !word || !mainExample) {
      return (
        <div className="flex-1 p-3 flex flex-col justify-center items-center text-red-500 text-sm text-center">
          暂时无法加载例句，请确认 API 服务是否可用。
        </div>
      );
    }

    return (
      <div className="flex-1 px-5 flex flex-col justify-between overflow-y-auto custom-scrollbar relative z-20">
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/60 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 pointer-events-none -mr-10 -mt-10"></div>
            
            <div className="flex flex-col items-center mb-2">
              <h2 className="text-[54px] font-extrabold text-gray-900 leading-none mb-2 mt-2">{word.hanzi}</h2>
              <div className="flex items-center gap-2 bg-indigo-50/80 px-4 py-1.5 rounded-full mb-2 z-10">
                <span className="text-sm font-medium text-indigo-700 tracking-widest">{word.pinyin}</span>
                <AudioPlayer 
                  text={word.hanzi}
                  language="zh-CN"
                  buttonSize="sm"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4 relative z-10 text-left">
               {/* Example Sentences Block */}
               {word.examples && word.examples.length > 0 && (
                <div className="glass-card p-4 rounded-2xl border border-white/40 space-y-4 mt-4">
                  {word.examples.map((ex, index) => (
                    <div key={index} className="group flex flex-col relative">
                      <div className="flex justify-between items-start">
                        <p className="text-[13px] font-semibold text-gray-800 leading-relaxed pr-8">
                          {ex.sentence}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 rounded-full absolute top-0 right-0 text-indigo-400 hover:text-indigo-600 hover:bg-white/50"
                          onClick={() => playAudio(`sentence-${index}`)}
                        >
                          <Volume2 size={14} />
                        </Button>
                      </div>
                      {ex.pinyin && (
                        <p className="text-[11px] text-indigo-600/80 mt-1.5 font-medium tracking-wide">
                          {ex.pinyin}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {ex.translation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Spacer to guarantee scroll reaching the bottom properly */}
              <div className="h-6 w-full shrink-0"></div>
            </div>
          </div>
        </div>

        {/* 底部按钮区域保持为单大绿色 CONTINUE 按钮以符合原型图 */}
        <div className="pt-4 pb-2 w-full z-30 px-5">
          <Button
              className="w-full h-12 rounded-xl border-none shadow-[0_4px_14px_0_rgba(91,176,24,0.39)] bg-[#5bb018] hover:bg-[#4d9711] text-white font-bold tracking-widest text-sm"
              onClick={() => handleNavigate("next")}
            >
              CONTINUE
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] p-2 shadow-2xl relative">
        <div className="absolute inset-0 m-2 rounded-[32px] overflow-hidden modern-gradient-bg">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-2xl z-50"></div>

          <div className="relative z-40 flex justify-between items-center px-4 pt-1.5 text-gray-800 text-xs h-6">
            <span className="font-medium tracking-wide text-[10px]">6:00</span>
            <div className="flex items-center space-x-1">
              <Signal size={12} strokeWidth={2.5} />
              <Wifi size={12} strokeWidth={2.5} />
              <Battery size={14} strokeWidth={2.5} />
            </div>
          </div>

          <div className="h-full pt-10 pb-4 flex flex-col relative z-20">
            <div className="px-5 mb-2">
              <div className="flex justify-between items-center">
                <Button
                  className="h-8 px-2 bg-white/40 hover:bg-white/70 shadow-sm text-indigo-700 rounded-lg text-[10px]"
                  variant="ghost"
                  disabled={!previous}
                  onClick={() => handleNavigate('previous')}
                >
                  ← {previous?.label || '上一模块'}
                </Button>
                <h1 className="text-[14px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-800 tracking-tight">sentence</h1>
                <Button
                  className="h-8 px-2 bg-white/40 hover:bg-white/70 shadow-sm text-indigo-700 rounded-lg text-[10px]"
                  variant="ghost"
                  disabled={!next}
                  onClick={() => handleNavigate('next')}
                >
                  {next?.label || '结束'} →
                </Button>
              </div>
              <p className="text-[10px] text-indigo-600/70 mt-1.5 font-medium ml-1">
                当前模块：{resolveModuleLabel('sentence')}
              </p>
            </div>
            
            {renderBody()}

            {/* Decorative blurs */}
            <div className="absolute top-1/3 -right-12 w-48 h-48 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none z-10"></div>
            <div className="absolute bottom-1/3 -left-12 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none z-10"></div>
            
            <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800/20 rounded-full backdrop-blur-xl z-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
