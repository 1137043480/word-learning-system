#!/usr/bin/env python3
"""
第二阶段扩展API服务
集成自适应推荐引擎、学习分析和复习调度功能
"""

from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import json
import random
import sqlite3
from sqlalchemy import func

# 导入自适应引擎
try:
    from adaptive_engine import AdaptiveRecommendationEngine, SpacedRepetitionAlgorithm
except ImportError:
    print("⚠️  自适应引擎模块未找到，将使用简化版本")
    AdaptiveRecommendationEngine = None
    SpacedRepetitionAlgorithm = None

# 导入认证模块
try:
    from auth import AuthManager, require_auth
except ImportError:
    print("⚠️  认证模块未找到，将禁用认证功能")
    AuthManager = None
    require_auth = lambda f: f  # 空装饰器

# 导入数据隔离模块
try:
    from user_data_isolation import (
        require_authentication, 
        check_data_ownership,
        get_current_user_from_request
    )
except ImportError:
    print("⚠️  数据隔离模块未找到，将使用基础功能")
    require_authentication = lambda allow_url_param=True: lambda f: f
    check_data_ownership = lambda: lambda f: f
    get_current_user_from_request = lambda: (None, False)

# 导入易混淆词API模块
try:
    from confusable_api import register_confusable_apis
except ImportError:
    print("⚠️  易混淆词API模块未找到")
    register_confusable_apis = None

app = Flask(__name__)
CORS(app, supports_credentials=True)  # 支持credentials以便使用cookies

# 配置Session
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

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

class LearningEvent(db.Model):
    __tablename__ = 'learning_event'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False, index=True)
    event_type = db.Column(db.String(50), nullable=False)
    target = db.Column(db.String(100))
    event_data = db.Column(db.Text)  # JSON string
    page_url = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, nullable=False)
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
            "POST /api/learning/events/batch - 批量记录学习事件",
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
    
    hanzi = ''.join([char.character for char in characters]) if characters else None

    word_data = {
        'id': word.id,
        'pinyin': word.pinyin,
        'definition': word.definition,
        'hanzi': hanzi,
        'examples': [
            {
                'sentence': ex.sentence,
                'pinyin': ex.pinyin,
                'translation': ex.translation,
                'audio': ex.audio
            }
            for ex in examples
        ],
        'collocations': [
            {
                'collocation': col.collocation,
                'translation': col.translation,
                'audio': col.audio
            }
            for col in collocations
        ],
        'characters': [
            {
                'character': char.character,
                'pinyin': char.pinyin,
                'definition': char.definition,
                'audio': char.audio
            }
            for char in characters
        ]
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
@require_authentication(allow_url_param=True)
def start_learning_session(current_user_id=None, **kwargs):
    try:
        data = request.get_json()
        
        # 验证权限：确保用户只能为自己创建会话
        request_user_id = data.get('userId')
        if request_user_id and request_user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权为其他用户创建会话',
                'code': 'PERMISSION_DENIED'
            }), 403
        
        # 使用认证的用户ID
        session = LearningSession(
            session_id=data['sessionId'],
            user_id=current_user_id,  # 使用认证的用户ID
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
@require_authentication(allow_url_param=True)
def end_learning_session(current_user_id=None, **kwargs):
    try:
        data = request.get_json()
        
        session = LearningSession.query.filter_by(session_id=data['sessionId']).first()
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        # 验证权限：只能结束自己的会话
        if session.user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权结束其他用户的会话',
                'code': 'PERMISSION_DENIED'
            }), 403
        
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
@require_authentication(allow_url_param=True)
def record_exercise_result(current_user_id=None, **kwargs):
    try:
        data = request.get_json()
        
        # 验证权限：检查session是否属于当前用户
        session = LearningSession.query.filter_by(session_id=data['sessionId']).first()
        if session and session.user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权为其他用户的会话记录练习',
                'code': 'PERMISSION_DENIED'
            }), 403
        
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


@app.route('/api/learning/events/batch', methods=['POST'])
def record_batch_events():
    """批量记录学习事件（页面停留、点击、音频播放等）"""
    try:
        data = request.get_json()
        session_id = data.get('sessionId')
        events = data.get('events', [])
        
        if not session_id:
            return jsonify({'success': False, 'error': 'sessionId is required'}), 400
        
        if not events:
            return jsonify({'success': True, 'message': 'No events to record', 'count': 0})
        
        recorded_count = 0
        for event in events:
            try:
                timestamp_str = event.get('timestamp', '')
                if isinstance(timestamp_str, str) and timestamp_str:
                    try:
                        event_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    except (ValueError, TypeError):
                        event_time = datetime.utcnow()
                else:
                    event_time = datetime.utcnow()
                
                learning_event = LearningEvent(
                    session_id=session_id,
                    event_type=event.get('type', 'unknown'),
                    target=event.get('target'),
                    event_data=json.dumps(event.get('data')) if event.get('data') else None,
                    page_url=event.get('pageUrl'),
                    timestamp=event_time
                )
                db.session.add(learning_event)
                recorded_count += 1
            except Exception as e:
                print(f"⚠️  跳过无效事件: {str(e)}")
                continue
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Recorded {recorded_count} events',
            'count': recorded_count
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

    def get_word_hanzi(w):
        chars = Character.query.filter_by(word_id=w.id).order_by(Character.id.asc()).all()
        return ''.join([c.character for c in chars]) if chars else w.pinyin

    base_hanzi = get_word_hanzi(word)

    def build_options():
        candidates = {base_hanzi}
        random_candidates = (
            Word.query.filter(Word.id != word.id)
            .order_by(db.func.random())
            .limit(desired_option_count * 2)
            .all()
        )
        for candidate in random_candidates:
            cand_hanzi = get_word_hanzi(candidate)
            if cand_hanzi:
                candidates.add(cand_hanzi)
            if len(candidates) >= desired_option_count:
                break

        option_list = list(candidates)
        random.shuffle(option_list)
        return option_list[:desired_option_count]

    options = build_options()
    options = build_options()
    questions = []

    if word.id == 1:
        # Override to strict prototype content for "发生" (word id 1) to match images perfectly
        questions = [
            {
                'id': f'definition-{word.id}',
                'type': 'definition',
                'question': 'happen; occur; take place',
                'options': ['嘴', '哪儿', '第一', '发生'],
                'correctAnswer': '发生'
            },
            {
                'id': f'collocation-{word.id}-1',
                'type': 'collocation',
                'question': '容易 ( )',
                'options': ['最后', '一直', '五', '发生'],
                'correctAnswer': '发生'
            },
            {
                'id': f'choose_word-{word.id}-1',
                'type': 'choose_word',
                'question': '不愿意 ( ) 的事情终于出现了。',
                'options': ['发生', '发现'],
                'correctAnswer': '发生'
            },
            {
                'id': f'sentence-{word.id}-1',
                'type': 'fill_word',
                'question': '不愿意发 ( ) 的事情终于出现了。',
                'options': [],
                'correctAnswer': '生'
            }
        ]
        return jsonify({
            'success': True,
            'data': {
                'wordId': word.id,
                'word': base_hanzi,
                'definition': 'happen; occur; take place',
                'questions': questions[:question_limit] if question_limit < len(questions) else questions
            }
        })

    # Default logic for other words
    questions.append({
        'id': f'definition-{word.id}',
        'type': 'definition',
        'question': word.definition,
        'options': options,
        'correctAnswer': base_hanzi,
        'feedback': f"正确答案：{base_hanzi}。释义：{word.definition}"
    })

    collocations = (
        Collocation.query.filter_by(word_id=word.id)
        .order_by(Collocation.id.asc())
        .limit(question_limit)
        .all()
    )
    for index, collocation in enumerate(collocations, start=1):
        placeholder = collocation.collocation.replace(base_hanzi, ' ( ) ')
        if placeholder == collocation.collocation:
            placeholder = collocation.collocation
        questions.append({
            'id': f'collocation-{word.id}-{index}',
            'type': 'collocation',
            'question': placeholder,
            'options': options,
            'correctAnswer': base_hanzi,
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
            sentence_placeholder = example.sentence.replace(base_hanzi, ' ( ) ')
            if sentence_placeholder == example.sentence:
                sentence_placeholder = example.sentence
            questions.append({
                'id': f'sentence-{word.id}-1',
                'type': 'fill_word',
                'question': sentence_placeholder,
                'options': options,
                'correctAnswer': base_hanzi,
                'feedback': f"例句：{example.sentence}；翻译：{example.translation}"
            })

    questions = questions[:question_limit]

    if not questions:
        return jsonify({'success': False, 'error': 'No exercises available for this word'}), 404

    return jsonify({
        'success': True,
        'data': {
            'wordId': word.id,
            'word': base_hanzi,
            'definition': word.definition,
            'options': options,
            'questionCount': len(questions),
            'questions': questions
        }
    })


@app.route('/api/users', methods=['GET'])
def get_users():
    """获取用户列表，可选搜索与限制数量"""
    try:
        try:
            limit = int(request.args.get('limit', 50))
        except (TypeError, ValueError):
            limit = 50
        limit = max(1, min(limit, 200))

        search = (request.args.get('search') or '').strip()

        query = UserProfile.query
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (UserProfile.user_id.ilike(pattern)) |
                (UserProfile.username.ilike(pattern))
            )

        users = query.order_by(UserProfile.created_at.desc()).limit(limit).all()
        user_ids = [user.user_id for user in users]

        progress_map: dict[str, dict[str, object]] = {}
        if user_ids:
            progress_rows = (
                db.session.query(
                    UserProgress.user_id,
                    func.count(UserProgress.word_id).label('words_studied'),
                    func.max(UserProgress.last_studied).label('last_studied')
                )
                .filter(UserProgress.user_id.in_(user_ids))
                .group_by(UserProgress.user_id)
                .all()
            )
            for row in progress_rows:
                progress_map[row.user_id] = {
                    'wordsStudied': int(row.words_studied or 0),
                    'lastStudied': row.last_studied.isoformat() if row.last_studied else None
                }

        last_session_map: dict[str, dict[str, object]] = {}
        if user_ids:
            last_session_subquery = (
                db.session.query(
                    LearningSession.user_id.label('user_id'),
                    func.max(LearningSession.start_time).label('last_start')
                )
                .filter(LearningSession.user_id.in_(user_ids))
                .group_by(LearningSession.user_id)
                .subquery()
            )

            last_sessions = (
                db.session.query(
                    LearningSession.user_id,
                    LearningSession.word_id,
                    LearningSession.module_type,
                    LearningSession.session_type,
                    LearningSession.start_time,
                    Word.pinyin.label('word')
                )
                .join(last_session_subquery, (
                    (LearningSession.user_id == last_session_subquery.c.user_id) &
                    (LearningSession.start_time == last_session_subquery.c.last_start)
                ))
                .outerjoin(Word, Word.id == LearningSession.word_id)
                .all()
            )

            for row in last_sessions:
                last_session_map[row.user_id] = {
                    'wordId': row.word_id,
                    'word': row.word,
                    'moduleType': row.module_type,
                    'sessionType': row.session_type,
                    'startedAt': row.start_time.isoformat() if row.start_time else None
                }

        data = []
        for user in users:
            metrics = progress_map.get(user.user_id, {})
            data.append({
                'userId': user.user_id,
                'username': user.username,
                'languageLevel': user.language_level,
                'nativeLanguage': user.native_language,
                'createdAt': user.created_at.isoformat() if user.created_at else None,
                'updatedAt': user.updated_at.isoformat() if user.updated_at else None,
                'wordsStudied': metrics.get('wordsStudied', 0),
                'lastStudied': metrics.get('lastStudied'),
                'lastSession': last_session_map.get(user.user_id)
            })

        return jsonify({'success': True, 'data': data})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500


@app.route('/api/users/<user_id>/sessions/recent', methods=['GET'])
@require_authentication(allow_url_param=True)
def get_recent_sessions(user_id, current_user_id=None, **kwargs):
    """获取指定用户最近的学习会话列表"""
    try:
        # 验证权限：用户只能查看自己的会话
        if user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权访问其他用户的数据',
                'code': 'PERMISSION_DENIED'
            }), 403
        
        try:
            limit = int(request.args.get('limit', 10))
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, 50))

        sessions = (
            db.session.query(
                LearningSession.session_id,
                LearningSession.word_id,
                LearningSession.module_type,
                LearningSession.session_type,
                LearningSession.start_time,
                LearningSession.end_time,
                LearningSession.duration_seconds,
                Word.pinyin.label('word')
            )
            .outerjoin(Word, Word.id == LearningSession.word_id)
            .filter(LearningSession.user_id == user_id)
            .order_by(LearningSession.start_time.desc())
            .limit(limit)
            .all()
        )

        data = []
        for item in sessions:
            data.append({
                'sessionId': item.session_id,
                'wordId': item.word_id,
                'word': item.word,
                'moduleType': item.module_type,
                'sessionType': item.session_type,
                'startTime': item.start_time.isoformat() if item.start_time else None,
                'endTime': item.end_time.isoformat() if item.end_time else None,
                'durationSeconds': item.duration_seconds
            })

        return jsonify({'success': True, 'data': data})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500


# ================================================
# 第二阶段自适应推荐API
# ================================================

@app.route('/api/adaptive/recommendation/<user_id>', methods=['GET'])
@require_authentication(allow_url_param=True)
def get_adaptive_recommendation(user_id, current_user_id=None, **kwargs):
    """获取个性化推荐"""
    try:
        # 验证权限：用户只能获取自己的推荐
        if user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权访问其他用户的数据',
                'code': 'PERMISSION_DENIED'
            }), 403
        
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
            
            # --- BEGIN PROTOTYPE OVERRIDE ---
            # 强制将推荐词汇设置为"发生" (word_id: 1) 以匹配原型设计
            recommendation['word_id'] = 1
            recommendation['word'] = '发生'
            recommendation['reason'] = '推荐学习新词汇，当前掌握程度较低'
            
            # 根据 VKS 测试选项动态分配入口
            vks_level = context.get('vks_level') if context else None
            if vks_level:
                vks_modules = {
                    'A': 'character',
                    'B': 'word',
                    'C': 'collocation',
                    'D': 'sentence',
                    'E': 'exercise'
                }
                recommendation['recommended_module'] = vks_modules.get(vks_level, 'word')
            elif recommendation.get('recommended_module') is None:
                recommendation['recommended_module'] = 'word'
            # --- END PROTOTYPE OVERRIDE ---
            
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
@require_authentication(allow_url_param=True)
def record_recommendation_feedback(current_user_id=None, **kwargs):
    """记录推荐反馈"""
    try:
        data = request.get_json()
        
        # 验证权限：只能提交自己的反馈
        feedback_user_id = data.get('userId')
        if feedback_user_id and feedback_user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权提交其他用户的反馈',
                'code': 'PERMISSION_DENIED'
            }), 403
        
        if recommendation_engine:
            success = recommendation_engine.record_recommendation_feedback(
                data['recommendationId'],
                current_user_id,  # 使用认证的用户ID
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
@require_authentication(allow_url_param=True)
def get_due_reviews(user_id, current_user_id=None, **kwargs):
    """获取到期复习内容"""
    try:
        # 验证权限：用户只能查看自己的复习
        if user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权访问其他用户的数据',
                'code': 'PERMISSION_DENIED'
            }), 403
        
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
@require_authentication(allow_url_param=True)
def get_user_dashboard(user_id, current_user_id=None, **kwargs):
    """获取用户学习dashboard数据"""
    try:
        # 验证权限：用户只能查看自己的Dashboard
        if user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权访问其他用户的数据',
                'code': 'PERMISSION_DENIED'
            }), 403
        
        time_range = request.args.get('range', 'month')  # week, month, all
        
        dashboard_data = generate_dashboard_data(user_id, time_range)
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/user/<user_id>/progress', methods=['GET'])
@require_authentication(allow_url_param=True)
def get_user_detailed_progress(user_id, current_user_id=None, **kwargs):
    """获取用户详细学习进度"""
    try:
        # 验证权限：用户只能查看自己的进度
        if user_id != current_user_id:
            return jsonify({
                'success': False,
                'error': '无权访问其他用户的数据',
                'code': 'PERMISSION_DENIED'
            }), 403
        
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
        
        # 今日统计
        cursor.execute("""
            SELECT 
                COUNT(*) as sessions,
                SUM(duration_seconds) as study_time,
                COUNT(DISTINCT word_id) as words_reviewed
            FROM learning_session
            WHERE user_id = ? AND DATE(start_time) = DATE('now')
        """, (user_id,))
        
        today = cursor.fetchone()
        
        # 今日练习统计
        cursor.execute("""
            SELECT 
                COUNT(*) as exercises,
                AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as accuracy
            FROM exercise_record er
            JOIN learning_session ls ON er.session_id = ls.session_id
            WHERE ls.user_id = ? AND DATE(er.created_at) = DATE('now')
        """, (user_id,))
        
        today_exercises = cursor.fetchone()
        
        # 到期复习数量
        cursor.execute("""
            SELECT COUNT(*) FROM user_progress
            WHERE user_id = ? AND next_review_suggested <= datetime('now')
        """, (user_id,))
        
        due_reviews = cursor.fetchone()[0]
        
        # 整体进度
        cursor.execute("""
            SELECT COUNT(*) FROM word
        """)
        total_words = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT 
                AVG(mastery_level) as avg_mastery
            FROM user_progress
            WHERE user_id = ?
        """, (user_id,))
        
        avg_mastery = cursor.fetchone()[0] or 0
        
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
            ],
            'todayStats': {
                'studyTimeMinutes': int((today[1] or 0) / 60),
                'wordsReviewed': today[2] or 0,
                'exercisesCompleted': today_exercises[0] or 0,
                'averageAccuracy': today_exercises[1] or 0
            },
            'overallProgress': {
                'totalWords': total_words,
                'studiedWords': mastery_dist[3] or 0,
                'masteredWords': mastery_dist[0] or 0,
                'averageMastery': avg_mastery
            },
            'dueReviews': due_reviews,
            'recommendations': [],
            'strengths': [],
            'weaknesses': []
        }
        
        return dashboard
        
    finally:
        conn.close()

# ================================================
# 用户认证API
# ================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        if not AuthManager:
            return jsonify({'success': False, 'error': '认证系统未启用'}), 503
        
        auth_manager = AuthManager()
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        native_language = data.get('native_language', 'English')
        
        # 验证必填字段
        if not username or not password:
            return jsonify({'success': False, 'error': '用户名和密码不能为空'}), 400
        
        # 验证密码强度
        if len(password) < 6:
            return jsonify({'success': False, 'error': '密码长度至少6个字符'}), 400
        
        # 注册用户
        result = auth_manager.register_user(
            username=username,
            password=password,
            email=email,
            native_language=native_language
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': {
                    'user_id': result['user_id'],
                    'username': username
                },
                'message': result['message']
            })
        else:
            return jsonify({'success': False, 'error': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        if not AuthManager:
            return jsonify({'success': False, 'error': '认证系统未启用'}), 503
        
        auth_manager = AuthManager()
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('remember_me', False)
        
        if not username or not password:
            return jsonify({'success': False, 'error': '用户名和密码不能为空'}), 400
        
        # 执行登录
        result = auth_manager.login(username, password)
        
        if result['success']:
            # 创建响应
            response = make_response(jsonify({
                'success': True,
                'data': {
                    'user_id': result['user_id'],
                    'username': result['username'],
                    'email': result.get('email'),
                    'session_token': result['session_token']
                },
                'message': result['message']
            }))
            
            # 设置cookie（可选，也可以让前端使用localStorage）
            max_age = 7 * 24 * 60 * 60 if remember_me else None  # 7天或session
            response.set_cookie(
                'session_token',
                result['session_token'],
                max_age=max_age,
                httponly=True,
                samesite='Lax'
            )
            
            return response
        else:
            return jsonify({'success': False, 'error': result['message']}), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """用户登出"""
    try:
        if not AuthManager:
            return jsonify({'success': False, 'error': '认证系统未启用'}), 503
        
        auth_manager = AuthManager()
        # 从header或cookie获取session token
        session_token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
        
        if not session_token:
            return jsonify({'success': False, 'error': '未登录'}), 401
        
        # 执行登出
        result = auth_manager.logout(session_token)
        
        if result['success']:
            # 清除cookie
            response = make_response(jsonify({
                'success': True,
                'message': result['message']
            }))
            response.set_cookie('session_token', '', max_age=0)
            return response
        else:
            return jsonify({'success': False, 'error': result['message']}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """获取当前登录用户信息"""
    try:
        if not AuthManager:
            return jsonify({'success': False, 'error': '认证系统未启用'}), 503
        
        auth_manager = AuthManager()
        # 从header或cookie获取session token
        session_token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
        
        if not session_token:
            return jsonify({'success': False, 'error': '未登录', 'code': 'NOT_AUTHENTICATED'}), 401
        
        # 验证session
        validation = auth_manager.validate_session(session_token)
        
        if not validation['valid']:
            return jsonify({'success': False, 'error': validation['message'], 'code': 'INVALID_SESSION'}), 401
        
        # 获取用户信息
        user_info = auth_manager.get_user_info(validation['user_id'])
        
        if user_info:
            return jsonify({
                'success': True,
                'data': user_info
            })
        else:
            return jsonify({'success': False, 'error': '用户不存在'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/auth/validate', methods=['GET'])
def validate_session():
    """验证session是否有效（用于前端检查登录状态）"""
    try:
        if not AuthManager:
            return jsonify({'success': False, 'valid': False}), 503
        
        auth_manager = AuthManager()
        session_token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
        
        if not session_token:
            return jsonify({'success': True, 'valid': False, 'reason': 'no_token'})
        
        validation = auth_manager.validate_session(session_token)
        
        return jsonify({
            'success': True,
            'valid': validation['valid'],
            'user_id': validation.get('user_id'),
            'reason': validation.get('message')
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
            
            # 注册易混淆词API
            if register_confusable_apis:
                try:
                    register_confusable_apis(app, db, require_authentication, check_data_ownership)
                except Exception as e:
                    print(f"⚠️  易混淆词API注册失败: {str(e)}")
        
        # 初始化推荐引擎
        init_recommendation_engine()
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {str(e)}")

# 在module级别注册易混淆词API（gunicorn不走__main__）
if register_confusable_apis:
    try:
        register_confusable_apis(app, db, require_authentication, check_data_ownership)
    except Exception as e:
        print(f"⚠️  易混淆词API模块级注册失败: {str(e)}")

# gunicorn启动时自动初始化
initialize_database()

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
