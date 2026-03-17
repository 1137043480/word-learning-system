import React, { useState, useEffect, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi } from 'lucide-react';
import { useRouter } from 'next/router';
import { useComprehensiveTracking } from '@/hooks/useTimeTracking';
import { buildApiUrl } from '@/src/lib/apiClient';
import { useLearningContext } from '@/src/context/LearningContext';
import { useLearningSession } from '@/src/context/LearningSessionContext';

const DEFAULT_WORD_ID = 1;
const DEFAULT_WORD_NAME = '发生';

const moduleRouteMap: Record<string, { path: string; label: string }> = {
  character: { path: '/character-learning', label: '字学习' },
  word: { path: '/word-learning', label: '词学习' },
  word_learning: { path: '/word-learning', label: '词学习' },
  collocation: { path: '/collocation-learning', label: '搭配学习' },
  collocation_learning: { path: '/collocation-learning', label: '搭配学习' },
  sentence: { path: '/sentence-learning', label: '例句学习' },
  sentence_learning: { path: '/sentence-learning', label: '例句学习' },
  exercise: { path: '/exercise', label: '练习' },
  review: { path: '/exercise', label: '复习' },
  urgent_review: { path: '/exercise', label: '紧急复习' },
  scheduled_review: { path: '/exercise', label: '计划复习' },
  explore_learning: { path: '/word-learning', label: '探索学习' },
  new_learning: { path: '/word-learning', label: '新词学习' },
};

interface RecommendationResolution {
  path: string;
  label: string;
  moduleKey: string;
}

const resolveModuleRoute = (moduleName: string | undefined, fallbackPath: string, fallbackLabel: string): RecommendationResolution => {
  const normalized = (moduleName || '').toLowerCase();
  const match = moduleRouteMap[normalized];
  if (match) {
    return { path: match.path, label: match.label, moduleKey: normalized };
  }
  return { path: fallbackPath, label: fallbackLabel, moduleKey: 'word' };
};

export default function Component() {
  const { session: learningSession, updateSession: updateLearningSession } = useLearningSession();

  const [selectedOption, setSelectedOption] = useState(learningSession.vksLevel ?? '');
  const [pageStartTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const router = useRouter();
  const { userId, availableUsers } = useLearningContext();

  const currentUser = useMemo(() => availableUsers.find(user => user.userId === userId), [availableUsers, userId]);

  const activeModuleLabel = useMemo(() => {
    if (!learningSession.module) {
      return null;
    }
    const key = learningSession.module.toLowerCase();
    return moduleRouteMap[key]?.label ?? learningSession.module;
  }, [learningSession.module]);

  const lastModuleLabel = useMemo(() => {
    const moduleKey = currentUser?.lastSession?.moduleType?.toLowerCase();
    if (!moduleKey) {
      return null;
    }
    return moduleRouteMap[moduleKey]?.label ?? currentUser?.lastSession?.moduleType;
  }, [currentUser]);

  const tracking = useComprehensiveTracking({
    userId,
    wordId: DEFAULT_WORD_ID,
    moduleType: 'entrance',
    sessionType: 'learning'
  });

  const { pageTracking, interactionTracking, trackEvent, updateConfig, endSession } = tracking;
  const { trackPageEnter, trackPageLeave, trackNavigation } = pageTracking;
  const { trackSelectionChange, trackButtonClick } = interactionTracking;

  useEffect(() => {
    setSelectedOption(learningSession.vksLevel ?? '');
  }, [learningSession.vksLevel]);

  useEffect(() => {
    updateConfig({ userId });
  }, [userId, updateConfig]);

  useEffect(() => {
    trackPageEnter('word-learning-entrance');
    trackEvent('vks_test_start', 'entrance', {
      word: DEFAULT_WORD_NAME,
      startTime: pageStartTime.toISOString(),
      userId
    });

    return () => {
      trackPageLeave('word-learning-entrance');
    };
  }, [trackEvent, trackPageEnter, trackPageLeave, userId, pageStartTime]);

  const handleOptionChange = (value: string) => {
    trackSelectionChange('vks-level', selectedOption, value);

    if (selectedOption && selectedOption !== value) {
      trackEvent('option_change', 'vks-radio', {
        from: selectedOption,
        to: value,
        hesitation: true
      });
    }

    setSelectedOption(value);
    updateLearningSession({ vksLevel: value });
    setRecommendationMessage(null);
    setRecommendationError(null);
  };

  const learningOptions = [
    { value: 'A', text: 'I have never seen this word.', path: '/character-learning', label: '字学习' },
    { value: 'B', text: "I don't know what it means.", path: '/word-learning', label: '词学习' },
    { value: 'C', text: "I know its meaning, but I don't know its collocations.", path: '/collocation-learning', label: '搭配学习' },
    { value: 'D', text: "I know its collocation, but I don't know how to use it in a sentence.", path: '/sentence-learning', label: '例句学习' },
    { value: 'E', text: 'I can use it in a sentence.', path: '/exercise', label: '练习' }
  ];

  const handleContinue = async () => {
    trackButtonClick('continue-button', 'CONTINUE', {
      selectedOption,
      timeToDecision: Date.now() - pageStartTime.getTime()
    });

    if (!selectedOption) {
      trackEvent('validation_error', 'continue-button', {
        error: 'no_option_selected'
      });
      alert('请先选择一个选项');
      return;
    }

    const selectedLearning = learningOptions.find(option => option.value === selectedOption);
    if (!selectedLearning) {
      alert('无法识别当前选择，请重试');
      return;
    }

    setIsSubmitting(true);
    setRecommendationError(null);

    let resolvedWordId = DEFAULT_WORD_ID;
    let resolvedWord = DEFAULT_WORD_NAME;
    let resolvedModule = resolveModuleRoute(undefined, selectedLearning.path, selectedLearning.label);

    const context = {
      vks_level: selectedOption,
      selectedPath: selectedLearning.path,
      timestamp: new Date().toISOString()
    };

    try {
      try {
        const url = `${buildApiUrl(`/api/adaptive/recommendation/${userId}`)}?context=${encodeURIComponent(JSON.stringify(context))}`;
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-cache'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            resolvedWordId = data.word_id ?? data.wordId ?? DEFAULT_WORD_ID;
            resolvedWord = data.word ?? resolvedWord;
            resolvedModule = resolveModuleRoute(data.recommended_module ?? data.recommendedModule ?? data.type, selectedLearning.path, selectedLearning.label);

            trackEvent('recommendation_received', 'entrance', {
              recommendationId: data.recommendationId,
              type: data.type,
              recommendedModule: resolvedModule.moduleKey,
              wordId: resolvedWordId,
              word: resolvedWord,
              reason: data.reason,
              confidence: data.confidence
            });

            setRecommendationMessage(`推荐模块：${resolvedModule.label}（词汇：${resolvedWord}）`);
          } else {
            const message = result.error || '推荐服务未返回结果，使用默认路径';
            setRecommendationError(message);
            trackEvent('recommendation_failed', 'entrance', {
              error: message,
              response: result
            });
          }
        } else {
          const message = `推荐接口返回错误：HTTP ${response.status}`;
          setRecommendationError(message);
          trackEvent('recommendation_failed', 'entrance', {
            error: message
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setRecommendationError(`推荐接口调用失败：${message}`);
        trackEvent('recommendation_failed', 'entrance', {
          error: message
        });
      }

      trackEvent('vks_test_complete', 'entrance', {
        selectedLevel: selectedOption,
        selectedPath: selectedLearning.path,
        resolvedPath: resolvedModule.path,
        resolvedModule: resolvedModule.moduleKey,
        decisionTime: Date.now() - pageStartTime.getTime(),
        totalTime: Date.now() - pageStartTime.getTime(),
        userId
      });

      updateConfig({ wordId: resolvedWordId, moduleType: resolvedModule.moduleKey });

    updateLearningSession({
      wordId: resolvedWordId,
      word: resolvedWord,
      module: resolvedModule.moduleKey,
      vksLevel: selectedOption
    });

      await endSession(true);
      trackNavigation('word-learning-entrance', resolvedModule.path);
      router.push(resolvedModule.path);
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="px-5 mb-4">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Word Learning</h1>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  {currentUser?.username ? `${currentUser.username} (${userId})` : userId}
                </p>
                <div className="text-[10px] text-gray-500 mt-2 space-y-1 bg-white/40 p-2.5 rounded-xl border border-white/60">
                  <div className="flex justify-between items-center">
                    <span>词汇量: {currentUser?.wordsStudied ?? 0}</span>
                    {learningSession.word && (
                      <span className="text-indigo-600 font-semibold">{activeModuleLabel || '练习'} · {learningSession.word}</span>
                    )}
                  </div>
                  {recommendationMessage && (
                    <p className="text-emerald-600 font-semibold mt-1">
                      💡 {recommendationMessage}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push('/learning-dashboard')}
                    className="flex-1 bg-white/60 text-indigo-700 hover:bg-white/80 text-[10px] h-8 rounded-lg shadow-sm border border-white/50"
                  >
                    Dashboard
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push('/today-review')}
                    className="flex-1 bg-white/60 text-rose-600 hover:bg-white/80 text-[10px] h-8 rounded-lg shadow-sm border border-white/50"
                  >
                    今日复习
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 px-5 pb-5 flex flex-col justify-between overflow-y-auto custom-scrollbar relative z-20">
                <div className="space-y-4">
                  <div className="glass-panel p-4 rounded-2xl">
                    <p className="text-[14px] font-bold text-gray-800 mb-1 leading-snug">How about you know {DEFAULT_WORD_NAME}?</p>
                    <p className="text-[12px] text-gray-500 font-medium">Please choose one choice below and continue to next page.</p>
                  </div>
                  
                  <RadioGroup value={selectedOption} onValueChange={handleOptionChange} className="space-y-2.5">
                    {learningOptions.map((option) => (
                      <div 
                        key={option.value} 
                        onClick={() => handleOptionChange(option.value)}
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                          selectedOption === option.value 
                            ? 'bg-indigo-50/80 border-indigo-200 shadow-md transform scale-[1.02]' 
                            : 'glass-card'
                        }`}
                      >
                        <RadioGroupItem 
                          value={option.value} 
                          id={option.value} 
                          className={`mr-3 border-gray-300 ${selectedOption === option.value ? 'border-indigo-500 text-indigo-600' : ''}`} 
                        />
                        <Label htmlFor={option.value} className={`text-[11px] flex-1 cursor-pointer font-medium leading-relaxed ${
                          selectedOption === option.value ? 'text-indigo-900' : 'text-gray-700'
                        }`}>
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {recommendationError && (
                    <div className="p-3 text-[10px] text-rose-600 bg-rose-50/80 backdrop-blur-sm rounded-xl border border-rose-100">
                      {recommendationError}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={handleContinue}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 disabled:from-gray-300 disabled:to-gray-300 hover:shadow-lg disabled:shadow-none text-white py-6 text-sm font-bold rounded-2xl mt-4 border-none transition-all duration-300"
                >
                  <span className="relative z-10 tracking-wider text-glow">{isSubmitting ? '处理中...' : 'CONTINUE'}</span>
                  {!(!selectedOption || isSubmitting) && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300"></div>
                  )}
                </Button>
              </div>
            </div>

            {/* Decorative blurs */}
            <div className="absolute top-20 -right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none z-10"></div>
            <div className="absolute bottom-20 -left-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none z-10"></div>

          </div>
        </div>
      </div>
  );
}

