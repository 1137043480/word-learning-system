import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Battery, Signal, Wifi } from 'lucide-react';
import { useRouter } from 'next/router';
import { useComprehensiveTracking } from '@/hooks/useTimeTracking';
import { buildApiUrl } from '@/src/lib/apiClient';

const DEFAULT_WORD_ID = 1;
const DEFAULT_WORD_NAME = '发生';
const USER_ID = 'user123';

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
  const [selectedOption, setSelectedOption] = useState('');
  const [pageStartTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const router = useRouter();

  const tracking = useComprehensiveTracking({
    userId: USER_ID,
    wordId: DEFAULT_WORD_ID,
    moduleType: 'entrance',
    sessionType: 'learning'
  });

  useEffect(() => {
    tracking.pageTracking.trackPageEnter('word-learning-entrance');
    tracking.trackEvent('vks_test_start', 'entrance', {
      word: DEFAULT_WORD_NAME,
      startTime: pageStartTime.toISOString()
    });

    return () => {
      tracking.pageTracking.trackPageLeave('word-learning-entrance');
    };
  }, []);

  const handleOptionChange = (value: string) => {
    tracking.interactionTracking.trackSelectionChange('vks-level', selectedOption, value);

    if (selectedOption && selectedOption !== value) {
      tracking.trackEvent('option_change', 'vks-radio', {
        from: selectedOption,
        to: value,
        hesitation: true
      });
    }

    setSelectedOption(value);
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
    tracking.interactionTracking.trackButtonClick('continue-button', 'CONTINUE', {
      selectedOption,
      timeToDecision: Date.now() - pageStartTime.getTime()
    });

    if (!selectedOption) {
      tracking.trackEvent('validation_error', 'continue-button', {
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
      const url = `${buildApiUrl(`/api/adaptive/recommendation/${USER_ID}`)}?context=${encodeURIComponent(JSON.stringify(context))}`;
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

          tracking.trackEvent('recommendation_received', 'entrance', {
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
          tracking.trackEvent('recommendation_failed', 'entrance', {
            error: message,
            response: result
          });
        }
      } else {
        const message = `推荐接口返回错误：HTTP ${response.status}`;
        setRecommendationError(message);
        tracking.trackEvent('recommendation_failed', 'entrance', {
          error: message
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRecommendationError(`推荐接口调用失败：${message}`);
      tracking.trackEvent('recommendation_failed', 'entrance', {
        error: message
      });
    }

    tracking.trackEvent('vks_test_complete', 'entrance', {
      selectedLevel: selectedOption,
      selectedPath: selectedLearning.path,
      resolvedPath: resolvedModule.path,
      resolvedModule: resolvedModule.moduleKey,
      decisionTime: Date.now() - pageStartTime.getTime(),
      totalTime: Date.now() - pageStartTime.getTime()
    });

    tracking.updateConfig({ wordId: resolvedWordId, moduleType: resolvedModule.moduleKey });

    localStorage.setItem('learningLevel', selectedOption);
    localStorage.setItem('currentWord', resolvedWord);
    localStorage.setItem('currentWordId', String(resolvedWordId));

    await tracking.endSession(true);
    tracking.pageTracking.trackNavigation('word-learning-entrance', resolvedModule.path);

    setIsSubmitting(false);
    router.push(resolvedModule.path);
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
                <h1 className="text-lg font-semibold">word learning</h1>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg shadow">
                    <p className="text-base mb-2">How about you know {DEFAULT_WORD_NAME}?</p>
                    <p className="text-xs text-gray-600">Please choose one choice below and continue to next page.</p>
                    {selectedOption && (
                      <p className="text-xs text-green-600 mt-1">已选择: {selectedOption}</p>
                    )}
                  </div>
                  <RadioGroup value={selectedOption} onValueChange={handleOptionChange} className="space-y-2">
                    {learningOptions.map((option) => (
                      <div key={option.value} className="flex items-center bg-white p-2.5 rounded-lg shadow hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value={option.value} id={option.value} className="mr-2" />
                        <Label htmlFor={option.value} className="text-xs flex-1 cursor-pointer">{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {recommendationMessage && (
                    <div className="p-2 text-xs text-green-600 bg-green-50 rounded">
                      {recommendationMessage}
                    </div>
                  )}
                  {recommendationError && (
                    <div className="p-2 text-xs text-red-600 bg-red-50 rounded">
                      {recommendationError}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 text-base rounded-lg mt-3"
                >
                  {isSubmitting ? '处理中...' : 'CONTINUE'}
                </Button>
              </div>
            </div>

            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
