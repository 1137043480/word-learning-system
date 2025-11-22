#!/usr/bin/env python3
"""Extract structured text from PPTX learning materials into JSON."""

from __future__ import annotations

import json
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
import xml.etree.ElementTree as ET

SLIDE_XML_PREFIX = "ppt/slides/slide"
SLIDE_XML_SUFFIX = ".xml"
TEXT_TAG_SUFFIX = "}t"

HAN_PATTERN = re.compile(r"^[\u4e00-\u9fa5]+$")
PINYIN_PATTERN = re.compile(r"[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+")
WORD_LINE_PATTERN = re.compile(r"^(?P<han>[\u4e00-\u9fa5]+)\s+(?P<pinyin>[A-Za-z\sāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+)$")

@dataclass
class Slide:
    index: int
    text: str

    def lines(self) -> Iterable[str]:
        for raw in self.text.splitlines():
            line = raw.strip()
            if line:
                yield line


def iter_slide_xml_names(z: zipfile.ZipFile) -> Iterable[str]:
    for name in sorted(z.namelist()):
        if name.startswith(SLIDE_XML_PREFIX) and name.endswith(SLIDE_XML_SUFFIX):
            yield name


def extract_slides(pptx_path: Path) -> list[Slide]:
    slides: list[Slide] = []
    with zipfile.ZipFile(pptx_path) as zf:
        for idx, xml_name in enumerate(iter_slide_xml_names(zf), start=1):
            xml_bytes = zf.read(xml_name)
            root = ET.fromstring(xml_bytes)
            texts: list[str] = []
            for node in root.iter():
                if node.tag.endswith(TEXT_TAG_SUFFIX):
                    value = (node.text or "").strip()
                    if value:
                        texts.append(value)
            combined = "\n".join(texts).strip()
            if combined:
                slides.append(Slide(index=idx, text=combined))
    return slides


def find_word_candidates(slides: Iterable[Slide]) -> list[dict[str, str]]:
    candidates: list[dict[str, str]] = []
    for slide in slides:
        lines = list(slide.lines())
        if len(lines) < 2:
            continue
        joined_lower = '\n'.join(lines).lower()
        if 'sentence' not in joined_lower and '释义' not in joined_lower:
            continue
        first_line = re.sub(r'[^\u4e00-\u9fa5]', '', lines[0])
        second_line = ' '.join(lines[1].split())
        if not first_line or len(first_line) > 6:
            continue
        if not PINYIN_PATTERN.search(second_line.lower()):
            continue
        candidates.append({
            'slide_index': slide.index,
            'hanzi': first_line,
            'pinyin': second_line,
            'slide_text': slide.text,
        })
    return candidates


def export_to_json(slides: list[Slide], dest_path: Path, pptx_name: str) -> dict[str, object]:
    payload = {
        "file": pptx_name,
        "slides": [
            {
                "index": slide.index,
                "text": slide.text,
            }
            for slide in slides
        ],
    }
    candidates = find_word_candidates(slides)
    if candidates:
        payload["word_candidates"] = candidates
    dest_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "file": pptx_name,
        "slides_count": len(slides),
        "word_candidates": len(candidates),
        "output": dest_path.name,
    }


def main() -> None:
    materials_dir = Path("词汇学习资料")
    if not materials_dir.exists():
        raise SystemExit("资料文件夹不存在: 词汇学习资料")

    output_dir = Path("data/learning_materials")
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest: list[dict[str, object]] = []
    for pptx_path in sorted(materials_dir.glob("*.pptx")):
        slides = extract_slides(pptx_path)
        if not slides:
            continue
        dest_path = output_dir / f"{pptx_path.stem}.json"
        summary = export_to_json(slides, dest_path, pptx_path.name)
        summary["type"] = "answer" if "answer" in pptx_path.stem.lower() else "learning"
        manifest.append(summary)

    manifest_path = output_dir / "_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    location = output_dir if output_dir.is_absolute() else output_dir.as_posix()
    print(f"Processed {len(manifest)} PPTX files into {location}")


if __name__ == "__main__":
    main()
