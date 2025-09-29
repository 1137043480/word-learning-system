import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi, Volume2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useWordData } from '@/hooks/useWordData';

export default function Component() {
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const { word, loading, error } = useWordData();
  const router = useRouter();

  const playAudio = (id: string) => {
    setAudioPlaying(id);
    setTimeout(() => setAudioPlaying(null), 1000);
  };

  const handleContinue = () => {
    router.push('/word-learning');
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

        <Button
          onClick={handleContinue}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-base rounded-lg mt-3"
        >
          CONTINUE
        </Button>
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
                <h1 className="text-lg font-semibold">character learning</h1>
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
