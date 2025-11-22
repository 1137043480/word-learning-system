#!/usr/bin/env python3
"""
易混淆词辨析 API扩展
添加到 app_phase2.py 中
"""

from flask import jsonify, request
from sqlalchemy import text

def register_confusable_apis(app, db, require_authentication, check_ownership):
    """注册易混淆词相关的API端点"""
    
    @app.route('/api/confusable/pairs', methods=['GET'])
    def get_confusable_pairs():
        """获取易混淆词对列表"""
        try:
            limit = request.args.get('limit', 10, type=int)
            offset = request.args.get('offset', 0, type=int)
            difficulty = request.args.get('difficulty', type=int)
            
            sql = """
                SELECT 
                    cp.id,
                    cp.word1_id,
                    cp.word2_id,
                    w1.pinyin as word1_pinyin,
                    w2.pinyin as word2_pinyin,
                    w1.definition as word1_definition,
                    w2.definition as word2_definition,
                    cp.reason,
                    cp.difference,
                    cp.examples,
                    cp.tips,
                    cp.difficulty_level
                FROM confusable_pairs cp
                JOIN word w1 ON cp.word1_id = w1.id
                JOIN word w2 ON cp.word2_id = w2.id
            """
            
            if difficulty:
                sql += " WHERE cp.difficulty_level = :difficulty"
            
            sql += " ORDER BY cp.difficulty_level, cp.id LIMIT :limit OFFSET :offset"
            
            params = {'limit': limit, 'offset': offset}
            if difficulty:
                params['difficulty'] = difficulty
            
            result = db.session.execute(text(sql), params)
            pairs = []
            
            for row in result:
                pairs.append({
                    'id': row[0],
                    'word1': {
                        'id': row[1],
                        'pinyin': row[3],
                        'definition': row[5]
                    },
                    'word2': {
                        'id': row[2],
                        'pinyin': row[4],
                        'definition': row[6]
                    },
                    'reason': row[7],
                    'difference': row[8],
                    'examples': row[9],
                    'tips': row[10],
                    'difficulty_level': row[11]
                })
            
            return jsonify({
                'success': True,
                'pairs': pairs,
                'total': len(pairs)
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/confusable/pair/<int:pair_id>', methods=['GET'])
    def get_confusable_pair(pair_id):
        """获取单个易混淆词对的详细信息"""
        try:
            query = text("""
                SELECT 
                    cp.id,
                    cp.word1_id,
                    cp.word2_id,
                    w1.pinyin as word1_pinyin,
                    w2.pinyin as word2_pinyin,
                    w1.definition as word1_definition,
                    w2.definition as word2_definition,
                    cp.reason,
                    cp.difference,
                    cp.examples,
                    cp.tips,
                    cp.difficulty_level
                FROM confusable_pairs cp
                JOIN word w1 ON cp.word1_id = w1.id
                JOIN word w2 ON cp.word2_id = w2.id
                WHERE cp.id = :pair_id
            """)
            
            result = db.session.execute(query, {'pair_id': pair_id}).fetchone()
            
            if not result:
                return jsonify({'success': False, 'error': '未找到该易混淆词对'}), 404
            
            pair = {
                'id': result[0],
                'word1': {
                    'id': result[1],
                    'pinyin': result[3],
                    'definition': result[5]
                },
                'word2': {
                    'id': result[2],
                    'pinyin': result[4],
                    'definition': result[6]
                },
                'reason': result[7],
                'difference': result[8],
                'examples': result[9],
                'tips': result[10],
                'difficulty_level': result[11]
            }
            
            return jsonify({
                'success': True,
                'pair': pair
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/confusable/exercise/record', methods=['POST'])
    @require_authentication()
    def record_confusable_exercise(current_user_id=None):
        """记录易混淆词辨析练习"""
        try:
            data = request.get_json()
            pair_id = data.get('pair_id')
            is_correct = data.get('is_correct')
            response_time = data.get('response_time')
            
            if not pair_id or is_correct is None:
                return jsonify({'success': False, 'error': '缺少必要参数'}), 400
            
            query = text("""
                INSERT INTO confusable_exercise_records 
                (user_id, pair_id, is_correct, response_time)
                VALUES (:user_id, :pair_id, :is_correct, :response_time)
            """)
            
            db.session.execute(query, {
                'user_id': current_user_id,
                'pair_id': pair_id,
                'is_correct': is_correct,
                'response_time': response_time
            })
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': '练习记录已保存'
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/confusable/user/<user_id>/statistics', methods=['GET'])
    @require_authentication()
    @check_ownership()
    def get_confusable_statistics(user_id, current_user_id=None):
        """获取用户的易混淆词辨析统计"""
        try:
            query = text("""
                SELECT 
                    COUNT(*) as total_exercises,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
                    AVG(response_time) as avg_response_time
                FROM confusable_exercise_records
                WHERE user_id = :user_id
            """)
            
            result = db.session.execute(query, {'user_id': user_id}).fetchone()
            
            total = result[0] or 0
            correct = result[1] or 0
            accuracy = (correct / total * 100) if total > 0 else 0
            
            return jsonify({
                'success': True,
                'statistics': {
                    'total_exercises': total,
                    'correct_count': correct,
                    'accuracy': round(accuracy, 2),
                    'avg_response_time': round(result[2] or 0, 2)
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    print("✅ 易混淆词辨析API已注册")

