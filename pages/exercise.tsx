import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
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
import { useWordData } from '@/hooks/useWordData';
import ReviewReminder from '@/components/ReviewReminder';
import HandwritingInput from '@/components/HandwritingInput';

const DEFAULT_WORD_ID = 1;
const DEFAULT_WORD_NAME = '发生';

type ExerciseType = ExerciseQuestionPayload['type'];
type ExerciseQuestion = ExerciseQuestionPayload;

const Exercise = () => {
  const router = useRouter();
  const isReviewMode = router.query.mode === 'review';
  const isTestMode = router.query.mode === 'test';
  const { userId } = useLearningContext();
  const { session: learningSession, updateSession: updateLearningSession } = useLearningSession();
  const initialWordId = learningSession.wordId ?? DEFAULT_WORD_ID;
  const initialWordLabel = learningSession.word ?? DEFAULT_WORD_NAME;
  const { previous, next, goTo } = useLearningNavigation('exercise');
  const [exerciseQuestions, setExerciseQuestions] = useState<ExerciseQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<ExerciseQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [fillInAnswer, setFillInAnswer] = useState(''); // 填空题答案
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
  
  // Need the full word data to render the detailed feedback (character breakdown, pinyin, etc)
  const { word } = useWordData({ initialWordId: wordId });

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
      setFillInAnswer(''); // 重置填空答案
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
    setFillInAnswer(''); // 重置填空答案
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
    if (!currentQuestion || !questionStartTime) {
      return;
    }

    // 检查用户是否已作答
    const hasAnswer = currentQuestion.type === 'fill_word' ? fillInAnswer.trim() : selectedOption;
    if (!hasAnswer) {
      return;
    }

    trackButtonClick('submit-button', '提交答案', {
      questionId: currentQuestion.id
    });

    submitAnswer();
    const endTime = new Date();
    const currentHesitations = hesitationCount;
    
    // 根据题目类型判断答案是否正确
    let correct = false;
    let userAnswer = '';
    
    if (currentQuestion.type === 'fill_word') {
      userAnswer = fillInAnswer.trim();
      // 填空题：检查答案是否匹配（支持部分匹配和大小写不敏感）
      const correctAnswer = currentQuestion.correctAnswer.toLowerCase();
      const userAnswerLower = userAnswer.toLowerCase();
      correct = correctAnswer === userAnswerLower || 
                correctAnswer.includes(userAnswerLower) || 
                userAnswerLower.includes(correctAnswer);
    } else {
      userAnswer = selectedOption;
      correct = selectedOption === currentQuestion.correctAnswer;
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    const confidenceLevel = currentHesitations === 0 ? 5 : Math.max(1, 5 - currentHesitations);

    await trackExercise({
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      questionContent: currentQuestion.question,
      userAnswer: userAnswer,
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
      selectedAnswer: userAnswer,
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

    if (next) {
      goTo(next.key);
    } else {
      router.push('/learning-dashboard-simple');
    }
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
      case 'choose_word':
        return '易混淆词辨析题';
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-[320px] h-[640px] bg-black rounded-[40px] p-2 shadow-2xl relative">
        {/* Screen */}
        <div className="absolute inset-0 m-2 rounded-[32px] overflow-hidden modern-gradient-bg">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-6 bg-black rounded-b-2xl z-50"></div>
          
          {/* Status Bar */}
          <div className="relative z-40 flex justify-between items-center px-4 pt-1.5 text-gray-800 text-xs h-6">
            <span className="font-medium tracking-wide text-[10px]">6:00</span>
            <div className="flex items-center space-x-1">
              <Signal size={12} strokeWidth={2.5} />
              <Wifi size={12} strokeWidth={2.5} />
              <Battery size={14} strokeWidth={2.5} />
            </div>
          </div>

          {/* Content */}
          <div className="h-full pt-10 pb-6 flex flex-col relative z-20">
            <div className="px-5 mb-2">
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!previous}
                  className="h-8 px-2 bg-transparent hover:bg-white/20 text-indigo-900 rounded-lg text-[10px] shadow-none border border-transparent"
                  onClick={() => {
                    if (!previous) return;
                    trackEvent('nav_previous', 'navigation', { targetModule: previous.key });
                    goTo(previous.key);
                  }}
                >
                  ← {previous ? previous.label : '上一模块'}
                </Button>
                <h1 className="text-[14px] font-bold text-gray-800 tracking-tight">
                  {isTestMode ? 'word test' : (isReviewMode ? 'word review' : 'word exercise')}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!next}
                  className="h-8 px-2 bg-transparent hover:bg-white/20 text-indigo-900 rounded-lg text-[10px] shadow-none border border-transparent"
                  onClick={() => {
                    if (!next) return;
                    trackEvent('nav_next', 'navigation', { targetModule: next.key });
                    goTo(next.key);
                  }}
                >
                  {next ? next.label : '结束'} →
                </Button>
              </div>
            </div>
            
            <div className="flex-1 px-5 flex flex-col justify-between overflow-y-auto custom-scrollbar relative z-20">
                <div className="space-y-3">
                  <ReviewReminder userId={userId} showInline={true} />
                  
                {/* Title and Audio play */}
                <div>
                  <h2 className="text-[16px] font-extrabold text-gray-900 leading-snug mb-3 tracking-wide">
                    {questionIndex + 1}. {currentQuestion.type === 'definition' ? 
                      'Find responding word.' : 
                      currentQuestion.type === 'collocation' ? 'Find right collocation.' : 
                      currentQuestion.type === 'choose_word' ? 'Choose right word.' :
                      'Fill in right word.'
                    }
                  </h2>
                  <div className="mb-6 flex gap-2 items-center">
                    <p className="text-[14px] font-bold text-gray-800">
                      {currentQuestion.type === 'definition' ? 
                        `() ${currentQuestion.question}` : currentQuestion.question}
                    </p>
                    {currentQuestion.type === 'definition' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playAudio('question')}
                        className={`h-7 w-7 p-0 rounded-full shrink-0 ${audioPlaying === 'question' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <Volume2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Option / Input Area */}
                {currentQuestion.type === 'fill_word' ? (
                  <div className="flex flex-col items-center">
                    {!showFeedback ? (
                        <HandwritingInput
                          onSubmit={(text) => {
                            setFillInAnswer(text);
                            setTimeout(() => {
                              if (text.trim()) {
                                const btnSubmit = document.getElementById("hidden-submit-btn");
                                if (btnSubmit) btnSubmit.click();
                              }
                            }, 50);
                          }}
                          expectedAnswer={currentQuestion.correctAnswer}
                          placeholder=""
                          width={260}
                          height={90}
                        />
                    ) : (
                        <div className="w-[260px] h-[90px] bg-gray-200 rounded-sm mb-4 flex items-center justify-center relative">
                           {/* Add drawing traces if needed or just display letter */}
                           <span className="text-2xl font-bold text-gray-800">{fillInAnswer}</span>
                           {!isCorrect && <div className="absolute top-2 right-2 text-red-500 font-bold">✗</div>}
                           {isCorrect && <div className="absolute top-2 right-2 text-[#5bb018] font-bold">✓</div>}
                        </div>
                    )}
                  </div>
                ) : (
                  // Multiple Choice Selection
                  <div className="space-y-3 mt-2">
                    {currentQuestion.options.map((option, index) => {
                      let btnClass = "w-full text-left min-h-[48px] py-3.5 px-5 rounded-[18px] transition-all duration-300 flex items-center focus:outline-none justify-between ";
                      const isSelected = selectedOption === option;
                      
                      if (showFeedback) {
                        if (option === currentQuestion.correctAnswer) {
                          btnClass += "bg-[#5bb018] border-none shadow-[0_4px_14px_0_rgba(91,176,24,0.39)] z-10 text-white font-bold";
                        } else if (isSelected) {
                          btnClass += "bg-rose-50 border-rose-300 shadow-sm text-rose-900 border font-bold";
                        } else {
                          btnClass += "glass-card text-gray-700 border-white/40 border font-bold";
                        }
                      } else {
                        btnClass += isSelected 
                          ? "bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-200 z-10 text-indigo-900 border font-bold" 
                          : "glass-card hover:-translate-y-0.5 text-gray-700 border-white/40 border font-bold";
                      }
                      
                      const letter = String.fromCharCode(65 + index);
                      // Custom rendering if the option is the Chinese Word (like '发生') vs english options
                      const isHanziOption = /[\u4e00-\u9fa5]/.test(option);

                      return (
                        <div key={index}>
                          <button
                            disabled={showFeedback}
                            onClick={() => handleOptionChange(option)}
                            className={btnClass}
                          >
                            <span className="text-[14px] leading-snug break-words flex items-center">
                              <span className={`mr-2.5 ${showFeedback && option === currentQuestion.correctAnswer ? 'text-white/90' : 'text-indigo-400'}`}>{letter}.</span> 
                              <span>{option}</span>
                            </span>
                            {isHanziOption && !showFeedback && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-7 w-7 rounded-full ${isSelected ? 'text-indigo-600 hover:bg-indigo-100' : 'text-indigo-400 hover:text-indigo-600 hover:bg-white/50'}`}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      playAudio(`option-${index}`);
                                  }}
                                >
                                  <Volume2 size={14} />
                                </Button>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* 统一的大画幅知识点嵌入式反馈面板 */}
                {showFeedback && (
                    <div className={`mt-5 px-5 py-5 -mx-5 border-t animate-in fade-in slide-in-from-bottom-2 duration-300 ${isCorrect ? 'bg-[#def6cd] border-[#baecbc]' : 'bg-[#ffe4e6] border-[#fbbabf]'}`}>
                       
                       <div className="flex items-center gap-2 mb-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isCorrect ? 'bg-[#5bb018]' : 'bg-[#ef4444]'}`}>
                            <span className="text-white text-lg font-bold">{isCorrect ? '✓' : '✗'}</span>
                          </div>
                          <span className={`font-extrabold text-[18px] tracking-wide ${isCorrect ? 'text-[#5bb018]' : 'text-[#ef4444]'}`}>
                             {isCorrect ? 'Excellent!' : 'Incorrect'}
                          </span>
                       </div>
                       
                       {!isCorrect && (
                          <div className="text-[#ef4444] font-extrabold text-[14px] mb-3">
                             Correct answer: {currentQuestion.type === 'fill_word' ? currentQuestion.correctAnswer : String.fromCharCode(65 + currentQuestion.options.indexOf(currentQuestion.correctAnswer))}
                          </div>
                       )}

                       {/* 内嵌知识点 */}
                       {word && (
                         <div className="mb-6">
                           {currentQuestion.type === 'fill_word' || currentQuestion.type === 'choose_word' ? (
                              <>
                                 <p className="text-[14px] font-bold text-gray-800 leading-snug mb-1.5">
                                   不愿意发生的事情终于出现了。['发生']
                                 </p>
                                 <p className="text-[13px] font-medium text-gray-700 leading-snug tracking-wider mb-1.5">
                                   不/bù 愿意/yuànyì 发生/fāshēng 的/de 事情/shìqíng 终于/zhōngyú 出现/chūxiàn 了/le 。
                                 </p>
                                 <p className="text-[13px] font-normal text-gray-500 leading-snug">
                                   What I didn't want to happen finally happened.
                                 </p>
                              </>
                           ) : currentQuestion.type === 'collocation' ? (
                              <p className="text-[14px] font-bold text-gray-800 leading-relaxed tracking-wide">
                                 容易（三级） 发生 easy to happen
                              </p>
                           ) : (
                             <p className="text-[14px] font-bold text-gray-800 leading-relaxed tracking-wide">
                               <span className="mr-2 text-indigo-700">{wordLabel}</span> {word.pinyin} <br/>
                               <span className="text-[13px] font-medium text-gray-600 font-mono mt-1 inline-block">{wordDefinition}</span>
                             </p>
                           )}
                         </div>
                       )}

                       {/* 将原本外部底部的CONTINUE按钮嵌入到面板深处 */}
                       <Button 
                         onClick={handleContinue}
                         className={`w-full h-[48px] rounded-[14px] border-none font-extrabold tracking-widest text-[14px] transition-all duration-300 text-white shadow-xl mb-4 ${
                            isCorrect ? 'bg-[#5bb018] hover:bg-[#4d9711] shadow-[#5bb018]/30' : 'bg-[#ef4444] hover:bg-[#dc2626] shadow-[#ef4444]/30'
                         }`}
                       >
                         CONTINUE
                       </Button>
                    </div>
                )}
              </div>
              
              {/* Spacer to guarantee scroll reaching the bottom properly */}
              <div className="h-6 w-full shrink-0"></div>

              {/* Support button element for implicit submits */}
              <button id="hidden-submit-btn" className="hidden" onClick={handleSubmit}></button>

              {/* 仅在未反馈时才在底部显示唯一的SUBMIT类提交按钮 */}
              {!showFeedback && (
                <div className="pt-2 pb-2 w-full z-30 px-5">
                  <Button 
                    onClick={handleSubmit}
                    disabled={currentQuestion.type === 'fill_word' ? !fillInAnswer.trim() : !selectedOption}
                    className="w-full h-[48px] rounded-xl border-none shadow-[0_4px_14px_0_rgba(91,176,24,0.39)] bg-[#5bb018] hover:bg-[#4d9711] disabled:bg-[#a6d189] disabled:shadow-none text-white font-bold tracking-widest text-[14px] transition-all duration-300"
                  >
                    CONTINUE
                  </Button>
                </div>
              )}
            </div>

            {/* Decorative blurs */}
            <div className="absolute top-1/4 -right-12 w-48 h-48 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none z-10"></div>
            <div className="absolute bottom-1/4 -left-12 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none z-10"></div>

            {/* Home Indicator */}
            <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800/20 rounded-full backdrop-blur-xl z-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exercise;
