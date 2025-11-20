from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure the SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'words.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the Word model
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

@app.route('/')
def home():
    return "Welcome to the Word Learning API"

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

@app.route('/exercise/submit', methods=['POST'])
def submit_exercise():
    data = request.get_json()
    answer = data.get('answer')
    correct_answer = 'D'  # Mock correct answer
    return jsonify({'correct': answer == correct_answer})

# Add a route to list all words
@app.route('/words', methods=['GET'])
def list_words():
    words = Word.query.all()
    words_data = [{'id': word.id, 'pinyin': word.pinyin, 'definition': word.definition} for word in words]
    return jsonify(words_data)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables
        print(f"Database created at: {app.config['SQLALCHEMY_DATABASE_URI']}")

        # Add initial data
        if Word.query.count() == 0:
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

    app.run(debug=True, use_reloader=False, port=5001)