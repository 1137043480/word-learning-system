#!/usr/bin/env python3
"""
第二阶段扩展API服务
集成自适应推荐引擎、学习分析和复习调度功能
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import json
import random
import sqlite3

# 导入自适应引擎
try:
    from adaptive_engine import AdaptiveRecommendationEngine, SpacedRepetitionAlgorithm
except ImportError:
    print("⚠️  自适应引擎模块未找到，将使用简化版本")
    AdaptiveRecommendationEngine = None
    SpacedRepetitionAlgorithm = None

app = Flask(__name__)
CORS(app)

# 配置数据库
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'words_extended.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 数据库模型定义
class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pinyin = db.Column(db.String(80), nullable=False)
    definition = db.Column(db.String(200), nullable=False)

class Example(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sentence = db.Column(db.String(200), nullable=False)
    pinyin = db.Column(db.String(200), nullable=False)
    translation = db.Column(db.String(200), nullable=False)
    audio = db.Column(db.String(200), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)

class Collocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    collocation = db.Column(db.String(200), nullable=False)
    translation = db.Column(db.String(200), nullable=False)
    audio = db.Column(db.String(200), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)

class Character(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    character = db.Column(db.String(10), nullable=False)
    pinyin = db.Column(db.String(80), nullable=False)
    definition = db.Column(db.String(200), nullable=False)
    audio = db.Column(db.String(200), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)

class UserProfile(db.Model):
    __tablename__ = 'user_profile'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(100))
    language_level = db.Column(db.String(20))
    native_language = db.Column(db.String(50), default='English')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LearningSession(db.Model):
    __tablename__ = 'learning_session'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.String(50), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    session_type = db.Column(db.String(20), nullable=False)
    module_type = db.Column(db.String(30), nullable=False)
    initial_level = db.Column(db.String(1))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Integer)
    active_time_seconds = db.Column(db.Integer)
    completed = db.Column(db.Boolean, default=False)
    interrupted = db.Column(db.Boolean, default=False)
    device_type = db.Column(db.String(20), default='web')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ExerciseRecord(db.Model):
    __tablename__ = 'exercise_record'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    question_id = db.Column(db.String(50), nullable=False)
    question_type = db.Column(db.String(20), nullable=False)
    question_content = db.Column(db.Text)
    user_answer = db.Column(db.String(500))
    correct_answer = db.Column(db.String(500))
    is_correct = db.Column(db.Boolean, nullable=False)
    confidence_level = db.Column(db.Integer)
    question_start_time = db.Column(db.DateTime, nullable=False)
    question_end_time = db.Column(db.DateTime)
    response_time_seconds = db.Column(db.Float)
    hesitation_count = db.Column(db.Integer, default=0)
    attempt_count = db.Column(db.Integer, default=1)
    is_first_attempt = db.Column(db.Boolean, default=True)
    feedback_shown = db.Column(db.Boolean, default=False)
    feedback_view_time_seconds = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserProgress(db.Model):
    __tablename__ = 'user_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    mastery_level = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    difficulty_rating = db.Column(db.Float)
    total_study_time_seconds = db.Column(db.Integer, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    total_attempts = db.Column(db.Integer, default=0)
    correct_attempts = db.Column(db.Integer, default=0)
    character_study_count = db.Column(db.Integer, default=0)
    word_study_count = db.Column(db.Integer, default=0)
    collocation_study_count = db.Column(db.Integer, default=0)
    sentence_study_count = db.Column(db.Integer, default=0)
    definition_attempts = db.Column(db.Integer, default=0)
    definition_correct = db.Column(db.Integer, default=0)
    collocation_attempts = db.Column(db.Integer, default=0)
    collocation_correct = db.Column(db.Integer, default=0)
    fill_word_attempts = db.Column(db.Integer, default=0)
    fill_word_correct = db.Column(db.Integer, default=0)
    first_studied = db.Column(db.DateTime)
    last_studied = db.Column(db.DateTime)
    next_review_suggested = db.Column(db.DateTime)
    review_count = db.Column(db.Integer, default=0)
    consecutive_correct = db.Column(db.Integer, default=0)
    consecutive_incorrect = db.Column(db.Integer, default=0)
    learning_efficiency = db.Column(db.Float)
    retention_rate = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AdaptiveRecommendation(db.Model):
    __tablename__ = 'adaptive_recommendation'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    recommendation_type = db.Column(db.String(30), nullable=False)
    target_word_id = db.Column(db.Integer, db.ForeignKey('word.id'))
    target_module = db.Column(db.String(30))
    confidence_score = db.Column(db.Float)
    algorithm_version = db.Column(db.String(20))
    recommendation_data = db.Column(db.Text)
    is_accepted = db.Column(db.Boolean)
    actual_choice = db.Column(db.String(100))
    effectiveness_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 全局推荐引擎实例
recommendation_engine = None
spaced_repetition = None

def get_db_connection():
    """获取数据库连接"""
    return sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))

def init_recommendation_engine():
    """初始化推荐引擎"""
    global recommendation_engine, spaced_repetition
    
    if AdaptiveRecommendationEngine:
        try:
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            recommendation_engine = AdaptiveRecommendationEngine(db_path)
            spaced_repetition = SpacedRepetitionAlgorithm(db_path)
            print("✅ 自适应推荐引擎初始化成功")
        except Exception as e:
            print(f"⚠️  推荐引擎初始化失败: {str(e)}")
    else:
        print("⚠️  使用简化版推荐引擎")

# ================================================
# 原有API路由
# ================================================

@app.route('/')
def home():
    return jsonify({
        "message": "第二阶段：自适应学习API",
        "version": "2.0.0",
        "features": [
            "智能推荐引擎",
            "间隔重复算法", 
            "学习分析dashboard",
            "个性化学习路径"
        ],
        "endpoints": [
            "GET  /words - 词汇列表",
            "GET  /word/<id> - 词汇详情",
            "POST /api/learning/session/start - 开始学习会话",
            "POST /api/learning/session/end - 结束学习会话",
            "POST /api/learning/exercise/record - 记录练习结果",
            "GET  /api/adaptive/recommendation/<user_id> - 获取个性化推荐",
            "POST /api/adaptive/feedback - 记录推荐反馈",
            "GET  /api/review/user/<user_id>/due - 获取到期复习内容",
            "GET  /api/analytics/user/<user_id>/dashboard - 获取学习dashboard",
            "GET  /api/stats - 系统统计"
        ]
    })

@app.route('/word/<int:id>', methods=['GET'])
def get_word(id):
    word = Word.query.get_or_404(id)
    examples = Example.query.filter_by(word_id=id).all()
    collocations = Collocation.query.filter_by(word_id=id).all()
    characters = Character.query.filter_by(word_id=id).all()
    
    word_data = {
        'id': word.id,
        'pinyin': word.pinyin,
        'definition': word.definition,
        'examples': [{'sentence': ex.sentence, 'pinyin': ex.pinyin, 'translation': ex.translation, 'audio': ex.audio} for ex in examples],
        'collocations': [{'collocation': col.collocation, 'translation': col.translation, 'audio': col.audio} for col in collocations],
        'characters': [{'character': char.character, 'pinyin': char.pinyin, 'definition': char.definition, 'audio': char.audio} for char in characters]
    }
    return jsonify(word_data)

@app.route('/words', methods=['GET'])
def list_words():
    words = Word.query.all()
    words_data = [{'id': word.id, 'pinyin': word.pinyin, 'definition': word.definition} for word in words]
    return jsonify(words_data)

@app.route('/exercise/submit', methods=['POST'])
def submit_exercise():
    data = request.get_json()
    answer = data.get('answer')
    correct_answer = 'D'
    return jsonify({'correct': answer == correct_answer})

# ================================================
# 第一阶段时间追踪API
# ================================================

@app.route('/api/learning/session/start', methods=['POST'])
def start_learning_session():
    try:
        data = request.get_json()
        
        session = LearningSession(
            session_id=data['sessionId'],
            user_id=data['userId'],
            word_id=data['wordId'],
            session_type=data['sessionType'],
            module_type=data['moduleType'],
            initial_level=data.get('initialLevel'),
            start_time=datetime.fromisoformat(data['startTime'].replace('Z', '+00:00')),
            device_type=data.get('deviceType', 'web')
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'sessionId': data['sessionId'],
            'message': 'Session started successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learning/session/end', methods=['POST'])
def end_learning_session():
    try:
        data = request.get_json()
        
        session = LearningSession.query.filter_by(session_id=data['sessionId']).first()
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        session.end_time = datetime.fromisoformat(data['endTime'].replace('Z', '+00:00'))
        session.duration_seconds = data['durationSeconds']
        session.active_time_seconds = data.get('activeTimeSeconds')
        session.completed = data.get('completed', True)
        session.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Session ended successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learning/exercise/record', methods=['POST'])
def record_exercise_result():
    try:
        data = request.get_json()
        
        exercise = ExerciseRecord(
            session_id=data['sessionId'],
            question_id=data['questionId'],
            question_type=data['questionType'],
            question_content=data.get('questionContent'),
            user_answer=data['userAnswer'],
            correct_answer=data['correctAnswer'],
            is_correct=data['isCorrect'],
            confidence_level=data.get('confidenceLevel'),
            question_start_time=datetime.fromisoformat(data['startTime'].replace('Z', '+00:00')),
            question_end_time=datetime.fromisoformat(data['endTime'].replace('Z', '+00:00')),
            response_time_seconds=data.get('responseTimeSeconds'),
            hesitation_count=data.get('hesitationCount', 0),
            attempt_count=data.get('attemptCount', 1),
            is_first_attempt=data.get('isFirstAttempt', True)
        )
        
        db.session.add(exercise)
        db.session.commit()
        
        # 如果有间隔重复算法，更新用户进度
        if spaced_repetition:
            try:
                # 获取session信息以确定user_id和word_id
                session = LearningSession.query.filter_by(session_id=data['sessionId']).first()
                if session:
                    exercise_result = {
                        'is_correct': data['isCorrect'],
                        'response_time': data.get('responseTimeSeconds', 5.0),
                        'confidence': data.get('confidenceLevel', 3),
                        'hesitation_count': data.get('hesitationCount', 0)
                    }
                    spaced_repetition.update_user_progress_after_exercise(
                        session.user_id, session.word_id, exercise_result
                    )
            except Exception as e:
                print(f"⚠️  间隔重复算法更新失败: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Exercise recorded successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/learning/word/<int:word_id>/exercises', methods=['GET'])
def get_word_exercises(word_id):
    """为指定词汇生成练习题集"""
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'success': False, 'error': 'Word not found'}), 404

    try:
        question_limit = max(1, min(int(request.args.get('limit', 5)), 10))
    except (TypeError, ValueError):
        question_limit = 5

    try:
        desired_option_count = max(2, min(int(request.args.get('options', 4)), 6))
    except (TypeError, ValueError):
        desired_option_count = 4

    def build_options():
        candidates = {word.pinyin}
        random_candidates = (
            Word.query.filter(Word.id != word.id)
            .order_by(db.func.random())
            .limit(desired_option_count * 2)
            .all()
        )
        for candidate in random_candidates:
            if candidate.pinyin:
                candidates.add(candidate.pinyin)
            if len(candidates) >= desired_option_count:
                break

        option_list = list(candidates)
        random.shuffle(option_list)
        return option_list[:desired_option_count]

    options = build_options()
    questions = []

    questions.append({
        'id': f'definition-{word.id}',
        'type': 'definition',
        'question': f"请选择与以下释义匹配的词汇：{word.definition}",
        'options': options,
        'correctAnswer': word.pinyin,
        'feedback': f"正确答案：{word.pinyin}。释义：{word.definition}"
    })

    collocations = (
        Collocation.query.filter_by(word_id=word.id)
        .order_by(Collocation.id.asc())
        .limit(question_limit)
        .all()
    )
    for index, collocation in enumerate(collocations, start=1):
        placeholder = collocation.collocation.replace(word.pinyin, '____')
        if placeholder == collocation.collocation:
            placeholder = collocation.collocation
        questions.append({
            'id': f'collocation-{word.id}-{index}',
            'type': 'collocation',
            'question': f"填空：{placeholder}",
            'options': options,
            'correctAnswer': word.pinyin,
            'feedback': f"原搭配：{collocation.collocation}；翻译：{collocation.translation}"
        })
        if len(questions) >= question_limit:
            break

    if len(questions) < question_limit:
        example = (
            Example.query.filter_by(word_id=word.id)
            .order_by(Example.id.asc())
            .first()
        )
        if example:
            sentence_placeholder = example.sentence.replace(word.pinyin, '____')
            if sentence_placeholder == example.sentence:
                sentence_placeholder = example.sentence
            questions.append({
                'id': f'sentence-{word.id}-1',
                'type': 'fill_word',
                'question': f"选择最适合填入下列句子空格的词语：{sentence_placeholder}",
                'options': options,
                'correctAnswer': word.pinyin,
                'feedback': f"例句：{example.sentence}；翻译：{example.translation}"
            })

    questions = questions[:question_limit]

    if not questions:
        return jsonify({'success': False, 'error': 'No exercises available for this word'}), 404

    return jsonify({
        'success': True,
        'data': {
            'wordId': word.id,
            'word': word.pinyin,
            'definition': word.definition,
            'options': options,
            'questionCount': len(questions),
            'questions': questions
        }
    })


# ================================================
# 第二阶段自适应推荐API
# ================================================

@app.route('/api/adaptive/recommendation/<user_id>', methods=['GET'])
def get_adaptive_recommendation(user_id):
    """获取个性化推荐"""
    try:
        # 获取上下文参数
        context = {}
        if request.args.get('context'):
            try:
                context = json.loads(request.args.get('context'))
            except:
                pass
        
        # 使用推荐引擎获取推荐
        if recommendation_engine:
            recommendation = recommendation_engine.get_next_recommendation(user_id, context)
            
            # 保存推荐记录
            rec_id = recommendation_engine.save_recommendation(user_id, recommendation)
            recommendation['recommendationId'] = rec_id
        else:
            # 简化版推荐
            recommendation = get_simple_recommendation(user_id, context)
        
        return jsonify({
            'success': True,
            'data': recommendation
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/adaptive/feedback', methods=['POST'])
def record_recommendation_feedback():
    """记录推荐反馈"""
    try:
        data = request.get_json()
        
        if recommendation_engine:
            success = recommendation_engine.record_recommendation_feedback(
                data['recommendationId'],
                data['userId'],
                {
                    'accepted': data.get('accepted', False),
                    'actual_choice': data.get('actualChoice'),
                    'effectiveness_score': data.get('effectivenessScore')
                }
            )
            
            if success:
                return jsonify({'success': True, 'message': 'Feedback recorded'})
            else:
                return jsonify({'success': False, 'error': 'Recommendation not found'}), 404
        else:
            return jsonify({'success': True, 'message': 'Feedback received (simple mode)'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/review/user/<user_id>/due', methods=['GET'])
def get_due_reviews(user_id):
    """获取到期复习内容"""
    try:
        limit = int(request.args.get('limit', 10))
        
        if spaced_repetition:
            reviews = spaced_repetition.get_due_reviews(user_id, limit)
        else:
            reviews = get_simple_due_reviews(user_id, limit)
        
        return jsonify({
            'success': True,
            'data': reviews
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/user/<user_id>/dashboard', methods=['GET'])
def get_user_dashboard(user_id):
    """获取用户学习dashboard数据"""
    try:
        time_range = request.args.get('range', 'month')  # week, month, all
        
        dashboard_data = generate_dashboard_data(user_id, time_range)
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/user/<user_id>/progress', methods=['GET'])
def get_user_detailed_progress(user_id):
    """获取用户详细学习进度"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 获取用户进度列表
        cursor.execute("""
            SELECT up.word_id, w.pinyin, up.mastery_level, up.confidence_score,
                   up.total_study_time_seconds, up.total_sessions, up.total_attempts, up.correct_attempts,
                   up.last_studied, up.next_review_suggested, up.learning_efficiency
            FROM user_progress up
            JOIN word w ON up.word_id = w.id
            WHERE up.user_id = ?
            ORDER BY up.mastery_level DESC, up.last_studied DESC
        """, (user_id,))
        
        results = cursor.fetchall()
        progress_list = []
        
        for result in results:
            word_id, pinyin, mastery_level, confidence_score, total_time, sessions, attempts, correct, last_studied, next_review, efficiency = result
            
            progress_list.append({
                'wordId': word_id,
                'word': pinyin,
                'masteryLevel': mastery_level,
                'confidenceScore': confidence_score,
                'totalStudyTime': total_time,
                'totalSessions': sessions,
                'accuracyRate': correct / max(attempts, 1),
                'lastStudied': last_studied,
                'nextReview': next_review,
                'learningEfficiency': efficiency
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': progress_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_system_stats():
    """获取系统统计信息"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 基础统计
        cursor.execute("SELECT COUNT(*) FROM user_profile")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM word")
        word_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM learning_session")
        session_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM exercise_record")
        exercise_count = cursor.fetchone()[0]
        
        # 进度统计
        cursor.execute("""
            SELECT 
                AVG(mastery_level) as avg_mastery,
                AVG(learning_efficiency) as avg_efficiency,
                COUNT(*) as progress_records
            FROM user_progress
        """)
        progress_stats = cursor.fetchone()
        
        # 最近活动
        cursor.execute("""
            SELECT COUNT(*) FROM learning_session 
            WHERE created_at >= datetime('now', '-7 days')
        """)
        recent_sessions = cursor.fetchone()[0]
        
        conn.close()
        
        stats = {
            'totalUsers': user_count,
            'totalWords': word_count,
            'totalSessions': session_count,
            'totalExercises': exercise_count,
            'recentSessions': recent_sessions,
            'averageMastery': progress_stats[0] if progress_stats[0] else 0,
            'averageEfficiency': progress_stats[1] if progress_stats[1] else 0,
            'progressRecords': progress_stats[2] if progress_stats[2] else 0,
            'adaptiveEngine': recommendation_engine is not None,
            'spacedRepetition': spaced_repetition is not None
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================================
# 简化版推荐函数（fallback）
# ================================================

def get_simple_recommendation(user_id, context):
    """简化版推荐（当推荐引擎不可用时）"""
    return {
        'type': 'simple_recommendation',
        'priority': 'medium',
        'word_id': 1,
        'word': '发生',
        'reason': '继续学习基础词汇',
        'recommended_module': context.get('vks_level', 'B') if context else 'word',
        'confidence': 0.5,
        'estimated_time': 300,
        'algorithm_version': 'simple_1.0'
    }

def get_simple_due_reviews(user_id, limit):
    """简化版到期复习（当SRS不可用时）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT up.word_id, w.pinyin, up.mastery_level, up.last_studied
            FROM user_progress up
            JOIN word w ON up.word_id = w.id
            WHERE up.user_id = ?
            AND up.last_studied < datetime('now', '-3 days')
            ORDER BY up.last_studied ASC
            LIMIT ?
        """, (user_id, limit))
        
        results = cursor.fetchall()
        reviews = []
        
        for result in results:
            word_id, pinyin, mastery_level, last_studied = result
            reviews.append({
                'word_id': word_id,
                'word': pinyin,
                'mastery_level': mastery_level,
                'days_overdue': 3,
                'priority_score': 1 - mastery_level,
                'recommended_module': 'review'
            })
        
        return reviews
        
    finally:
        conn.close()

def generate_dashboard_data(user_id, time_range):
    """生成dashboard数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 时间范围过滤
        if time_range == 'week':
            date_filter = "datetime('now', '-7 days')"
        elif time_range == 'month':
            date_filter = "datetime('now', '-30 days')"
        else:
            date_filter = "datetime('1970-01-01')"  # 所有时间
        
        # 学习概览
        cursor.execute(f"""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(duration_seconds) as total_time,
                AVG(duration_seconds) as avg_session_time,
                COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_sessions
            FROM learning_session
            WHERE user_id = ? AND start_time >= {date_filter}
        """, (user_id,))
        
        overview = cursor.fetchone()
        
        # 掌握程度分布
        cursor.execute("""
            SELECT 
                COUNT(CASE WHEN mastery_level >= 0.8 THEN 1 END) as mastered,
                COUNT(CASE WHEN mastery_level >= 0.6 AND mastery_level < 0.8 THEN 1 END) as learning,
                COUNT(CASE WHEN mastery_level < 0.6 THEN 1 END) as struggling,
                COUNT(*) as total
            FROM user_progress
            WHERE user_id = ?
        """, (user_id,))
        
        mastery_dist = cursor.fetchone()
        
        # 准确率趋势（按题型）
        cursor.execute(f"""
            SELECT 
                er.question_type,
                COUNT(*) as total,
                SUM(CASE WHEN er.is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM exercise_record er
            JOIN learning_session ls ON er.session_id = ls.session_id
            WHERE ls.user_id = ? AND er.created_at >= {date_filter}
            GROUP BY er.question_type
        """, (user_id,))
        
        accuracy_by_type = cursor.fetchall()
        
        # 学习时间趋势（最近7天）
        cursor.execute("""
            SELECT 
                DATE(start_time) as date,
                SUM(duration_seconds) as daily_time,
                COUNT(*) as daily_sessions
            FROM learning_session
            WHERE user_id = ? AND start_time >= datetime('now', '-7 days')
            GROUP BY DATE(start_time)
            ORDER BY date
        """, (user_id,))
        
        daily_stats = cursor.fetchall()
        
        dashboard = {
            'overview': {
                'totalSessions': overview[0] or 0,
                'totalStudyTime': overview[1] or 0,
                'averageSessionTime': overview[2] or 0,
                'completionRate': (overview[3] / max(overview[0], 1)) if overview[0] else 0
            },
            'masteryDistribution': {
                'mastered': mastery_dist[0] or 0,
                'learning': mastery_dist[1] or 0,
                'struggling': mastery_dist[2] or 0,
                'total': mastery_dist[3] or 0
            },
            'accuracyByType': [
                {
                    'questionType': row[0],
                    'accuracy': row[2] / max(row[1], 1),
                    'totalAttempts': row[1]
                }
                for row in accuracy_by_type
            ],
            'dailyProgress': [
                {
                    'date': row[0],
                    'studyTime': row[1] or 0,
                    'sessions': row[2] or 0
                }
                for row in daily_stats
            ]
        }
        
        return dashboard
        
    finally:
        conn.close()

# ================================================
# 应用初始化
# ================================================

def initialize_database():
    """初始化数据库和测试数据"""
    try:
        with app.app_context():
            db.create_all()
            print("✅ 数据库表创建成功")
            
            # 检查是否需要添加初始数据
            if Word.query.count() == 0:
                print("📝 添加初始词汇数据...")
                word = Word(pinyin='fāshēng', definition='happen; occur; take place')
                db.session.add(word)
                db.session.commit()
                
                # 添加词汇组件
                example = Example(
                    sentence='不愿意发生的事情终于出现了。',
                    pinyin='不/bù 愿意/yuànyì 发生/fāshēng 的/de 事情/shìqíng 终于/zhōngyú 出现/chūxiàn 了/le 。',
                    translation="What I didn't want to happen finally happened.",
                    audio='/audio/example1.mp3',
                    word_id=word.id
                )
                db.session.add(example)
                
                collocation1 = Collocation(
                    collocation='容易（三级）发生',
                    translation='easy to happen',
                    audio='/audio/collocation1.mp3',
                    word_id=word.id
                )
                collocation2 = Collocation(
                    collocation='事情（二级）发生',
                    translation='things happen',
                    audio='/audio/collocation2.mp3',
                    word_id=word.id
                )
                db.session.add(collocation1)
                db.session.add(collocation2)
                
                character1 = Character(
                    character='发',
                    pinyin='fā',
                    definition='come or bring into existence; generate',
                    audio='/audio/character1.mp3',
                    word_id=word.id
                )
                character2 = Character(
                    character='生',
                    pinyin='shēng',
                    definition='bear; generate',
                    audio='/audio/character2.mp3',
                    word_id=word.id
                )
                db.session.add(character1)
                db.session.add(character2)
                
                db.session.commit()
                print("✅ 初始数据添加完成")
            
            # 检查是否有测试数据
            if UserProfile.query.count() == 0:
                print("📊 生成测试数据...")
                try:
                    import simple_test_data
                    simple_test_data.generate_simple_test_data()
                except Exception as e:
                    print(f"⚠️  测试数据生成失败: {str(e)}")
        
        # 初始化推荐引擎
        init_recommendation_engine()
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {str(e)}")

if __name__ == '__main__':
    print("🚀 启动第二阶段自适应学习API服务...")
    
    # 初始化数据库
    initialize_database()
    
    print("\n📍 第二阶段API服务信息:")
    print("   🎯 智能推荐引擎: ", "✅ 已启用" if recommendation_engine else "⚠️  简化模式")
    print("   🔄 间隔重复算法: ", "✅ 已启用" if spaced_repetition else "⚠️  简化模式")
    print("   📊 学习分析功能: ✅ 已启用")
    print("   🌐 服务地址: http://localhost:5004")
    print("\n📋 主要新功能:")
    print("   - GET  /api/adaptive/recommendation/<user_id> - 个性化推荐")
    print("   - GET  /api/review/user/<user_id>/due - 到期复习")
    print("   - GET  /api/analytics/user/<user_id>/dashboard - 学习dashboard")
    print("   - POST /api/adaptive/feedback - 推荐反馈")
    
    app.run(debug=True, port=5004, use_reloader=False)
