#!/usr/bin/env python3
"""
简化版测试数据生成脚本
"""

import sqlite3
import random
from datetime import datetime, timedelta
import json

def generate_simple_test_data():
    """生成简单的测试数据"""
    print("🚀 生成简化版测试数据...")
    
    # 连接数据库
    conn = sqlite3.connect('words_extended.db')
    cursor = conn.cursor()
    
    try:
        # 1. 生成测试用户
        users = []
        for i in range(10):
            user_id = f'test_user_{i+1:03d}'
            users.append(user_id)
            
            cursor.execute("""
                INSERT OR REPLACE INTO user_profile 
                (user_id, username, language_level, native_language, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                f'测试用户{i+1}',
                random.choice(['beginner', 'intermediate', 'advanced']),
                random.choice(['English', 'Korean', 'Japanese']),
                datetime.now(),
                datetime.now()
            ))
        
        # 2. 生成学习会话
        sessions = []
        for i in range(50):
            user_id = random.choice(users)
            word_id = 1  # 使用现有的词汇
            session_id = f'session_{i+1:06d}_{user_id}'
            
            start_time = datetime.now() - timedelta(days=random.randint(1, 30))
            duration = random.randint(120, 1800)
            end_time = start_time + timedelta(seconds=duration)
            
            sessions.append(session_id)
            
            cursor.execute("""
                INSERT OR REPLACE INTO learning_session 
                (session_id, user_id, word_id, session_type, module_type, initial_level,
                 start_time, end_time, duration_seconds, active_time_seconds, 
                 completed, interrupted, device_type, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, user_id, word_id,
                random.choice(['learning', 'exercise', 'review']),
                random.choice(['character', 'word', 'collocation', 'sentence']),
                random.choice(['A', 'B', 'C', 'D', 'E']),
                start_time, end_time, duration, int(duration * 0.8),
                True, False, 'web', datetime.now(), datetime.now()
            ))
        
        # 3. 生成练习记录
        for i in range(200):
            session_id = random.choice(sessions)
            is_correct = random.random() < 0.7
            response_time = random.uniform(2.0, 15.0)
            
            cursor.execute("""
                INSERT OR REPLACE INTO exercise_record 
                (session_id, question_id, question_type, question_content,
                 user_answer, correct_answer, is_correct, confidence_level,
                 question_start_time, question_end_time, response_time_seconds,
                 hesitation_count, attempt_count, is_first_attempt,
                 feedback_shown, feedback_view_time_seconds, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, f'q_{i+1}', 
                random.choice(['definition', 'collocation', 'fill_word']),
                f'Test question {i+1}', 'answer', 'correct_answer',
                is_correct, random.randint(1, 5),
                datetime.now(), datetime.now(), response_time,
                random.randint(0, 3), 1, True, True, 2.0, datetime.now()
            ))
        
        # 4. 生成用户进度
        for user_id in users:
            mastery_level = random.uniform(0.3, 0.9)
            confidence_score = mastery_level * random.uniform(0.8, 1.1)
            
            cursor.execute("""
                INSERT OR REPLACE INTO user_progress 
                (user_id, word_id, mastery_level, confidence_score, difficulty_rating,
                 total_study_time_seconds, total_sessions, total_attempts, correct_attempts,
                 character_study_count, word_study_count, collocation_study_count, sentence_study_count,
                 definition_attempts, definition_correct, collocation_attempts, collocation_correct,
                 fill_word_attempts, fill_word_correct, first_studied, last_studied, next_review_suggested,
                 review_count, consecutive_correct, consecutive_incorrect, learning_efficiency, retention_rate,
                 created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, 1, mastery_level, confidence_score, 0.5,
                random.randint(600, 3600), random.randint(2, 10), 
                random.randint(10, 50), int(random.randint(10, 50) * 0.7),
                random.randint(1, 3), random.randint(2, 5), 
                random.randint(1, 4), random.randint(0, 3),
                random.randint(5, 15), int(random.randint(5, 15) * 0.7),
                random.randint(3, 10), int(random.randint(3, 10) * 0.6),
                random.randint(2, 8), int(random.randint(2, 8) * 0.5),
                datetime.now() - timedelta(days=random.randint(1, 30)),
                datetime.now() - timedelta(days=random.randint(0, 7)),
                datetime.now() + timedelta(days=random.randint(1, 14)),
                random.randint(0, 5), random.randint(0, 8), random.randint(0, 3),
                random.uniform(0.5, 2.0), random.uniform(0.6, 0.95),
                datetime.now(), datetime.now()
            ))
        
        # 5. 生成学习事件
        for i in range(100):
            session_id = random.choice(sessions)
            event_data = {
                'event_type': random.choice(['button_click', 'option_select', 'audio_play']),
                'timestamp': datetime.now().isoformat()
            }
            
            cursor.execute("""
                INSERT OR REPLACE INTO learning_event
                (session_id, event_type, event_target, event_data, timestamp,
                 page_url, is_active, focus_time_seconds, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, event_data['event_type'], 'target_element',
                json.dumps(event_data), datetime.now(),
                '/learning/test', True, random.uniform(1.0, 5.0), datetime.now()
            ))
        
        conn.commit()
        print("✅ 简化版测试数据生成完成！")
        
        # 验证数据
        cursor.execute("SELECT COUNT(*) FROM user_profile")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM learning_session")
        session_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM exercise_record")
        exercise_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM user_progress")
        progress_count = cursor.fetchone()[0]
        
        print(f"📊 数据统计:")
        print(f"   - 用户: {user_count}")
        print(f"   - 学习会话: {session_count}")
        print(f"   - 练习记录: {exercise_count}")
        print(f"   - 用户进度: {progress_count}")
        
    except Exception as e:
        print(f"❌ 数据生成失败: {str(e)}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    generate_simple_test_data()
