from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import json

app = Flask(__name__)
CORS(app)

# 配置数据库
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'words_simple_extended.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 原有模型
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

# 简化的时间追踪模型
class LearningSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.String(50), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    session_type = db.Column(db.String(20), nullable=False)
    module_type = db.Column(db.String(30), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Integer)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ExerciseRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False)
    question_id = db.Column(db.String(50), nullable=False)
    question_type = db.Column(db.String(20), nullable=False)
    user_answer = db.Column(db.String(500))
    correct_answer = db.Column(db.String(500))
    is_correct = db.Column(db.Boolean, nullable=False)
    response_time_seconds = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# API路由
@app.route('/')
def home():
    return jsonify({
        "message": "Word Learning API with Basic Time Tracking",
        "version": "1.0",
        "endpoints": [
            "GET /words - List all words",
            "GET /word/<id> - Get word details", 
            "POST /api/learning/session/start - Start learning session",
            "POST /api/learning/session/end - End learning session",
            "POST /api/learning/exercise/record - Record exercise result"
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

# 时间追踪API
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
            start_time=datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
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
        session.completed = data.get('completed', True)
        
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
            user_answer=data['userAnswer'],
            correct_answer=data['correctAnswer'],
            is_correct=data['isCorrect'],
            response_time_seconds=data.get('responseTimeSeconds')
        )
        
        db.session.add(exercise)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Exercise recorded successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """获取基础统计信息"""
    try:
        word_count = Word.query.count()
        session_count = LearningSession.query.count()
        exercise_count = ExerciseRecord.query.count()
        
        recent_sessions = LearningSession.query.order_by(LearningSession.created_at.desc()).limit(5).all()
        
        stats = {
            'totalWords': word_count,
            'totalSessions': session_count,
            'totalExercises': exercise_count,
            'recentSessions': [
                {
                    'sessionId': s.session_id,
                    'userId': s.user_id,
                    'moduleType': s.module_type,
                    'duration': s.duration_seconds,
                    'completed': s.completed,
                    'startTime': s.start_time.isoformat() if s.start_time else None
                }
                for s in recent_sessions
            ]
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        # 创建数据库表
        db.create_all()
        print(f"✅ Database created at: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # 添加示例数据
        if Word.query.count() == 0:
            print("📝 Adding sample data...")
            
            word = Word(pinyin='fāshēng', definition='happen; occur; take place')
            db.session.add(word)
            db.session.commit()

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
            print("✅ Sample data added")

    print("🚀 Starting Word Learning API with Time Tracking...")
    print("📍 Available endpoints:")
    print("   - http://localhost:5003/ - API info")
    print("   - http://localhost:5003/words - List words")
    print("   - http://localhost:5003/word/1 - Get word details")
    print("   - http://localhost:5003/api/stats - Get statistics")
    
    app.run(debug=True, port=5003, use_reloader=False)
