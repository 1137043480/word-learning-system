from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

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

# =====================================================
# 新增的时间追踪和自适应学习模型
# =====================================================

class UserProfile(db.Model):
    """用户基础信息表"""
    __tablename__ = 'user_profile'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(100))
    language_level = db.Column(db.String(20))  # 'beginner', 'intermediate', 'advanced'
    native_language = db.Column(db.String(50), default='English')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LearningSession(db.Model):
    """学习会话表 - 记录每次学习活动"""
    __tablename__ = 'learning_session'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.String(50), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    
    # 会话基本信息
    session_type = db.Column(db.String(20), nullable=False)  # 'learning', 'exercise', 'review', 'test'
    module_type = db.Column(db.String(30), nullable=False)   # 'entrance', 'character', 'word', 'collocation', 'sentence'
    initial_level = db.Column(db.String(1))                 # VKS测试结果: A, B, C, D, E
    
    # 时间记录
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Integer)
    active_time_seconds = db.Column(db.Integer)              # 实际活跃时间（排除暂停）
    
    # 状态信息
    completed = db.Column(db.Boolean, default=False)
    interrupted = db.Column(db.Boolean, default=False)      # 是否被中断
    device_type = db.Column(db.String(20), default='web')   # 'web', 'mobile'
    
    # 元数据
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ExerciseRecord(db.Model):
    """练习记录表 - 详细的答题数据"""
    __tablename__ = 'exercise_record'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('learning_session.session_id'), nullable=False)
    
    # 题目信息
    question_id = db.Column(db.String(50), nullable=False)    # 题目唯一标识
    question_type = db.Column(db.String(20), nullable=False)  # 'definition', 'collocation', 'fill_word', 'confusion'
    question_content = db.Column(db.Text)                     # 题目内容
    
    # 答题信息
    user_answer = db.Column(db.String(500))
    correct_answer = db.Column(db.String(500))
    is_correct = db.Column(db.Boolean, nullable=False)
    confidence_level = db.Column(db.Integer)                  # 用户答题信心度 1-5
    
    # 时间记录
    question_start_time = db.Column(db.DateTime, nullable=False)
    question_end_time = db.Column(db.DateTime)
    response_time_seconds = db.Column(db.Float)               # 答题用时
    hesitation_count = db.Column(db.Integer, default=0)      # 犹豫次数（改选次数）
    
    # 尝试记录
    attempt_count = db.Column(db.Integer, default=1)
    is_first_attempt = db.Column(db.Boolean, default=True)
    
    # 反馈信息
    feedback_shown = db.Column(db.Boolean, default=False)
    feedback_view_time_seconds = db.Column(db.Float)          # 查看反馈用时
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserProgress(db.Model):
    """用户进度表 - 每个词汇的掌握情况"""
    __tablename__ = 'user_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    
    # 掌握程度
    mastery_level = db.Column(db.Float, default=0.0)         # 0.0-1.0 掌握程度
    confidence_score = db.Column(db.Float, default=0.0)      # 0.0-1.0 信心分数
    difficulty_rating = db.Column(db.Float)                  # 用户感知难度
    
    # 学习统计
    total_study_time_seconds = db.Column(db.Integer, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    total_attempts = db.Column(db.Integer, default=0)
    correct_attempts = db.Column(db.Integer, default=0)
    
    # 各模块学习次数
    character_study_count = db.Column(db.Integer, default=0)
    word_study_count = db.Column(db.Integer, default=0)
    collocation_study_count = db.Column(db.Integer, default=0)
    sentence_study_count = db.Column(db.Integer, default=0)
    
    # 练习统计
    definition_attempts = db.Column(db.Integer, default=0)
    definition_correct = db.Column(db.Integer, default=0)
    collocation_attempts = db.Column(db.Integer, default=0)
    collocation_correct = db.Column(db.Integer, default=0)
    fill_word_attempts = db.Column(db.Integer, default=0)
    fill_word_correct = db.Column(db.Integer, default=0)
    
    # 时间记录
    first_studied = db.Column(db.DateTime)
    last_studied = db.Column(db.DateTime)
    next_review_suggested = db.Column(db.DateTime)
    
    # 复习计划
    review_count = db.Column(db.Integer, default=0)
    consecutive_correct = db.Column(db.Integer, default=0)
    consecutive_incorrect = db.Column(db.Integer, default=0)
    
    # 自适应参数
    learning_efficiency = db.Column(db.Float)                # 学习效率评分
    retention_rate = db.Column(db.Float)                     # 记忆保持率
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 联合唯一约束
    __table_args__ = (db.UniqueConstraint('user_id', 'word_id', name='uq_user_word'),)

class LearningEvent(db.Model):
    """学习行为事件表 - 详细的用户行为记录"""
    __tablename__ = 'learning_event'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), db.ForeignKey('learning_session.session_id'), nullable=False)
    
    # 事件信息
    event_type = db.Column(db.String(50), nullable=False)    # 'page_enter', 'page_leave', 'button_click', 'audio_play', etc.
    event_target = db.Column(db.String(100))                 # 事件目标元素
    event_data = db.Column(db.Text)                          # JSON格式的额外数据
    
    # 时间信息
    timestamp = db.Column(db.DateTime, nullable=False)
    page_url = db.Column(db.String(200))
    
    # 用户状态
    is_active = db.Column(db.Boolean, default=True)         # 用户是否处于活跃状态
    focus_time_seconds = db.Column(db.Float)                # 页面焦点时间
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AdaptiveRecommendation(db.Model):
    """自适应推荐记录表"""
    __tablename__ = 'adaptive_recommendation'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    
    # 推荐信息
    recommendation_type = db.Column(db.String(30), nullable=False)  # 'next_word', 'review_word', 'module_skip', 'difficulty_adjust'
    target_word_id = db.Column(db.Integer, db.ForeignKey('word.id'))
    target_module = db.Column(db.String(30))
    
    # 推荐参数
    confidence_score = db.Column(db.Float)                  # 推荐置信度
    algorithm_version = db.Column(db.String(20))            # 使用的算法版本
    recommendation_data = db.Column(db.Text)                # JSON格式的推荐详情
    
    # 执行情况
    is_accepted = db.Column(db.Boolean)                     # 用户是否接受推荐
    actual_choice = db.Column(db.String(100))               # 用户实际选择
    
    # 效果评估
    effectiveness_score = db.Column(db.Float)               # 推荐效果评分
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
