#!/usr/bin/env python3
"""Import learning materials JSON into words_extended.db."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Iterable, Optional

DATA_DIR = Path('data/learning_materials')
DB_PATH = Path('words_extended.db')


def contains_chinese(text: str) -> bool:
    return any('\u4e00' <= ch <= '\u9fff' for ch in text)


def normalise_text(lines: Iterable[str]) -> list[str]:
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.lower().startswith('click to the next page'):
            continue
        if stripped.lower() == 'click to the next page':
            continue
        result.append(stripped)
    return result


def parse_candidate(candidate: dict[str, object]) -> dict[str, object]:
    hanzi = str(candidate.get('hanzi', '')).strip()
    pinyin = str(candidate.get('pinyin', '')).strip()
    slide_text = str(candidate.get('slide_text', ''))

    definition_lines: list[str] = []
    collocation_lines: list[str] = []
    sentence_lines: list[str] = []

    current_section = 'definition'
    for raw_line in slide_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        lower = line.lower()
        if lower.startswith('collocation'):
            current_section = 'collocation'
            continue
        if lower.startswith('sentence'):
            current_section = 'sentence'
            continue
        if lower.startswith('click to the next page'):
            continue
        if current_section == 'definition':
            definition_lines.append(line)
        elif current_section == 'collocation':
            collocation_lines.append(line)
        elif current_section == 'sentence':
            sentence_lines.append(line)

    definition = ' '.join(definition_lines[:2]) if definition_lines else ''

    collocations: list[dict[str, str]] = []
    idx = 0
    while idx < len(collocation_lines):
        source = collocation_lines[idx]
        translation: Optional[str] = None
        if idx + 1 < len(collocation_lines) and not contains_chinese(collocation_lines[idx + 1]):
            translation = collocation_lines[idx + 1]
            idx += 1
        collocations.append({
            'collocation': source,
            'translation': translation or ''
        })
        idx += 1

    sentence_chinese: list[str] = []
    sentence_translation: Optional[str] = None
    for line in normalise_text(sentence_lines):
        if not contains_chinese(line) and sentence_translation is None:
            sentence_translation = line
        elif contains_chinese(line):
            sentence_chinese.append(line.replace("/", '').replace('[', '').replace(']', ''))

    example_sentence = ' '.join(sentence_chinese).strip()
    example_translation = (sentence_translation or '').strip()

    example = None
    if example_sentence:
        example = {
            'sentence': example_sentence,
            'translation': example_translation,
            'pinyin': '',
        }

    return {
        'hanzi': hanzi,
        'pinyin': pinyin,
        'definition': definition,
        'collocations': collocations,
        'example': example,
        'characters': [
            {
                'character': ch,
                'pinyin': '',
                'definition': ''
            }
            for ch in hanzi
        ]
    }


def ensure_tables(connection: sqlite3.Connection) -> None:
    cursor = connection.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS word (
            id INTEGER PRIMARY KEY,
            pinyin VARCHAR(80) NOT NULL,
            definition VARCHAR(200) NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS example (
            id INTEGER PRIMARY KEY,
            sentence VARCHAR(200) NOT NULL,
            pinyin VARCHAR(200) NOT NULL,
            translation VARCHAR(200) NOT NULL,
            audio VARCHAR(200) NOT NULL,
            word_id INTEGER NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS collocation (
            id INTEGER PRIMARY KEY,
            collocation VARCHAR(200) NOT NULL,
            translation VARCHAR(200) NOT NULL,
            audio VARCHAR(200) NOT NULL,
            word_id INTEGER NOT NULL
        )
    ''')
    connection.commit()


def insert_word(connection: sqlite3.Connection, payload: dict[str, object]) -> None:
    cursor = connection.cursor()
    hanzi = payload['hanzi']
    pinyin = payload['pinyin'] or hanzi
    definition = payload['definition'] or 'No definition provided'

    cursor.execute('SELECT id FROM word WHERE pinyin = ? AND definition = ?', (pinyin, definition))
    row = cursor.fetchone()
    if row:
        word_id = row[0]
    else:
        cursor.execute('INSERT INTO word (pinyin, definition) VALUES (?, ?)', (pinyin, definition))
        word_id = cursor.lastrowid

    for collocation in payload['collocations']:
        cursor.execute(
            'SELECT 1 FROM collocation WHERE collocation = ? AND word_id = ?',
            (collocation['collocation'], word_id)
        )
        if cursor.fetchone():
            continue
        cursor.execute(
            'INSERT INTO collocation (collocation, translation, audio, word_id) VALUES (?, ?, ?, ?)',
            (collocation['collocation'], collocation['translation'], '', word_id)
        )

    example = payload.get('example')
    if example:
        cursor.execute(
            'SELECT 1 FROM example WHERE sentence = ? AND word_id = ?',
            (example['sentence'], word_id)
        )
        if not cursor.fetchone():
            cursor.execute(
                'INSERT INTO example (sentence, pinyin, translation, audio, word_id) VALUES (?, ?, ?, ?, ?)',
                (example['sentence'], example['pinyin'], example['translation'], '', word_id)
            )

    for character in payload['characters']:
        cursor.execute(
            'SELECT 1 FROM character WHERE character = ? AND word_id = ?',
            (character['character'], word_id)
        )
        if cursor.fetchone():
            continue
        cursor.execute(
            'INSERT INTO character (character, pinyin, definition, audio, word_id) VALUES (?, ?, ?, ?, ?)',
            (character['character'], character['pinyin'], character['definition'], '', word_id)
        )

    connection.commit()


def main() -> None:
    if not DATA_DIR.exists():
        raise SystemExit('Learning materials directory not found.')
    if not DB_PATH.exists():
        raise SystemExit('Database words_extended.db not found.')

    with DB_PATH.open('rb'):
        pass

    with sqlite3.connect(DB_PATH) as connection:
        ensure_tables(connection)
        inserted = 0

        for entry in json.loads((DATA_DIR / '_manifest.json').read_text(encoding='utf-8')):
            if entry.get('type') != 'learning':
                continue
            json_path = DATA_DIR / entry['output']
            data = json.loads(json_path.read_text(encoding='utf-8'))
            for candidate in data.get('word_candidates', []):
                parsed = parse_candidate(candidate)
                if not parsed['hanzi']:
                    continue
                insert_word(connection, parsed)
                inserted += 1

    print(f'Imported learning materials. Total entries inserted: {inserted}')


if __name__ == '__main__':
    main()
