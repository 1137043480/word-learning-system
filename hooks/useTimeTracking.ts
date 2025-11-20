/**
 * React时间追踪Hooks
 * 封装TimeTracker类为React Hook，提供便捷的时间追踪功能
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { TimeTracker, TimeTrackingConfig, ExerciseData } from '@/utils/timeTracker';

export interface UseTimeTrackingReturn {
  isTracking: boolean;
  sessionInfo: any;
  trackEvent: (eventType: string, target?: string, data?: any) => void;
  trackExercise: (exerciseData: ExerciseData) => Promise<void>;
  endSession: (completed?: boolean) => Promise<void>;
  updateConfig: (newConfig: Partial<TimeTrackingConfig>) => void;
}

/**
 * 主要的时间追踪Hook
 */
export const useTimeTracking = (config: TimeTrackingConfig): UseTimeTrackingReturn => {
  const trackerRef = useRef<TimeTracker | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    // 开始追踪
    trackerRef.current = new TimeTracker(config);
    setIsTracking(true);

    // 定期更新会话信息
    const interval = setInterval(() => {
      if (trackerRef.current) {
        setSessionInfo(trackerRef.current.getSessionInfo());
      }
    }, 5000); // 每5秒更新一次

    return () => {
      // 组件卸载时结束追踪
      if (trackerRef.current) {
        trackerRef.current.endSession(true);
        trackerRef.current = null;
      }
      setIsTracking(false);
      clearInterval(interval);
    };
  }, [config.userId, config.wordId, config.moduleType, config.sessionType]);

  const trackEvent = useCallback((eventType: string, target?: string, data?: any) => {
    if (trackerRef.current) {
      trackerRef.current.trackEvent(eventType, target, data);
    }
  }, []);

  const trackExercise = useCallback(async (exerciseData: ExerciseData) => {
    if (trackerRef.current) {
      await trackerRef.current.trackExercise(exerciseData);
    }
  }, []);

  const endSession = useCallback(async (completed: boolean = true) => {
    if (trackerRef.current) {
      await trackerRef.current.endSession(completed);
      setIsTracking(false);
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<TimeTrackingConfig>) => {
    if (trackerRef.current) {
      trackerRef.current.updateConfig(newConfig);
    }
  }, []);

  return {
    isTracking,
    sessionInfo,
    trackEvent,
    trackExercise,
    endSession,
    updateConfig
  };
};

/**
 * 专门用于练习题计时的Hook
 */
export interface UseExerciseTimerReturn {
  startTimer: () => void;
  submitAnswer: () => void;
  recordHesitation: () => void;
  getResponseTime: () => number;
  hesitationCount: number;
  isAnswered: boolean;
  startTime: Date | null;
  endTime: Date | null;
  getCurrentTimer: () => number; // 当前计时器（秒）
}

export const useExerciseTimer = (): UseExerciseTimerReturn => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentTimer, setCurrentTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    setEndTime(null);
    setHesitationCount(0);
    setIsAnswered(false);
    setCurrentTimer(0);

    // 启动实时计时器
    timerRef.current = setInterval(() => {
      setCurrentTimer(prev => prev + 0.1);
    }, 100);
  }, []);

  const recordHesitation = useCallback(() => {
    setHesitationCount(prev => prev + 1);
  }, []);

  const submitAnswer = useCallback(() => {
    if (!isAnswered && startTime) {
      const now = new Date();
      setEndTime(now);
      setIsAnswered(true);
      
      // 停止计时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isAnswered, startTime]);

  const getResponseTime = useCallback((): number => {
    if (startTime && endTime) {
      return (endTime.getTime() - startTime.getTime()) / 1000;
    }
    return 0;
  }, [startTime, endTime]);

  const getCurrentTimer = useCallback((): number => {
    return Math.round(currentTimer * 10) / 10; // 保留1位小数
  }, [currentTimer]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    startTimer,
    submitAnswer,
    recordHesitation,
    getResponseTime,
    hesitationCount,
    isAnswered,
    startTime,
    endTime,
    getCurrentTimer
  };
};

/**
 * 用于页面导航时的时间追踪Hook
 */
export interface UsePageTrackingReturn {
  trackPageEnter: (pageName: string) => void;
  trackPageLeave: (pageName: string) => void;
  trackNavigation: (from: string, to: string) => void;
}

export const usePageTracking = (timeTracker?: UseTimeTrackingReturn): UsePageTrackingReturn => {
  const trackPageEnter = useCallback((pageName: string) => {
    if (timeTracker) {
      timeTracker.trackEvent('page_enter', 'navigation', {
        pageName,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.pathname : undefined
      });
    }
  }, [timeTracker]);

  const trackPageLeave = useCallback((pageName: string) => {
    if (timeTracker) {
      timeTracker.trackEvent('page_leave', 'navigation', {
        pageName,
        timestamp: new Date().toISOString()
      });
    }
  }, [timeTracker]);

  const trackNavigation = useCallback((from: string, to: string) => {
    if (timeTracker) {
      timeTracker.trackEvent('navigation', 'router', {
        from,
        to,
        timestamp: new Date().toISOString()
      });
    }
  }, [timeTracker]);

  return {
    trackPageEnter,
    trackPageLeave,
    trackNavigation
  };
};

/**
 * 用于按钮点击等交互事件的Hook
 */
export interface UseInteractionTrackingReturn {
  trackButtonClick: (buttonId: string, buttonText?: string, additionalData?: any) => void;
  trackInputChange: (inputId: string, inputType: string, value?: any) => void;
  trackAudioPlay: (audioId: string, audioType: string) => void;
  trackSelectionChange: (selectionType: string, oldValue?: any, newValue?: any) => void;
}

export const useInteractionTracking = (timeTracker?: UseTimeTrackingReturn): UseInteractionTrackingReturn => {
  const trackButtonClick = useCallback((buttonId: string, buttonText?: string, additionalData?: any) => {
    if (timeTracker) {
      timeTracker.trackEvent('button_click', buttonId, {
        buttonText,
        timestamp: new Date().toISOString(),
        ...additionalData
      });
    }
  }, [timeTracker]);

  const trackInputChange = useCallback((inputId: string, inputType: string, value?: any) => {
    if (timeTracker) {
      timeTracker.trackEvent('input_change', inputId, {
        inputType,
        value: typeof value === 'string' ? value.substring(0, 100) : value, // 限制长度
        timestamp: new Date().toISOString()
      });
    }
  }, [timeTracker]);

  const trackAudioPlay = useCallback((audioId: string, audioType: string) => {
    if (timeTracker) {
      timeTracker.trackEvent('audio_play', audioId, {
        audioType,
        timestamp: new Date().toISOString()
      });
    }
  }, [timeTracker]);

  const trackSelectionChange = useCallback((selectionType: string, oldValue?: any, newValue?: any) => {
    if (timeTracker) {
      timeTracker.trackEvent('selection_change', selectionType, {
        oldValue,
        newValue,
        timestamp: new Date().toISOString()
      });
    }
  }, [timeTracker]);

  return {
    trackButtonClick,
    trackInputChange,
    trackAudioPlay,
    trackSelectionChange
  };
};

/**
 * 综合Hook - 包含所有时间追踪功能
 */
export interface UseComprehensiveTrackingReturn extends UseTimeTrackingReturn {
  pageTracking: UsePageTrackingReturn;
  interactionTracking: UseInteractionTrackingReturn;
  exerciseTimer: UseExerciseTimerReturn;
}

export const useComprehensiveTracking = (config: TimeTrackingConfig): UseComprehensiveTrackingReturn => {
  const timeTracking = useTimeTracking(config);
  const pageTracking = usePageTracking(timeTracking);
  const interactionTracking = useInteractionTracking(timeTracking);
  const exerciseTimer = useExerciseTimer();

  return {
    ...timeTracking,
    pageTracking,
    interactionTracking,
    exerciseTimer
  };
};

export default useTimeTracking;
