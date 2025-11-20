from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure the SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'words_extended.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# =====================================================
# 数据库模型 (包含所有现有和新增模型)
# =====================================================

# 现有模型
class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pinyin = db.Column(db.String(80), nullable=False)
    definition = db.Column(db.String(200), nullable=False)
    examples = db.relationship('Example', backref='word', lazy=True)
    collocations = db.relationship('Collocation', backref='word', lazy=True)
    characters = db.relationship('Character', backref='word', lazy=True)

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

# 新增的时间追踪和自适应学习模型
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
    session_id = db.Column(db.String(100), db.ForeignKey('learning_session.session_id'), nullable=False)
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
    __table_args__ = (db.UniqueConstraint('user_id', 'word_id', name='uq_user_word'),)

class LearningEvent(db.Model):
    __tablename__ = 'learning_event'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('learning_session.session_id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    event_target = db.Column(db.String(100))
    event_data = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False)
    page_url = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    focus_time_seconds = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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

# =====================================================
# 原有API路由
# =====================================================

@app.route('/')
def home():
    return "Welcome to the Extended Word Learning API with Time Tracking"

@app.route('/word/<int:id>', methods=['GET'])
def get_word(id):
    word = Word.query.get_or_404(id)
    word_data = {
        'id': word.id,
        'pinyin': word.pinyin,
        'definition': word.definition,
        'examples': [{'sentence': ex.sentence, 'pinyin': ex.pinyin, 'translation': ex.translation, 'audio': ex.audio} for ex in word.examples],
        'collocations': [{'collocation': col.collocation, 'translation': col.translation, 'audio': col.audio} for col in word.collocations],
        'characters': [{'character': char.character, 'pinyin': char.pinyin, 'definition': char.definition, 'audio': char.audio} for char in word.characters]
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
    correct_answer = 'D'  # Mock correct answer
    return jsonify({'correct': answer == correct_answer})

# =====================================================
# 新增的时间追踪API
# =====================================================

@app.route('/api/learning/session/start', methods=['POST'])
def start_learning_session():
    """开始学习会话"""
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
        
        print(f"✅ Started session: {data['sessionId']} for user {data['userId']}")
        
        return jsonify({
            'success': True,
            'sessionId': data['sessionId'],
            'message': 'Session started successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error starting session: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learning/session/end', methods=['POST'])
def end_learning_session():
    """结束学习会话"""
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
        
        # 更新用户进度
        update_user_progress(session)
        
        db.session.commit()
        
        print(f"✅ Ended session: {data['sessionId']} - Duration: {data['durationSeconds']}s")
        
        return jsonify({
            'success': True,
            'message': 'Session ended successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error ending session: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learning/exercise/record', methods=['POST'])
def record_exercise_result():
    """记录练习结果"""
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
            response_time_seconds=data['responseTimeSeconds'],
            hesitation_count=data.get('hesitationCount', 0),
            attempt_count=data.get('attemptCount', 1),
            is_first_attempt=data.get('isFirstAttempt', True)
        )
        
        db.session.add(exercise)
        
        # 更新用户练习统计
        update_exercise_statistics(data['sessionId'], data)
        
        db.session.commit()
        
        print(f"✅ Recorded exercise: {data['questionId']} - Correct: {data['isCorrect']}")
        
        return jsonify({
            'success': True,
            'message': 'Exercise recorded successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error recording exercise: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/learning/events/batch', methods=['POST'])
def record_batch_events():
    """批量记录学习事件"""
    try:
        data = request.get_json()
        session_id = data['sessionId']
        events = data['events']
        
        for event_data in events:
            event = LearningEvent(
                session_id=session_id,
                event_type=event_data['type'],
                event_target=event_data.get('target'),
                event_data=json.dumps(event_data.get('data')) if event_data.get('data') else None,
                timestamp=datetime.fromisoformat(event_data['timestamp'].replace('Z', '+00:00')),
                page_url=event_data.get('pageUrl'),
                is_active=event_data.get('isActive', True),
                focus_time_seconds=event_data.get('focusTime')
            )
            db.session.add(event)
        
        db.session.commit()
        
        print(f"✅ Recorded {len(events)} events for session {session_id}")
        
        return jsonify({
            'success': True,
            'eventsRecorded': len(events)
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error recording batch events: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/<user_id>/progress', methods=['GET'])
def get_user_progress(user_id):
    """获取用户学习进度"""
    try:
        progress_list = UserProgress.query.filter_by(user_id=user_id).all()
        
        result = []
        for progress in progress_list:
            word = Word.query.get(progress.word_id)
            result.append({
                'wordId': progress.word_id,
                'word': word.pinyin if word else None,
                'masteryLevel': progress.mastery_level,
                'confidenceScore': progress.confidence_score,
                'totalStudyTime': progress.total_study_time_seconds,
                'totalSessions': progress.total_sessions,
                'accuracyRate': progress.correct_attempts / max(progress.total_attempts, 1),
                'lastStudied': progress.last_studied.isoformat() if progress.last_studied else None,
                'nextReview': progress.next_review_suggested.isoformat() if progress.next_review_suggested else None
            })
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        print(f"❌ Error getting user progress: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# =====================================================
# 辅助函数
# =====================================================

def update_user_progress(session):
    """更新用户学习进度"""
    progress = UserProgress.query.filter_by(
        user_id=session.user_id, 
        word_id=session.word_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=session.user_id,
            word_id=session.word_id,
            first_studied=session.start_time
        )
        db.session.add(progress)
    
    # 更新基本统计
    progress.total_sessions += 1
    progress.total_study_time_seconds += session.duration_seconds or 0
    progress.last_studied = session.end_time or session.start_time
    
    # 更新模块学习次数
    if session.module_type == 'character':
        progress.character_study_count += 1
    elif session.module_type == 'word':
        progress.word_study_count += 1
    elif session.module_type == 'collocation':
        progress.collocation_study_count += 1
    elif session.module_type == 'sentence':
        progress.sentence_study_count += 1
    
    # 计算学习效率
    if session.duration_seconds and session.duration_seconds > 0:
        base_time = 60  # 基准时间60秒
        efficiency = min(base_time / session.duration_seconds, 2.0)
        if session.completed:
            efficiency *= 1.2
        
        if progress.learning_efficiency:
            progress.learning_efficiency = (progress.learning_efficiency * 0.8) + (efficiency * 0.2)
        else:
            progress.learning_efficiency = efficiency
    
    progress.updated_at = datetime.utcnow()

def update_exercise_statistics(session_id, exercise_data):
    """更新练习统计"""
    session = LearningSession.query.filter_by(session_id=session_id).first()
    if not session:
        return
    
    progress = UserProgress.query.filter_by(
        user_id=session.user_id,
        word_id=session.word_id
    ).first()
    
    if not progress:
        return
    
    # 更新总体练习统计
    progress.total_attempts += 1
    if exercise_data['isCorrect']:
        progress.correct_attempts += 1
        progress.consecutive_correct += 1
        progress.consecutive_incorrect = 0
    else:
        progress.consecutive_incorrect += 1
        progress.consecutive_correct = 0
    
    # 更新具体题型统计
    question_type = exercise_data['questionType']
    if question_type == 'definition':
        progress.definition_attempts += 1
        if exercise_data['isCorrect']:
            progress.definition_correct += 1
    elif question_type == 'collocation':
        progress.collocation_attempts += 1
        if exercise_data['isCorrect']:
            progress.collocation_correct += 1
    elif question_type == 'fill_word':
        progress.fill_word_attempts += 1
        if exercise_data['isCorrect']:
            progress.fill_word_correct += 1
    
    # 更新掌握程度
    update_mastery_level(progress, exercise_data)
    
    progress.updated_at = datetime.utcnow()

def update_mastery_level(progress, exercise_data):
    """更新掌握程度算法"""
    if progress.total_attempts > 0:
        accuracy_rate = progress.correct_attempts / progress.total_attempts
        
        # 考虑连续正确次数的权重
        consecutive_bonus = min(progress.consecutive_correct * 0.1, 0.3)
        
        # 考虑不同题型的权重
        type_weights = {
            'definition': 0.3,
            'collocation': 0.4, 
            'fill_word': 0.5
        }
        type_weight = type_weights.get(exercise_data['questionType'], 0.3)
        
        # 考虑响应时间的影响
        response_time = exercise_data.get('responseTimeSeconds', 30)
        time_factor = max(0.5, min(1.5, 15.0 / response_time))
        
        # 综合计算掌握程度
        base_mastery = accuracy_rate * type_weight * time_factor
        mastery_with_bonus = min(1.0, base_mastery + consecutive_bonus)
        
        # 平滑更新
        if progress.mastery_level:
            progress.mastery_level = (progress.mastery_level * 0.7) + (mastery_with_bonus * 0.3)
        else:
            progress.mastery_level = mastery_with_bonus
        
        # 更新信心分数
        if exercise_data['isCorrect']:
            confidence_boost = 0.1 if exercise_data.get('hesitationCount', 0) == 0 else 0.05
            progress.confidence_score = min(1.0, (progress.confidence_score or 0) + confidence_boost)
        else:
            confidence_penalty = 0.15
            progress.confidence_score = max(0.0, (progress.confidence_score or 0) - confidence_penalty)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
        print(f"🎯 Extended database created at: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("📊 New tables: user_profile, learning_session, exercise_record, user_progress, learning_event, adaptive_recommendation")

        # Add initial data if needed
        if Word.query.count() == 0:
            print("📝 Adding initial word data...")
            word = Word(pinyin='fāshēng', definition='happen; occur; take place')
            db.session.add(word)
            db.session.commit()

            example = Example(sentence='不愿意发生的事情终于出现了。',
                              pinyin='不/bù 愿意/yuànyì 发生/fāshēng 的/de 事情/shìqíng 终于/zhōngyú 出现/chūxiàn 了/le 。',
                              translation="What I didn't want to happen finally happened.",
                              audio='/audio/example1.mp3',
                              word_id=word.id)
            db.session.add(example)

            collocation1 = Collocation(collocation='容易（三级）发生',
                                       translation='easy to happen',
                                       audio='/audio/collocation1.mp3',
                                       word_id=word.id)
            collocation2 = Collocation(collocation='事情（二级）发生',
                                       translation='things happen',
                                       audio='/audio/collocation2.mp3',
                                       word_id=word.id)
            db.session.add(collocation1)
            db.session.add(collocation2)

            character1 = Character(character='发',
                                   pinyin='fā',
                                   definition='come or bring into existence; generate',
                                   audio='/audio/character1.mp3',
                                   word_id=word.id)
            character2 = Character(character='生',
                                   pinyin='shēng',
                                   definition='bear; generate',
                                   audio='/audio/character2.mp3',
                                   word_id=word.id)
            db.session.add(character1)
            db.session.add(character2)

            db.session.commit()
            print("✅ Initial data added successfully")

        # 创建示例用户
        if UserProfile.query.count() == 0:
            print("👤 Creating sample user profile...")
            user = UserProfile(
                user_id='user123',
                username='测试用户',
                language_level='intermediate',
                native_language='English'
            )
            db.session.add(user)
            db.session.commit()
            print("✅ Sample user created: user123")

    print("🚀 Extended Word Learning API with Time Tracking is starting...")
    print("📍 API endpoints available:")
    print("   - GET  /words - List all words")
    print("   - GET  /word/<id> - Get word details")
    print("   - POST /api/learning/session/start - Start learning session")
    print("   - POST /api/learning/session/end - End learning session")
    print("   - POST /api/learning/exercise/record - Record exercise result")
    print("   - POST /api/learning/events/batch - Record batch events")
    print("   - GET  /api/user/<user_id>/progress - Get user progress")
    
    app.run(debug=True, use_reloader=False, port=5002)
