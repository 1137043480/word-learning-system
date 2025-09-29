import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi, Volume2 } from 'lucide-react';
import { useWordData } from '@/hooks/useWordData';
import { useLearningSession } from '@/src/context/LearningSessionContext';
import { useLearningNavigation, resolveModuleLabel } from '@/src/hooks/useLearningNavigation';

export default function Component() {
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const { session: learningSession, updateSession: updateLearningSession } = useLearningSession();
  const { word, loading, error } = useWordData({ initialWordId: learningSession.wordId ?? undefined });
  const { previous, next, goTo } = useLearningNavigation('collocation');

  const playAudio = (id: string) => {
    setAudioPlaying(id);
    setTimeout(() => setAudioPlaying(null), 1000);
  };

  useEffect(() => {
    updateLearningSession({ module: 'collocation' });
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

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex-1 p-3 flex flex-col justify-center items-center text-gray-500 text-sm">
          加载搭配数据中...
        </div>
      );
    }

    if (error || !word) {
      return (
        <div className="flex-1 p-3 flex flex-col justify-center items-center text-red-500 text-sm text-center">
          无法获取搭配信息，请确认后端 API 已运行。
        </div>
      );
    }

    const collocations = word.collocations ?? [];

    return (
      <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">{word.hanzi}</h2>
              <div className="flex items-center">
                <span className="text-base mr-2">{word.pinyin}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => playAudio('main')}
                  className={audioPlaying === 'main' ? 'text-blue-500' : 'text-gray-500'}
                >
                  <Volume2 size={20} />
                </Button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{word.definition}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="font-semibold mb-2">搭配 (Collocations)</h3>
            <div className="space-y-2 text-sm">
              {collocations.length === 0 && <p>暂无搭配数据。</p>}
              {collocations.map((item, index) => (
                <div key={`${item.collocation}-${index}`} className="flex justify-between items-center">
                  <p>
                    <span className="font-semibold">{item.collocation}</span> {item.translation}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => playAudio(`collocation-${index}`)}
                    className={audioPlaying === `collocation-${index}` ? 'text-blue-500' : 'text-gray-500'}
                  >
                    <Volume2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!previous}
            onClick={() => handleNavigate('previous')}
          >
            返回{previous ? ` · ${previous.label}` : ''}
          </Button>
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            disabled={!next}
            onClick={() => handleNavigate('next')}
          >
            前往{next ? ` · ${next.label}` : ''}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        <div className="absolute inset-0 bg-black rounded-[40px]">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-2 overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-2xl"></div>

            <div className="relative z-10 flex justify-between items-center px-4 pt-1.5 text-black text-xs h-6">
              <span>6:00 PM</span>
              <div className="flex items-center space-x-1">
                <Signal size={14} />
                <Wifi size={14} />
                <Battery size={14} />
              </div>
            </div>

            <div className="h-full pt-6 pb-4 flex flex-col">
              <div className="bg-orange-200 p-3">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!previous}
                    onClick={() => handleNavigate('previous')}
                  >
                    ← {previous ? previous.label : '上一模块'}
                  </Button>
                  <h1 className="text-lg font-semibold">collocation learning</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!next}
                    onClick={() => handleNavigate('next')}
                  >
                    {next ? next.label : '结束'} →
                  </Button>
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  当前模块：{resolveModuleLabel('collocation')}
                </p>
              </div>
              {renderBody()}
            </div>

            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
