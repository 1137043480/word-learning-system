import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi, Volume2 } from "lucide-react";
import { useWordData } from "@/hooks/useWordData";
import { useLearningSession } from "@/src/context/LearningSessionContext";
import { useLearningNavigation } from "@/src/hooks/useLearningNavigation";
import AudioPlayer from "@/components/AudioPlayer";

export default function Component() {
  const { session: learningSession, updateSession: updateLearningSession } =
    useLearningSession();
  const { word, loading, error } = useWordData({
    initialWordId: learningSession.wordId ?? undefined,
  });
  const { previous, next, goTo } = useLearningNavigation("character");


  useEffect(() => {
    updateLearningSession({ module: "character" });
  }, [updateLearningSession]);

  useEffect(() => {
    if (word) {
      updateLearningSession({ wordId: word.id, word: word.hanzi });
    }
  }, [word, updateLearningSession]);

  const handleNavigate = (direction: "previous" | "next") => {
    const target = direction === "previous" ? previous : next;
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
      <div className="flex-1 px-5 flex flex-col justify-between overflow-y-auto custom-scrollbar relative z-20">
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl shadow-lg border border-white/60 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 pointer-events-none -mr-10 -mt-10"></div>

            <div className="flex flex-col items-center mb-2">
              <h2 className="text-[54px] font-extrabold text-gray-900 leading-none mb-2">
                {word.hanzi}
              </h2>
              <div className="flex items-center gap-2 bg-indigo-50/80 px-4 py-1.5 rounded-full">
                <span className="text-sm font-medium text-indigo-700 tracking-widest">
                  {word.pinyin}
                </span>
                <AudioPlayer 
                  text={word.hanzi} 
                  language="zh-CN"
                  buttonSize="sm"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4 relative z-10 text-left">
              {characters.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  暂无字形数据。
                </p>
              )}
              {/* Character Block */}
              {characters.map((item, index) => (
                <div
                  key={`${item.character}-${index}`}
                  className="flex-1 flex items-center p-3 rounded-2xl border border-white/40 glass-card"
                >
                    <span className="font-extrabold text-lg text-gray-800 shrink-0 w-8">
                      {item.character}
                    </span>
                    <span className="text-sm font-semibold text-indigo-500 shrink-0 w-12 text-left">
                      {item.pinyin}
                    </span>
                    <p className="text-sm text-gray-700 font-medium px-2 flex-1 leading-relaxed break-words">
                      {item.definition}
                    </p>
                    <AudioPlayer 
                      text={item.character} 
                      language="zh-CN"
                      buttonSize="sm"
                    />
                </div>
              ))}

              {/* Word Definition Block */}
              {word.definition && (
                <div className="glass-card p-4 rounded-2xl border border-white/40 mt-4 bg-white/40 shadow-sm">
                  <p className="text-[15px] text-gray-800 font-medium leading-relaxed text-center">
                     {word.definition}
                  </p>
                </div>
              )}

              {/* Collocations Block */}
              {word.collocations && word.collocations.length > 0 && (
                <div className="glass-card p-4 rounded-2xl border border-white/40 space-y-3 mt-4">
                  {word.collocations.map((col, index) => {
                    // Extracting "容易（三级）发生" pattern from DB for UI rendering
                    const parts = col.collocation.split('（');
                    let prefix = col.collocation;
                    let level = '';
                    let suffix = '';
                    
                    if (parts.length > 1) {
                        prefix = parts[0];
                        const subParts = parts[1].split('）');
                        if (subParts.length > 1) {
                            level = subParts[0];
                            suffix = subParts[1].replace(word.hanzi || word.pinyin, '');
                        }
                    }

                    return (
                    <div key={index} className="flex justify-between items-center group">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-1.5 text-[14px] font-semibold text-gray-800 mb-1 flex-wrap">
                          {prefix && <span>{prefix}</span>}
                          {level && <span className="text-xs text-indigo-500/80 bg-indigo-50 px-1 rounded">({level})</span>}
                          {suffix && <span>{suffix}</span>}
                          <span className="text-indigo-600 font-bold ml-1">{word.hanzi || word.pinyin}</span>
                        </div>
                        <p className="text-sm font-normal text-gray-600 mt-1">{col.translation}</p>
                      </div>
                      <AudioPlayer 
                        text={col.collocation.replace(/\uff08[^\uff09]*\uff09/g, '')} 
                        language="zh-CN"
                        buttonSize="sm"
                      />
                    </div>
                  )})}
                </div>
              )}

               {/* Example Sentences Block */}
               {word.examples && word.examples.length > 0 && (
                <div className="glass-card p-4 rounded-2xl border border-white/40 space-y-4 mt-4">
                  {word.examples.map((ex, index) => (
                    <div key={index} className="group flex flex-col relative">
                      <div className="flex justify-between items-start">
                        <p className="text-[14px] font-semibold text-gray-800 leading-relaxed pr-8">
                          {ex.sentence}
                        </p>
                        <div className="absolute top-0 right-0">
                          <AudioPlayer 
                            text={ex.sentence} 
                            language="zh-CN"
                            buttonSize="sm"
                          />
                        </div>
                      </div>
                      {ex.pinyin && (
                        <p className="text-[12px] text-indigo-600/80 mt-2 font-medium tracking-wide leading-relaxed">
                          {ex.pinyin}
                        </p>
                      )}
                      <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
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
                  variant="ghost"
                  size="sm"
                  disabled={!previous}
                  className="h-8 px-2 bg-white/40 hover:bg-white/70 shadow-sm text-indigo-700 rounded-lg text-[10px]"
                  onClick={() => handleNavigate("previous")}
                >
                  ← {previous ? previous.label : "欢迎页"}
                </Button>
                <h1 className="text-[14px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-800 tracking-tight">
                  Character
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!next}
                  className="h-8 px-2 bg-white/40 hover:bg-white/70 shadow-sm text-indigo-700 rounded-lg text-[10px]"
                  onClick={() => handleNavigate("next")}
                >
                  {next ? next.label : "结束"} →
                </Button>
              </div>
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
