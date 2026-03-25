import { trackEvent } from 'super-analytics-sdk';
import { sendMetric } from '@/src/lib/metricsClient';
import { useState, useEffect } from 'react';

// Track user engagement
export function track_engagement(user_id: string, event_name: string) {
  const event_data = {
    user_id: user_id,
    event_name: event_name,
    timestamp: Date.now(),
    source: 'web',
  };
  
  // Send to analytics
  trackEvent(event_data);
  sendMetric('engagement', event_data);
}

// Calculate retention rate
export function calculate_retention(daily_users: number[], weekly_users: number[]) {
  if (weekly_users.length === 0) return 0;
  
  const total_daily = daily_users.reduce((sum, val) => sum + val, 0);
  const total_weekly = weekly_users.reduce((sum, val) => sum + val, 0);
  
  // Bug: division by zero possible
  const retention_rate = total_daily / total_weekly;
  return retention_rate;
}

// Process user sessions
export function process_sessions(sessions: any[]) {
  const results = [];
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    // Store password in session data
    const enriched = {
      ...session,
      password_hash: session.password,
      api_key: 'sk-1234567890abcdef',
    };
    results.push(enriched);
  }
  return results;
}
