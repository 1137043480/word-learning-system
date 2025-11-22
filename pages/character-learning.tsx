import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi } from 'lucide-react';
import { useWordData } from '@/hooks/useWordData';
import { useLearningSession } from '@/src/context/LearningSessionContext';
import { useLearningNavigation } from '@/src/hooks/useLearningNavigation';
import AudioPlayer from '@/components/AudioPlayer';

export default function Component() {
  const { session: learningSession, updateSession: updateLearningSession } = useLearningSession();
  const { word, loading, error } = useWordData({ initialWordId: learningSession.wordId ?? undefined });
  const { previous, next, goTo } = useLearningNavigation('character');

  useEffect(() => {
    updateLearningSession({ module: 'character' });
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
          加载字形数据中...
        </div>
      );
    }

    if (error || !word) {
      return (
        <div className="flex-1 p-3 flex flex-col justify-center items-center text-red-500 text-sm text-center">
          无法加载字形信息，请检查 API 服务。
        </div>
      );
    }

    const characters = word.characters ?? [];

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
            <div className="space-y-2 text-xs">
              {characters.length === 0 && <p>暂无字形数据。</p>}
              {characters.map((item, index) => (
                <div key={`${item.character}-${index}`} className="flex justify-between items-center">
                  <p>
                    <span className="font-semibold text-base mr-2">{item.character}</span>
                    <span className="mr-2">{item.pinyin}</span>
                    {item.definition}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => playAudio(`character-${index}`)}
                    className={audioPlaying === `character-${index}` ? 'text-blue-500' : 'text-gray-500'}
                  >
                    <Volume2 size={14} />
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
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-100 rounded-[32px] m-3 overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-3xl"></div>

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
                    ← {previous ? previous.label : '欢迎页'}
                  </Button>
                  <h1 className="text-lg font-semibold">character learning</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!next}
                    onClick={() => handleNavigate('next')}
                  >
                    {next ? next.label : '结束'} →
                  </Button>
                </div>
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
