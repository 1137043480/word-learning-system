#!/usr/bin/env python3
"""
用户数据隔离与权限控制模块
"""

from functools import wraps
from flask import request, jsonify

def get_auth_manager():
    """动态获取认证管理器"""
    try:
        from auth import AuthManager
        return AuthManager()
    except ImportError:
        return None


def get_current_user_from_request():
    """
    从请求中获取当前登录用户ID
    支持多种认证方式：
    1. Session Token (推荐)
    2. User ID参数 (向后兼容)
    
    Returns:
        tuple: (user_id, is_authenticated)
    """
    auth_manager = get_auth_manager()
    
    # 方式1：Session Token认证
    if auth_manager:
        session_token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
        if session_token:
            validation = auth_manager.validate_session(session_token)
            if validation['valid']:
                return validation['user_id'], True
    
    # 方式2：URL参数 (向后兼容)
    if 'user_id' in request.view_args:
        return request.view_args['user_id'], False
    
    # 方式3：Query参数
    user_id = request.args.get('user_id')
    if user_id:
        return user_id, False
    
    # 方式4：JSON Body
    if request.json and 'user_id' in request.json:
        return request.json['user_id'], False
    
    return None, False


def require_authentication(allow_url_param=True):
    """
    装饰器：要求用户认证
    
    Args:
        allow_url_param: 是否允许URL参数认证（向后兼容）
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id, is_authenticated = get_current_user_from_request()
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'error': '需要用户认证',
                    'code': 'AUTHENTICATION_REQUIRED'
                }), 401
            
            # 如果不允许URL参数，必须通过Session认证
            if not allow_url_param and not is_authenticated:
                return jsonify({
                    'success': False,
                    'error': '需要Session认证',
                    'code': 'SESSION_REQUIRED'
                }), 401
            
            # 将user_id和认证状态注入到kwargs
            kwargs['current_user_id'] = user_id
            kwargs['is_authenticated'] = is_authenticated
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def check_data_ownership(target_user_id=None):
    """
    装饰器：检查数据所有权
    用户只能访问自己的数据
    
    Args:
        target_user_id: 如果提供，检查该用户ID；否则从URL参数获取
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user_id, is_authenticated = get_current_user_from_request()
            
            if not current_user_id:
                return jsonify({
                    'success': False,
                    'error': '需要用户认证',
                    'code': 'AUTHENTICATION_REQUIRED'
                }), 401
            
            # 确定要检查的目标用户ID
            check_user_id = target_user_id
            if not check_user_id and 'user_id' in kwargs:
                check_user_id = kwargs['user_id']
            elif not check_user_id and 'user_id' in request.view_args:
                check_user_id = request.view_args['user_id']
            
            # 如果没有指定目标用户，使用当前用户
            if not check_user_id:
                kwargs['user_id'] = current_user_id
            elif check_user_id != current_user_id:
                # 数据所有权检查失败
                return jsonify({
                    'success': False,
                    'error': '无权访问其他用户的数据',
                    'code': 'PERMISSION_DENIED'
                }), 403
            
            kwargs['current_user_id'] = current_user_id
            kwargs['is_authenticated'] = is_authenticated
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


class UserDataIsolation:
    """
    用户数据隔离工具类
    提供常用的数据查询过滤方法
    """
    
    @staticmethod
    def filter_user_sessions(sessions, user_id):
        """过滤用户会话数据"""
        return [s for s in sessions if s.user_id == user_id]
    
    @staticmethod
    def filter_user_progress(progress_list, user_id):
        """过滤用户进度数据"""
        return [p for p in progress_list if p.user_id == user_id]
    
    @staticmethod
    def validate_user_access(target_user_id, current_user_id):
        """验证用户访问权限"""
        return target_user_id == current_user_id
    
    @staticmethod
    def get_user_context(user_id):
        """获取用户上下文信息"""
        auth_manager = get_auth_manager()
        if auth_manager:
            return auth_manager.get_user_info(user_id)
        return {'user_id': user_id}


# 快捷函数
def require_auth():
    """快捷装饰器：要求认证（允许URL参数）"""
    return require_authentication(allow_url_param=True)


def require_session_auth():
    """快捷装饰器：要求Session认证（不允许URL参数）"""
    return require_authentication(allow_url_param=False)


def check_ownership():
    """快捷装饰器：检查数据所有权"""
    return check_data_ownership()

