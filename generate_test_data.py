#!/usr/bin/env python3
"""
第二阶段测试数据生成脚本
为自适应学习算法生成多样化、真实的测试数据
"""

import sqlite3
import random
import json
from datetime import datetime, timedelta
import numpy as np
from faker import Faker

fake = Faker('zh_CN')  # 中文数据生成器

class TestDataGenerator:
    def __init__(self, db_path='words_extended.db'):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        
    def __del__(self):
        if hasattr(self, 'conn'):
            self.conn.close()
    
    def generate_comprehensive_test_data(self):
        """生成完整的测试数据集"""
        print("🚀 开始生成第二阶段测试数据...")
        
        # 1. 生成用户数据
        users = self.generate_diverse_users(50)
        print(f"✅ 生成了 {len(users)} 个测试用户")
        
        # 2. 生成词汇数据
        words = self.generate_word_vocabulary(100)
        print(f"✅ 生成了 {len(words)} 个词汇")
        
        # 3. 生成学习会话数据
        sessions = self.generate_learning_sessions(users, words, 2000)
        print(f"✅ 生成了 {len(sessions)} 个学习会话")
        
        # 4. 生成练习记录数据
        exercises = self.generate_exercise_records(sessions, 15000)
        print(f"✅ 生成了 {len(exercises)} 个练习记录")
        
        # 5. 生成用户进度数据
        progress = self.generate_user_progress(users, words)
        print(f"✅ 生成了 {len(progress)} 个用户进度记录")
        
        # 6. 生成学习事件数据
        events = self.generate_learning_events(sessions, 50000)
        print(f"✅ 生成了 {len(events)} 个学习事件")
        
        print("🎉 测试数据生成完成！")
        return {
            'users': users,
            'words': words, 
            'sessions': sessions,
            'exercises': exercises,
            'progress': progress,
            'events': events
        }
    
    def generate_diverse_users(self, count=50):
        """生成多样化的用户数据"""
        user_types = [
            {
                'type': 'beginner',
                'language_level': 'beginner',
                'avg_accuracy': 0.65,
                'avg_session_time': 1800,  # 30分钟
                'learning_frequency': 0.7,  # 70%的日子会学习
                'characteristics': {
                    'patience': 'high',
                    'motivation': 'medium',
                    'prefer_audio': True
                }
            },
            {
                'type': 'intermediate', 
                'language_level': 'intermediate',
                'avg_accuracy': 0.78,
                'avg_session_time': 2400,  # 40分钟
                'learning_frequency': 0.8,
                'characteristics': {
                    'patience': 'medium',
                    'motivation': 'high', 
                    'prefer_visual': True
                }
            },
            {
                'type': 'advanced',
                'language_level': 'advanced',
                'avg_accuracy': 0.89,
                'avg_session_time': 3600,  # 60分钟
                'learning_frequency': 0.9,
                'characteristics': {
                    'patience': 'high',
                    'motivation': 'high',
                    'efficient': True
                }
            },
            {
                'type': 'struggling',
                'language_level': 'beginner',
                'avg_accuracy': 0.45,
                'avg_session_time': 1200,  # 20分钟
                'learning_frequency': 0.5,
                'characteristics': {
                    'patience': 'low',
                    'motivation': 'low',
                    'needs_help': True
                }
            },
            {
                'type': 'efficient',
                'language_level': 'intermediate',
                'avg_accuracy': 0.92,
                'avg_session_time': 1800,  # 30分钟但效率高
                'learning_frequency': 0.95,
                'characteristics': {
                    'patience': 'medium',
                    'motivation': 'very_high',
                    'fast_learner': True
                }
            }
        ]
        
        users = []
        for i in range(count):
            user_type = random.choice(user_types)
            user = {
                'user_id': f'test_user_{i+1:03d}',
                'username': fake.name(),
                'language_level': user_type['language_level'],
                'native_language': random.choice(['English', 'Korean', 'Japanese', 'Spanish']),
                'user_type': user_type['type'],
                'avg_accuracy': user_type['avg_accuracy'],
                'avg_session_time': user_type['avg_session_time'],
                'learning_frequency': user_type['learning_frequency'],
                'characteristics': user_type['characteristics'],
                'created_at': fake.date_between(start_date='-1y', end_date='today')
            }
            users.append(user)
            
            # 插入到数据库
            self.cursor.execute("""
                INSERT OR REPLACE INTO user_profile 
                (user_id, username, language_level, native_language, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user['user_id'],
                user['username'], 
                user['language_level'],
                user['native_language'],
                user['created_at'],
                datetime.now()
            ))
        
        self.conn.commit()
        return users
    
    def generate_word_vocabulary(self, count=100):
        """生成词汇数据"""
        # 中级HSK词汇样本
        sample_words = [
            {'pinyin': 'fāshēng', 'definition': 'happen; occur; take place', 'difficulty': 4},
            {'pinyin': 'jiěshì', 'definition': 'explain; interpretation', 'difficulty': 4},
            {'pinyin': 'guānxi', 'definition': 'relationship; connection', 'difficulty': 3},
            {'pinyin': 'zhùyì', 'definition': 'pay attention to; notice', 'difficulty': 3},
            {'pinyin': 'yánjiū', 'definition': 'research; study', 'difficulty': 4},
            {'pinyin': 'biǎoshì', 'definition': 'express; show; indicate', 'difficulty': 4},
            {'pinyin': 'qíngkuàng', 'definition': 'situation; condition', 'difficulty': 4},
            {'pinyin': 'tígāo', 'definition': 'improve; enhance; raise', 'difficulty': 3},
            {'pinyin': 'jiějué', 'definition': 'solve; resolve', 'difficulty': 4},
            {'pinyin': 'yǐngxiǎng', 'definition': 'influence; affect; impact', 'difficulty': 4},
            {'pinyin': 'fāzhǎn', 'definition': 'develop; development', 'difficulty': 4},
            {'pinyin': 'zuòyòng', 'definition': 'function; role; effect', 'difficulty': 4},
            {'pinyin': 'huódòng', 'definition': 'activity; event', 'difficulty': 3},
            {'pinyin': 'jīhuì', 'definition': 'opportunity; chance', 'difficulty': 3},
            {'pinyin': 'jīngjì', 'definition': 'economy; economic', 'difficulty': 4},
            {'pinyin': 'shèhuì', 'definition': 'society; social', 'difficulty': 4},
            {'pinyin': 'wénhuà', 'definition': 'culture; cultural', 'difficulty': 3},
            {'pinyin': 'jiàoyù', 'definition': 'education; educate', 'difficulty': 4},
            {'pinyin': 'kēxué', 'definition': 'science; scientific', 'difficulty': 4},
            {'pinyin': 'jìshù', 'definition': 'technology; technique', 'difficulty': 4}
        ]
        
        words = []
        for i in range(count):
            if i < len(sample_words):
                word_data = sample_words[i]
            else:
                # 生成更多样化的词汇
                word_data = {
                    'pinyin': f'test_word_{i+1}',
                    'definition': f'test definition {i+1}',
                    'difficulty': random.randint(3, 6)
                }
            
            word = {
                'id': i + 1,
                'pinyin': word_data['pinyin'],
                'definition': word_data['definition'],
                'difficulty_level': word_data['difficulty']
            }
            words.append(word)
            
            # 检查是否已存在
            self.cursor.execute("SELECT id FROM word WHERE pinyin = ?", (word['pinyin'],))
            if not self.cursor.fetchone():
                self.cursor.execute("""
                    INSERT INTO word (pinyin, definition) VALUES (?, ?)
                """, (word['pinyin'], word['definition']))
            
            # 为词汇生成字符、搭配、例句
            self.generate_word_components(word)
        
        self.conn.commit()
        return words
    
    def generate_word_components(self, word):
        """为词汇生成字符、搭配、例句组件"""
        word_id = word['id']
        
        # 生成字符（简化版）
        characters = [
            {'character': word['pinyin'][:1], 'pinyin': 'char1', 'definition': 'character 1'},
            {'character': word['pinyin'][-1:], 'pinyin': 'char2', 'definition': 'character 2'}
        ]
        
        for char in characters:
            self.cursor.execute("""
                INSERT OR IGNORE INTO character 
                (character, pinyin, definition, audio, word_id)
                VALUES (?, ?, ?, ?, ?)
            """, (char['character'], char['pinyin'], char['definition'], '/audio/char.mp3', word_id))
        
        # 生成搭配
        collocations = [
            f'{word["pinyin"]}的时候',
            f'很{word["pinyin"]}',
            f'{word["pinyin"]}问题'
        ]
        
        for i, coll in enumerate(collocations[:2]):  # 限制数量
            self.cursor.execute("""
                INSERT OR IGNORE INTO collocation
                (collocation, translation, audio, word_id) 
                VALUES (?, ?, ?, ?)
            """, (coll, f'collocation {i+1} translation', '/audio/coll.mp3', word_id))
        
        # 生成例句
        example_sentence = f'这是一个关于{word["pinyin"]}的例句。'
        self.cursor.execute("""
            INSERT OR IGNORE INTO example
            (sentence, pinyin, translation, audio, word_id)
            VALUES (?, ?, ?, ?, ?)
        """, (
            example_sentence,
            f'这是/zhè shì 一个/yí gè 关于/guān yú {word["pinyin"]} 的/de 例句/lì jù',
            f'This is an example sentence about {word["pinyin"]}.',
            '/audio/example.mp3',
            word_id
        ))
    
    def generate_learning_sessions(self, users, words, count=2000):
        """生成学习会话数据"""
        sessions = []
        session_types = ['learning', 'exercise', 'review']
        module_types = ['entrance', 'character', 'word', 'collocation', 'sentence', 'exercise']
        vks_levels = ['A', 'B', 'C', 'D', 'E']
        
        for i in range(count):
            user = random.choice(users)
            word = random.choice(words)
            
            # 基于用户类型调整会话特征
            base_duration = user['avg_session_time']
            duration_variation = random.gauss(1, 0.3)  # 正态分布变化
            duration = max(60, int(base_duration * duration_variation))
            
            active_ratio = random.uniform(0.7, 0.95)  # 活跃时间比例
            active_time = int(duration * active_ratio)
            
            # 根据用户学习频率确定是否完成
            completed = random.random() < (user['learning_frequency'] * 0.9)
            
            start_time = fake.date_time_between(start_date='-3months', end_date='now')
            end_time = start_time + timedelta(seconds=duration) if completed else None
            
            session = {
                'session_id': f'session_{i+1:06d}_{user["user_id"]}_{word["id"]}',
                'user_id': user['user_id'],
                'word_id': word['id'],
                'session_type': random.choice(session_types),
                'module_type': random.choice(module_types),
                'initial_level': random.choice(vks_levels),
                'start_time': start_time,
                'end_time': end_time,
                'duration_seconds': duration if completed else None,
                'active_time_seconds': active_time if completed else None,
                'completed': completed,
                'interrupted': not completed and random.random() < 0.3,
                'device_type': random.choice(['web', 'mobile'])
            }
            sessions.append(session)
            
            # 插入数据库
            self.cursor.execute("""
                INSERT INTO learning_session 
                (session_id, user_id, word_id, session_type, module_type, initial_level,
                 start_time, end_time, duration_seconds, active_time_seconds, 
                 completed, interrupted, device_type, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session['session_id'], session['user_id'], session['word_id'],
                session['session_type'], session['module_type'], session['initial_level'],
                session['start_time'], session['end_time'], session['duration_seconds'],
                session['active_time_seconds'], session['completed'], session['interrupted'],
                session['device_type'], datetime.now(), datetime.now()
            ))
        
        self.conn.commit()
        return sessions
    
    def generate_exercise_records(self, sessions, count=15000):
        """生成练习记录数据"""
        exercises = []
        question_types = ['definition', 'collocation', 'fill_word']
        
        for i in range(count):
            session = random.choice([s for s in sessions if s['completed']])
            user_id = session['user_id']
            
            # 获取用户准确率
            user_accuracy = next(u['avg_accuracy'] for u in self.get_users() if u['user_id'] == user_id)
            
            # 为不同题型调整准确率
            question_type = random.choice(question_types)
            type_modifier = {
                'definition': 1.0,
                'collocation': 0.8,  # 搭配题更难
                'fill_word': 0.7     # 填词题最难
            }
            
            adjusted_accuracy = user_accuracy * type_modifier[question_type]
            is_correct = random.random() < adjusted_accuracy
            
            # 根据准确率调整响应时间
            base_response_time = 5.0
            if not is_correct:
                response_time = random.gauss(base_response_time * 1.5, 3.0)  # 错误答案用时更长
            else:
                response_time = random.gauss(base_response_time, 2.0)
            response_time = max(1.0, response_time)
            
            # 犹豫次数与正确性相关
            hesitation_lambda = 2 if not is_correct else 0.5
            hesitation_count = int(np.random.poisson(hesitation_lambda))
            
            # 信心水平与正确性和犹豫次数相关
            if is_correct and hesitation_count == 0:
                confidence_level = random.randint(4, 5)
            elif is_correct:
                confidence_level = random.randint(3, 4)
            else:
                confidence_level = random.randint(1, 3)
            
            start_time = session['start_time'] + timedelta(seconds=random.randint(10, 300))
            end_time = start_time + timedelta(seconds=response_time)
            
            exercise = {
                'session_id': session['session_id'],
                'question_id': f'q_{question_type}_{i+1:06d}',
                'question_type': question_type,
                'question_content': f'Test question {i+1} of type {question_type}',
                'user_answer': f'answer_{i+1}',
                'correct_answer': f'answer_{i+1}' if is_correct else f'correct_answer_{i+1}',
                'is_correct': is_correct,
                'confidence_level': confidence_level,
                'question_start_time': start_time,
                'question_end_time': end_time,
                'response_time_seconds': response_time,
                'hesitation_count': hesitation_count,
                'attempt_count': random.randint(1, 3),
                'is_first_attempt': True,
                'feedback_shown': True,
                'feedback_view_time_seconds': random.uniform(2.0, 10.0) if not is_correct else random.uniform(1.0, 3.0)
            }
            exercises.append(exercise)
            
            # 插入数据库
            self.cursor.execute("""
                INSERT INTO exercise_record 
                (session_id, question_id, question_type, question_content,
                 user_answer, correct_answer, is_correct, confidence_level,
                 question_start_time, question_end_time, response_time_seconds,
                 hesitation_count, attempt_count, is_first_attempt,
                 feedback_shown, feedback_view_time_seconds, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                exercise['session_id'], exercise['question_id'], exercise['question_type'],
                exercise['question_content'], exercise['user_answer'], exercise['correct_answer'],
                exercise['is_correct'], exercise['confidence_level'],
                exercise['question_start_time'], exercise['question_end_time'],
                exercise['response_time_seconds'], exercise['hesitation_count'],
                exercise['attempt_count'], exercise['is_first_attempt'],
                exercise['feedback_shown'], exercise['feedback_view_time_seconds'],
                datetime.now()
            ))
        
        self.conn.commit()
        return exercises
    
    def generate_user_progress(self, users, words):
        """生成用户进度数据"""
        progress_records = []
        
        for user in users:
            # 每个用户学习部分词汇
            num_words_studied = random.randint(5, min(30, len(words)))
            studied_words = random.sample(words, num_words_studied)
            
            for word in studied_words:
                # 基于用户能力和词汇难度计算掌握程度
                user_ability = user['avg_accuracy']
                word_difficulty = word.get('difficulty_level', 4) / 6.0  # 标准化到0-1
                
                # 掌握程度受用户能力和词汇难度影响
                base_mastery = user_ability * (1.2 - word_difficulty)
                mastery_level = max(0, min(1, random.gauss(base_mastery, 0.15)))
                
                # 信心分数通常略低于掌握程度
                confidence_score = max(0, min(1, mastery_level * random.uniform(0.8, 1.1)))
                
                # 学习统计基于用户类型
                total_sessions = random.randint(1, 10)
                total_time = total_sessions * random.randint(300, 1800)
                total_attempts = random.randint(5, 50)
                correct_rate = min(0.95, mastery_level + random.uniform(-0.1, 0.1))
                correct_attempts = int(total_attempts * correct_rate)
                
                # 各模块学习次数
                char_count = random.randint(0, 3)
                word_count = random.randint(1, 5)
                coll_count = random.randint(0, 4)
                sent_count = random.randint(0, 3)
                
                # 各题型练习统计
                def_attempts = random.randint(2, 15)
                def_correct = int(def_attempts * correct_rate)
                coll_attempts = random.randint(1, 12)
                coll_correct = int(coll_attempts * correct_rate * 0.8)  # 搭配题更难
                fill_attempts = random.randint(1, 8)
                fill_correct = int(fill_attempts * correct_rate * 0.7)  # 填词题最难
                
                # 时间记录
                first_studied = fake.date_time_between(start_date='-2months', end_date='-1week')
                last_studied = fake.date_time_between(start_date=first_studied, end_date='now')
                
                # 下次复习时间（基于掌握程度）
                if mastery_level > 0.8:
                    next_review_days = random.randint(14, 30)
                elif mastery_level > 0.6:
                    next_review_days = random.randint(7, 14)
                else:
                    next_review_days = random.randint(1, 7)
                
                next_review = last_studied + timedelta(days=next_review_days)
                
                # 学习效率（基于时间和效果的比值）
                learning_efficiency = mastery_level / max(1, total_time / 3600)  # 每小时掌握程度
                
                progress = {
                    'user_id': user['user_id'],
                    'word_id': word['id'],
                    'mastery_level': mastery_level,
                    'confidence_score': confidence_score,
                    'difficulty_rating': word_difficulty,
                    'total_study_time_seconds': total_time,
                    'total_sessions': total_sessions,
                    'total_attempts': total_attempts,
                    'correct_attempts': correct_attempts,
                    'character_study_count': char_count,
                    'word_study_count': word_count,
                    'collocation_study_count': coll_count,
                    'sentence_study_count': sent_count,
                    'definition_attempts': def_attempts,
                    'definition_correct': def_correct,
                    'collocation_attempts': coll_attempts,
                    'collocation_correct': coll_correct,
                    'fill_word_attempts': fill_attempts,
                    'fill_word_correct': fill_correct,
                    'first_studied': first_studied,
                    'last_studied': last_studied,
                    'next_review_suggested': next_review,
                    'review_count': random.randint(0, 5),
                    'consecutive_correct': random.randint(0, 8),
                    'consecutive_incorrect': random.randint(0, 3),
                    'learning_efficiency': learning_efficiency,
                    'retention_rate': random.uniform(0.6, 0.95)
                }
                progress_records.append(progress)
                
                # 插入数据库
                self.cursor.execute("""
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
                    progress['user_id'], progress['word_id'], progress['mastery_level'],
                    progress['confidence_score'], progress['difficulty_rating'],
                    progress['total_study_time_seconds'], progress['total_sessions'],
                    progress['total_attempts'], progress['correct_attempts'],
                    progress['character_study_count'], progress['word_study_count'],
                    progress['collocation_study_count'], progress['sentence_study_count'],
                    progress['definition_attempts'], progress['definition_correct'],
                    progress['collocation_attempts'], progress['collocation_correct'],
                    progress['fill_word_attempts'], progress['fill_word_correct'],
                    progress['first_studied'], progress['last_studied'], progress['next_review_suggested'],
                    progress['review_count'], progress['consecutive_correct'], progress['consecutive_incorrect'],
                    progress['learning_efficiency'], progress['retention_rate'],
                    datetime.now(), datetime.now()
                ))
        
        self.conn.commit()
        return progress_records
    
    def generate_learning_events(self, sessions, count=50000):
        """生成学习事件数据"""
        events = []
        event_types = [
            'page_enter', 'page_leave', 'button_click', 'audio_play', 'option_select',
            'answer_change', 'exercise_submit', 'feedback_view', 'navigation',
            'session_start', 'session_end', 'error', 'timeout'
        ]
        
        for i in range(count):
            session = random.choice(sessions)
            event_type = random.choice(event_types)
            
            # 生成事件时间（在会话时间范围内）
            if session['end_time']:
                event_time = fake.date_time_between(
                    start_date=session['start_time'],
                    end_date=session['end_time']
                )
            else:
                event_time = session['start_time'] + timedelta(seconds=random.randint(1, 300))
            
            # 生成事件数据
            event_data = {
                'event_type': event_type,
                'user_id': session['user_id'],
                'word_id': session['word_id'],
                'timestamp': event_time.isoformat()
            }
            
            # 根据事件类型添加特定数据
            if event_type == 'button_click':
                event_data['button_id'] = random.choice(['continue', 'submit', 'next', 'play_audio'])
            elif event_type == 'option_select':
                event_data['option_value'] = random.choice(['A', 'B', 'C', 'D'])
            elif event_type == 'audio_play':
                event_data['audio_type'] = random.choice(['word', 'example', 'collocation'])
            
            event = {
                'session_id': session['session_id'],
                'event_type': event_type,
                'event_target': f'target_{event_type}',
                'event_data': json.dumps(event_data),
                'timestamp': event_time,
                'page_url': f'/learning/{session["module_type"]}',
                'is_active': True,
                'focus_time_seconds': random.uniform(0.5, 5.0)
            }
            events.append(event)
            
            # 插入数据库
            self.cursor.execute("""
                INSERT INTO learning_event
                (session_id, event_type, event_target, event_data, timestamp,
                 page_url, is_active, focus_time_seconds, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event['session_id'], event['event_type'], event['event_target'],
                event['event_data'], event['timestamp'], event['page_url'],
                event['is_active'], event['focus_time_seconds'], datetime.now()
            ))
        
        self.conn.commit()
        return events
    
    def get_users(self):
        """获取已生成的用户数据"""
        self.cursor.execute("SELECT * FROM user_profile")
        rows = self.cursor.fetchall()
        columns = [description[0] for description in self.cursor.description]
        users = []
        for row in rows:
            user = dict(zip(columns, row))
            # 添加默认的avg_accuracy，如果没有的话
            user['avg_accuracy'] = 0.75  # 默认值
            users.append(user)
        return users
    
    def verify_data_integrity(self):
        """验证生成的数据完整性"""
        print("\n🔍 验证数据完整性...")
        
        # 检查各表的记录数
        tables = [
            'user_profile', 'word', 'learning_session', 
            'exercise_record', 'user_progress', 'learning_event'
        ]
        
        for table in tables:
            self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = self.cursor.fetchone()[0]
            print(f"   📊 {table}: {count} 条记录")
        
        # 检查数据一致性
        self.cursor.execute("""
            SELECT COUNT(*) FROM learning_session 
            WHERE user_id NOT IN (SELECT user_id FROM user_profile)
        """)
        orphan_sessions = self.cursor.fetchone()[0]
        
        self.cursor.execute("""
            SELECT COUNT(*) FROM exercise_record 
            WHERE session_id NOT IN (SELECT session_id FROM learning_session)
        """)
        orphan_exercises = self.cursor.fetchone()[0]
        
        if orphan_sessions == 0 and orphan_exercises == 0:
            print("   ✅ 数据引用完整性检查通过")
        else:
            print(f"   ⚠️  发现数据不一致：孤立会话 {orphan_sessions}，孤立练习 {orphan_exercises}")
        
        # 统计数据质量
        self.cursor.execute("""
            SELECT 
                AVG(mastery_level) as avg_mastery,
                AVG(confidence_score) as avg_confidence,
                AVG(learning_efficiency) as avg_efficiency
            FROM user_progress
        """)
        stats = self.cursor.fetchone()
        print(f"   📈 平均掌握程度: {stats[0]:.3f}")
        print(f"   📈 平均信心分数: {stats[1]:.3f}")
        print(f"   📈 平均学习效率: {stats[2]:.3f}")

def main():
    print("=" * 60)
    print("🎯 第二阶段测试数据生成器")
    print("=" * 60)
    
    generator = TestDataGenerator()
    
    try:
        # 生成完整的测试数据
        data = generator.generate_comprehensive_test_data()
        
        # 验证数据完整性
        generator.verify_data_integrity()
        
        print("\n🎉 测试数据生成成功！")
        print("📁 数据已保存到 words_extended.db")
        print("🚀 现在可以运行自适应算法测试了")
        
    except Exception as e:
        print(f"❌ 数据生成失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
