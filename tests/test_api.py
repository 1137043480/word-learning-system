#!/usr/bin/env python3
"""
Phase 2 API 集成测试（Flask test client，无需启动服务器）

覆盖：核心数据端点、易混淆词、会话追踪、自适应推荐、
认证流程和用户数据隔离。

运行: python3 -m pytest tests/test_api.py -v
"""

import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture(scope='session')
def app(tmp_path_factory):
    """
    把数据库指向临时文件后再导入 app_phase2。

    WORDS_DB_PATH 必须在导入前设置——SQLAlchemy 在模块导入时
    就绑定了数据库 URI，事后改配置不会生效。
    """
    db_file = str(tmp_path_factory.mktemp('api-db') / 'words_extended.db')
    os.environ['WORDS_DB_PATH'] = db_file

    import app_phase2 as mod

    assert db_file in mod.app.config['SQLALCHEMY_DATABASE_URI'], \
        'app_phase2 在设置 WORDS_DB_PATH 之前已被导入，测试会污染真实数据库'
    mod.app.config['TESTING'] = True

    with mod.app.app_context():
        mod.db.create_all()
        word = mod.Word(pinyin='fāshēng', definition='happen; occur')
        mod.db.session.add(word)
        mod.db.session.commit()
        mod.seed_confusable_pairs()

    # 认证表（user_session 等）由迁移脚本创建，不在 SQLAlchemy 模型里
    sys.path.insert(0, str(PROJECT_ROOT / 'scripts'))
    from migrate_auth import migrate_auth_system  # pyrefly: ignore  # 运行时动态路径
    assert migrate_auth_system(db_file)

    mod.init_recommendation_engine()
    yield mod.app
    del os.environ['WORDS_DB_PATH']


@pytest.fixture(scope='session')
def client(app):
    return app.test_client()


@pytest.fixture
def anon_client(app):
    """全新 client——不带任何登录 cookie，用于匿名场景断言"""
    return app.test_client()


@pytest.fixture(scope='session')
def auth_session(client):
    """注册并登录一个用户，返回 (user_id, session_token)"""
    register = client.post('/api/auth/register', json={
        'username': 'pytest_user',
        'password': 'secret123',
    }).get_json()
    assert register['success'], register
    user_id = register['data']['user_id']

    login = client.post('/api/auth/login', json={
        'username': 'pytest_user',
        'password': 'secret123',
    }).get_json()
    assert login['success'], login
    return user_id, login['data']['session_token']


# ================================================
# 核心数据端点
# ================================================

class TestCoreEndpoints:
    def test_home(self, client):
        resp = client.get('/')
        assert resp.status_code == 200

    def test_stats(self, client):
        data = client.get('/api/stats').get_json()
        assert data['success'] is True
        assert data['data']['totalWords'] >= 1

    def test_words_list(self, client):
        resp = client.get('/words')
        assert resp.status_code == 200

    def test_word_detail(self, client):
        resp = client.get('/word/1')
        assert resp.status_code == 200

    def test_word_not_found(self, client):
        resp = client.get('/word/99999')
        assert resp.status_code == 404

    def test_users_list(self, client):
        data = client.get('/api/users').get_json()
        assert data['success'] is True
        assert isinstance(data['data'], list)


# ================================================
# 易混淆词 API
# ================================================

class TestConfusableApi:
    def test_pairs_list(self, client):
        data = client.get('/api/confusable/pairs?limit=20').get_json()
        assert data['success'] is True
        assert data['total'] == 5
        pair = data['pairs'][0]
        for key in ('id', 'word1', 'word2', 'reason', 'difference', 'difficulty_level'):
            assert key in pair
        assert 'pinyin' in pair['word1'] and 'definition' in pair['word1']

    def test_pairs_difficulty_filter(self, client):
        data = client.get('/api/confusable/pairs?difficulty=1').get_json()
        assert data['success'] is True
        assert all(p['difficulty_level'] == 1 for p in data['pairs'])

    def test_single_pair(self, client):
        data = client.get('/api/confusable/pair/1').get_json()
        assert data['success'] is True
        assert data['pair']['id'] == 1

    def test_single_pair_not_found(self, client):
        resp = client.get('/api/confusable/pair/9999')
        assert resp.status_code == 404

    def test_record_requires_auth(self, anon_client):
        resp = anon_client.post('/api/confusable/exercise/record', json={
            'pair_id': 1, 'is_correct': True, 'response_time': 3.0,
        })
        assert resp.status_code == 401

    def test_record_with_session_token(self, client, auth_session):
        user_id, token = auth_session
        resp = client.post(
            '/api/confusable/exercise/record',
            json={'pair_id': 1, 'is_correct': True, 'response_time': 3.0},
            headers={'X-Session-Token': token},
        )
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_statistics_blocks_other_users(self, client, auth_session):
        _, token = auth_session
        resp = client.get(
            '/api/confusable/user/someone_else/statistics',
            headers={'X-Session-Token': token},
        )
        assert resp.status_code == 403


# ================================================
# 学习会话追踪
# ================================================

class TestSessionTracking:
    def test_start_requires_auth(self, anon_client):
        resp = anon_client.post('/api/learning/session/start', json={
            'sessionId': 's-anonymous', 'wordId': 1,
            'sessionType': 'learning', 'moduleType': 'word',
            'startTime': '2026-01-01T10:00:00',
        })
        assert resp.status_code == 401

    def test_start_and_end_with_token(self, client, auth_session):
        user_id, token = auth_session
        headers = {'X-Session-Token': token}
        start = client.post('/api/learning/session/start', json={
            'sessionId': 's-pytest-1', 'wordId': 1,
            'sessionType': 'learning', 'moduleType': 'word',
            'startTime': '2026-01-01T10:00:00',
        }, headers=headers)
        assert start.get_json()['success'] is True, start.get_json()

        end = client.post('/api/learning/session/end', json={
            'sessionId': 's-pytest-1',
            'endTime': '2026-01-01T10:05:00',
            'durationSeconds': 300,
            'activeTimeSeconds': 250,
            'completed': True,
            'eventCount': 3,
        }, headers=headers)
        assert end.get_json()['success'] is True, end.get_json()

    def test_cannot_start_session_for_other_user(self, client, auth_session):
        _, token = auth_session
        resp = client.post('/api/learning/session/start', json={
            'sessionId': 's-pytest-2', 'userId': 'someone_else', 'wordId': 1,
            'sessionType': 'learning', 'moduleType': 'word',
            'startTime': '2026-01-01T10:00:00',
        }, headers={'X-Session-Token': token})
        assert resp.status_code == 403


# ================================================
# 自适应推荐与复习
# ================================================

class TestAdaptiveEndpoints:
    def test_recommendation(self, client, auth_session):
        user_id, token = auth_session
        data = client.get(
            f'/api/adaptive/recommendation/{user_id}',
            headers={'X-Session-Token': token},
        ).get_json()
        assert data['success'] is True
        assert 'type' in data['data']

    def test_recommendation_blocks_other_users(self, client, auth_session):
        _, token = auth_session
        resp = client.get(
            '/api/adaptive/recommendation/someone_else',
            headers={'X-Session-Token': token},
        )
        assert resp.status_code == 403

    def test_due_reviews(self, client, auth_session):
        user_id, token = auth_session
        data = client.get(
            f'/api/review/user/{user_id}/due',
            headers={'X-Session-Token': token},
        ).get_json()
        assert data['success'] is True
        assert isinstance(data['data'], list)

    def test_dashboard(self, client, auth_session):
        user_id, token = auth_session
        data = client.get(
            f'/api/analytics/user/{user_id}/dashboard',
            headers={'X-Session-Token': token},
        ).get_json()
        assert data['success'] is True


# ================================================
# 认证流程
# ================================================

class TestAuthFlow:
    def test_register_rejects_short_password(self, client):
        resp = client.post('/api/auth/register', json={
            'username': 'short_pw_user', 'password': '123',
        })
        assert resp.status_code == 400

    def test_register_rejects_missing_fields(self, client):
        resp = client.post('/api/auth/register', json={'username': 'no_pw'})
        assert resp.status_code == 400

    def test_login_wrong_password(self, client, auth_session):
        resp = client.post('/api/auth/login', json={
            'username': 'pytest_user', 'password': 'wrong-password',
        })
        assert resp.status_code == 401

    def test_validate_without_token(self, anon_client):
        data = anon_client.get('/api/auth/validate').get_json()
        assert data['success'] is True
        assert data['valid'] is False

    def test_validate_with_token(self, client, auth_session):
        user_id, token = auth_session
        data = client.get(
            '/api/auth/validate', headers={'X-Session-Token': token},
        ).get_json()
        assert data['valid'] is True
        assert data['user_id'] == user_id

    def test_validate_with_bogus_token(self, client):
        data = client.get(
            '/api/auth/validate', headers={'X-Session-Token': 'not-a-real-token'},
        ).get_json()
        assert data['valid'] is False
