/**
 * 学习时间追踪工具类
 * 用于记录用户学习行为和时间数据，支持自适应学习算法
 */
import { getApiBaseUrl } from '@/src/lib/apiClient';

export interface TimeTrackingConfig {
  userId: string;
  wordId: number;
  moduleType: string; // 'entrance', 'character', 'word', 'collocation', 'sentence', 'exercise'
  sessionType: string; // 'learning', 'exercise', 'review', 'test'
}

export interface LearningEvent {
  type: string;
  target?: string;
  data?: any;
  timestamp: Date;
  pageUrl?: string;
}

export interface ExerciseData {
  questionId: string;
  questionType: string;
  questionContent?: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  startTime: Date;
  endTime: Date;
  hesitationCount?: number;
  confidenceLevel?: number;
}

export class TimeTracker {
  private sessionId: string;
  private startTime: Date;
  private activeTime: number = 0;
  private lastActiveTime: Date;
  private isActive: boolean = true;
  private events: LearningEvent[] = [];
  private config: TimeTrackingConfig;
  private apiBaseUrl: string;
  private batchEventTimer: NodeJS.Timeout | null = null;

  constructor(config: TimeTrackingConfig, apiBaseUrl: string = getApiBaseUrl()) {
    this.config = config;
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.lastActiveTime = new Date();
    
    this.initializeTracking();
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.config.userId}_${this.config.wordId}_${timestamp}_${random}`;
  }

  private initializeTracking() {
    // 页面可见性监听
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      // 用户活动监听
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, this.handleUserActivity.bind(this), true);
      });
      
      // 页面卸载监听
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    }
    
    // 开始学习会话
    this.startSession();
    
    // 设置批量事件发送定时器
    this.batchEventTimer = setInterval(() => {
      this.sendBatchEvents();
    }, 30000); // 每30秒发送一次批量事件
  }

  private async startSession() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/learning/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.config.userId,
          wordId: this.config.wordId,
          sessionType: this.config.sessionType,
          moduleType: this.config.moduleType,
          startTime: this.startTime.toISOString(),
          deviceType: this.getDeviceType()
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Time tracking session started:', this.sessionId);
        this.trackEvent('session_start', 'timetracker', {
          config: this.config,
          deviceType: this.getDeviceType()
        });
      } else {
        console.error('❌ Failed to start session:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to start session:', error);
    }
  }

  /**
   * 记录学习事件
   */
  public trackEvent(eventType: string, target?: string, data?: any) {
    const event: LearningEvent = {
      type: eventType,
      target,
      data,
      timestamp: new Date(),
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined
    };
    
    this.events.push(event);
    
    console.log('📊 Event tracked:', eventType, target, data);
    
    // 立即发送重要事件
    if (['exercise_submit', 'module_complete', 'error', 'session_end'].includes(eventType)) {
      this.sendEvent(event);
    }
  }

  /**
   * 记录练习数据
   */
  public async trackExercise(exerciseData: ExerciseData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/learning/exercise/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          questionId: exerciseData.questionId,
          questionType: exerciseData.questionType,
          questionContent: exerciseData.questionContent,
          userAnswer: exerciseData.userAnswer,
          correctAnswer: exerciseData.correctAnswer,
          isCorrect: exerciseData.isCorrect,
          startTime: exerciseData.startTime.toISOString(),
          endTime: exerciseData.endTime.toISOString(),
          responseTimeSeconds: (exerciseData.endTime.getTime() - exerciseData.startTime.getTime()) / 1000,
          hesitationCount: exerciseData.hesitationCount || 0,
          confidenceLevel: exerciseData.confidenceLevel
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Exercise tracked:', exerciseData.questionId);
        this.trackEvent('exercise_recorded', 'exercise', {
          questionId: exerciseData.questionId,
          isCorrect: exerciseData.isCorrect,
          responseTime: (exerciseData.endTime.getTime() - exerciseData.startTime.getTime()) / 1000
        });
      } else {
        console.error('❌ Failed to track exercise:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to track exercise:', error);
    }
  }

  private handleVisibilityChange() {
    if (typeof document !== 'undefined') {
      if (document.hidden) {
        this.isActive = false;
        this.trackEvent('page_blur', 'document');
      } else {
        this.isActive = true;
        this.lastActiveTime = new Date();
        this.trackEvent('page_focus', 'document');
      }
    }
  }

  private handleUserActivity() {
    if (this.isActive) {
      const now = new Date();
      this.activeTime += now.getTime() - this.lastActiveTime.getTime();
      this.lastActiveTime = now;
    }
  }

  private handlePageUnload() {
    this.endSession(false); // 页面卸载时标记为未完成
  }

  /**
   * 结束学习会话
   */
  public async endSession(completed: boolean = true) {
    const endTime = new Date();
    const totalDuration = Math.round((endTime.getTime() - this.startTime.getTime()) / 1000);
    const activeDuration = Math.round(this.activeTime / 1000);

    this.trackEvent('session_end', 'timetracker', {
      completed,
      totalDuration,
      activeDuration,
      eventCount: this.events.length
    });

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/learning/session/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          endTime: endTime.toISOString(),
          durationSeconds: totalDuration,
          activeTimeSeconds: activeDuration,
          completed,
          eventCount: this.events.length
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Session ended successfully:', this.sessionId);
      } else {
        console.error('❌ Failed to end session:', result.error);
      }

      // 发送剩余的批量事件
      await this.sendBatchEvents();

    } catch (error) {
      console.error('❌ Failed to end session:', error);
    }

    // 清理定时器
    if (this.batchEventTimer) {
      clearInterval(this.batchEventTimer);
      this.batchEventTimer = null;
    }
  }

  private async sendEvent(event: LearningEvent) {
    try {
      // 对于单个重要事件，可以考虑单独发送
      console.log('📤 Sending critical event:', event.type);
    } catch (error) {
      console.error('❌ Failed to send event:', error);
    }
  }

  private async sendBatchEvents() {
    if (this.events.length === 0) return;

    try {
      // 注意：当前简化版本不包含批量事件API，所以先记录到控制台
      console.log('📦 Batch events to send:', this.events.length);
      
      // 在完整版本中，这里会发送批量事件到服务器
      // const response = await fetch(`${this.apiBaseUrl}/api/learning/events/batch`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     sessionId: this.sessionId,
      //     events: this.events
      //   })
      // });

      // 清空已发送的事件
      this.events = [];
      
    } catch (error) {
      console.error('❌ Failed to send batch events:', error);
    }
  }

  private getDeviceType(): string {
    if (typeof navigator !== 'undefined') {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        return 'mobile';
      }
    }
    return 'web';
  }

  /**
   * 获取会话信息
   */
  public getSessionInfo() {
    const now = new Date();
    const duration = Math.round((now.getTime() - this.startTime.getTime()) / 1000);
    const activeDuration = Math.round(this.activeTime / 1000);

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration,
      activeDuration,
      activeRate: duration > 0 ? activeDuration / duration : 0,
      eventCount: this.events.length,
      isActive: this.isActive
    };
  }

  /**
   * 手动更新配置（例如切换到不同模块）
   */
  public updateConfig(newConfig: Partial<TimeTrackingConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.trackEvent('config_update', 'timetracker', newConfig);
  }
}

// 导出工具函数
export const createTimeTracker = (config: TimeTrackingConfig) => {
  return new TimeTracker(config);
};

export default TimeTracker;
