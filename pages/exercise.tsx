import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Battery, Signal, Wifi, Volume2 } from 'lucide-react';
import { useComprehensiveTracking } from '@/hooks/useTimeTracking';
import { fetchWordExercises } from '@/src/lib/apiClient';
import type { ExerciseQuestionPayload } from '@/src/lib/types';
import { useLearningContext } from '@/src/context/LearningContext';
import { useLearningSession } from '@/src/context/LearningSessionContext';
import { useLearningNavigation, resolveModuleLabel } from '@/src/hooks/useLearningNavigation';

const DEFAULT_WORD_ID = 1;
const DEFAULT_WORD_NAME = '发生';

type ExerciseType = ExerciseQuestionPayload['type'];
type ExerciseQuestion = ExerciseQuestionPayload;

const Exercise = () => {
  const { userId } = useLearningContext();
  const { session: learningSession, updateSession: updateLearningSession } = useLearningSession();
  const initialWordId = learningSession.wordId ?? DEFAULT_WORD_ID;
  const initialWordLabel = learningSession.word ?? DEFAULT_WORD_NAME;
  const { previous, next, goTo } = useLearningNavigation('exercise');
  const [exerciseQuestions, setExerciseQuestions] = useState<ExerciseQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<ExerciseQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [sessionStartTime] = useState(new Date());
  const [wordId, setWordId] = useState(initialWordId);
  const [wordLabel, setWordLabel] = useState(initialWordLabel);
  const [wordDefinition, setWordDefinition] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    pageTracking,
    interactionTracking,
    exerciseTimer,
    trackEvent,
    trackExercise,
    endSession,
    updateConfig,
    sessionInfo
  } = useComprehensiveTracking({
    userId,
    wordId,
    moduleType: 'exercise',
    sessionType: 'exercise'
  });
  const { trackPageEnter, trackPageLeave } = pageTracking;
  const { trackButtonClick, trackSelectionChange, trackAudioPlay } = interactionTracking;
  const {
    startTimer,
    submitAnswer,
    recordHesitation,
    hesitationCount,
    startTime: questionStartTime
  } = exerciseTimer;

  const loadExercises = useCallback(async (targetWordId: number, overrideLabel?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWordExercises(targetWordId, { limit: 5, options: 4 });
      const normalizedQuestions: ExerciseQuestion[] = data.questions;

      if (!normalizedQuestions.length) {
        throw new Error('未返回可用的练习题');
      }

      setWordId(data.wordId);
      const effectiveWordLabel = overrideLabel ?? data.word ?? DEFAULT_WORD_NAME;
      setWordLabel(effectiveWordLabel);
      setWordDefinition(data.definition ?? '');
      setExerciseQuestions(normalizedQuestions);
      setQuestionIndex(0);
      setCurrentQuestion(normalizedQuestions[0]);
      setSelectedOption('');
      setShowFeedback(false);
      setIsCorrect(false);
      updateConfig({ wordId: data.wordId });
      updateLearningSession({ wordId: data.wordId, word: effectiveWordLabel, module: 'exercise' });

      trackEvent('exercise_data_loaded', 'exercise', {
        wordId: data.wordId,
        questionCount: normalizedQuestions.length
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载练习题失败';
      trackEvent('exercise_load_failed', 'exercise', {
        wordId: targetWordId,
        error: message
      });

      if (targetWordId !== DEFAULT_WORD_ID) {
        await loadExercises(DEFAULT_WORD_ID, DEFAULT_WORD_NAME);
        return;
      }

      setExerciseQuestions([]);
      setCurrentQuestion(null);
      setError(message || '加载练习题失败');
    } finally {
      setLoading(false);
    }
  }, [trackEvent, updateConfig, updateLearningSession]);

  const desiredWordId = useMemo(() => learningSession.wordId ?? DEFAULT_WORD_ID, [learningSession.wordId]);
  const desiredWordLabel = useMemo(() => learningSession.word ?? DEFAULT_WORD_NAME, [learningSession.word]);

  useEffect(() => {
    setWordLabel(desiredWordLabel);
    if (desiredWordId !== wordId || exerciseQuestions.length === 0) {
      loadExercises(desiredWordId, desiredWordLabel);
    }
  }, [desiredWordId, desiredWordLabel, wordId, exerciseQuestions.length, loadExercises]);

  useEffect(() => {
    updateConfig({ userId });
  }, [updateConfig, userId]);

  useEffect(() => {
    if (!exerciseQuestions.length) {
      return;
    }

    trackPageEnter('exercise');
    trackEvent('exercise_session_start', 'exercise', {
      wordId,
      word: wordLabel,
      totalQuestions: exerciseQuestions.length,
      startTime: sessionStartTime.toISOString()
    });

    return () => {
      trackPageLeave('exercise');
    };
  }, [exerciseQuestions.length, trackEvent, trackPageEnter, trackPageLeave, sessionStartTime, wordId, wordLabel]);

  useEffect(() => {
    if (!exerciseQuestions.length) {
      return;
    }

    const nextQuestion = exerciseQuestions[questionIndex];
    if (!nextQuestion) {
      return;
    }

    setCurrentQuestion(nextQuestion);
    setSelectedOption('');
    setShowFeedback(false);
    setIsCorrect(false);
    setAudioPlaying(null);
    startTimer();

    trackEvent('question_display', 'exercise', {
      questionId: nextQuestion.id,
      questionType: nextQuestion.type,
      questionIndex: questionIndex + 1,
      totalQuestions: exerciseQuestions.length
    });
  }, [exerciseQuestions, questionIndex, startTimer, trackEvent]);

  const playAudio = (id: string) => {
    setAudioPlaying(id);
    trackAudioPlay(id, 'exercise-audio');
    trackEvent('audio_play', id, {
      questionId: currentQuestion?.id,
      questionType: currentQuestion?.type,
      audioType: id
    });

    setTimeout(() => setAudioPlaying(null), 1000);
  };

  const handleOptionChange = (value: string) => {
    if (!currentQuestion) {
      return;
    }

    if (selectedOption && selectedOption !== value) {
      const nextHesitation = hesitationCount + 1;
      recordHesitation();
      trackEvent('answer_change', 'option-change', {
        questionId: currentQuestion.id,
        from: selectedOption,
        to: value,
        hesitationCount: nextHesitation
      });
    }

    trackSelectionChange('exercise-option', selectedOption, value);
    setSelectedOption(value);
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !selectedOption || !questionStartTime) {
      return;
    }

    trackButtonClick('submit-button', '提交答案', {
      questionId: currentQuestion.id
    });

    submitAnswer();
    const endTime = new Date();
    const currentHesitations = hesitationCount;
    const correct = selectedOption === currentQuestion.correctAnswer;

    setIsCorrect(correct);
    setShowFeedback(true);

    const confidenceLevel = currentHesitations === 0 ? 5 : Math.max(1, 5 - currentHesitations);

    await trackExercise({
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      questionContent: currentQuestion.question,
      userAnswer: selectedOption,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: correct,
      startTime: questionStartTime,
      endTime,
      hesitationCount: currentHesitations,
      confidenceLevel
    });

    const responseTime = (endTime.getTime() - questionStartTime.getTime()) / 1000;

    trackEvent('exercise_submit', 'submit-button', {
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      isCorrect: correct,
      responseTime,
      hesitationCount: currentHesitations,
      selectedAnswer: selectedOption,
      correctAnswer: currentQuestion.correctAnswer
    });
  };

  const handleContinue = async () => {
    trackButtonClick('continue-button', '继续', {
      questionIndex: questionIndex + 1,
      totalQuestions: exerciseQuestions.length
    });

    if (questionIndex < exerciseQuestions.length - 1) {
      trackEvent('next_question', 'continue-button', {
        completedQuestionIndex: questionIndex + 1,
        remainingQuestions: exerciseQuestions.length - questionIndex - 1
      });
      setQuestionIndex(questionIndex + 1);
      return;
    }

    trackEvent('exercise_complete', 'exercise-end', {
      totalQuestions: exerciseQuestions.length,
      totalTime: Date.now() - sessionStartTime.getTime(),
      sessionId: sessionInfo?.sessionId
    });

    await endSession(true);

    alert('练习完成！');
  };

  const handleRetry = () => {
    trackButtonClick('retry-button', '重新加载');
    loadExercises(wordId, wordLabel);
  };

  const getQuestionTypeTitle = (type: ExerciseType) => {
    switch (type) {
      case 'definition':
        return '词汇释义题';
      case 'collocation':
        return '词汇搭配题';
      case 'fill_word':
        return '词汇填词题';
      default:
        return '练习题';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">加载练习题中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 space-y-4">
        <p className="text-red-600">❌ {error}</p>
        <Button onClick={handleRetry}>重新加载</Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-2">
          <p className="text-gray-600">暂无可用练习题</p>
          <Button onClick={handleRetry}>尝试重新获取</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] overflow-hidden shadow-xl relative">
        {/* iPhone frame */}
        <div className="absolute inset-0 bg-black rounded-[40px]">
          {/* Screen */}
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
              <div className="bg-orange-200 p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!previous}
                    onClick={() => {
                      if (!previous) return;
                      trackEvent('nav_previous', 'navigation', { targetModule: previous.key });
                      goTo(previous.key);
                    }}
                  >
                    ← {previous ? previous.label : '上一模块'}
                  </Button>
                  <h1 className="text-lg font-semibold">词汇练习</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!next}
                    onClick={() => {
                      if (!next) return;
                      trackEvent('nav_next', 'navigation', { targetModule: next.key });
                      goTo(next.key);
                    }}
                  >
                    {next ? next.label : '结束'} →
                  </Button>
                </div>
                <p className="text-xs text-gray-600 truncate">当前词汇：{wordLabel}</p>
                <p className="text-[11px] text-gray-600">
                  模块：{resolveModuleLabel('exercise')} · {getQuestionTypeTitle(currentQuestion.type)} ({questionIndex + 1}/{exerciseQuestions.length})
                </p>
                <p className="text-[11px] text-gray-500 truncate">{wordDefinition}</p>
              </div>
              
              <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3">
                  {/* 题目区域 */}
                  <div className="bg-white p-3 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-base font-bold">
                        {currentQuestion.type === 'definition' ? 
                          'Choose the word that matches this definition:' : 
                          'Choose the correct word:'
                        }
                      </h2>
                      {currentQuestion.type === 'definition' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => playAudio('question')}
                          className={audioPlaying === 'question' ? 'text-blue-500' : 'text-gray-500'}
                        >
                          <Volume2 size={16} />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-3">{currentQuestion.question}</p>
                  </div>

                  {/* 选项区域 */}
                  <div className="bg-white p-3 rounded-lg shadow">
                    <RadioGroup value={selectedOption} onValueChange={handleOptionChange} className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center p-2 rounded border hover:bg-gray-50">
                          <RadioGroupItem value={option} id={`option-${index}`} className="mr-3" />
                          <Label htmlFor={`option-${index}`} className="text-sm flex-1 cursor-pointer">
                            {String.fromCharCode(65 + index)}. {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* 反馈区域 */}
                  {showFeedback && (
                    <div className={`p-3 rounded-lg shadow ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                      <h3 className="font-semibold mb-2">
                        {isCorrect ? '回答正确！✓' : '回答错误 ✗'}
                      </h3>
                      {!isCorrect && currentQuestion.feedback && (
                        <div className="text-sm">
                          <p className="font-medium mb-1">知识点:</p>
                          <pre className="whitespace-pre-wrap text-xs">{currentQuestion.feedback}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 底部按钮 */}
                {!showFeedback ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 text-base rounded-lg mt-3"
                  >
                    提交答案
                  </Button>
                ) : (
                  <Button 
                    onClick={handleContinue}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-base rounded-lg mt-3"
                  >
                    继续
                  </Button>
                )}
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

export default Exercise;
