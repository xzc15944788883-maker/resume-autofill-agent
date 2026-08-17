#!/usr/bin/env python3
"""Initialize, sanitize, and audit candidate profile files without dependencies."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any


TEXT_EXTENSIONS = {".md", ".txt", ".json", ".yaml", ".yml", ".csv", ".tsv", ".py"}
EXCLUDED_DIRS = {".git", "__pycache__", "node_modules", ".pytest_cache", ".venv"}
PATTERNS = {
    "chinese_id": re.compile(r"(?<!\d)\d{17}[0-9Xx](?!\d)"),
    "chinese_mobile": re.compile(r"(?<!\d)1[3-9]\d{9}(?!\d)"),
    "email": re.compile(r"(?i)(?<![\w.+-])[\w.+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+(?![\w.-])"),
    "long_number": re.compile(r"(?<!\d)\d{16,19}(?!\d)"),
}
SENSITIVE_KEYS = {
    "name", "姓名", "candidate_name", "student_name", "government_id", "id_card", "身份证号", "证件号码",
    "phone", "mobile", "手机号", "email", "邮箱", "address", "通讯地址", "家庭住址",
    "employer", "工作单位",
}
REPLACEMENTS = {
    "chinese_id": "<REDACTED_ID>",
    "chinese_mobile": "<REDACTED_PHONE>",
    "email": "<REDACTED_EMAIL>",
    "long_number": "<REDACTED_NUMBER>",
}


def scrub_text(text: str) -> str:
    for label, pattern in PATTERNS.items():
        text = pattern.sub(REPLACEMENTS[label], text)
    return text


def scrub_json(value: Any, key: str | None = None) -> Any:
    if key in SENSITIVE_KEYS and value not in (None, "", [], {}):
        return "<REDACTED>"
    if isinstance(value, dict):
        return {k: scrub_json(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [scrub_json(item) for item in value]
    if isinstance(value, str):
        return scrub_text(value)
    return value


def command_init(output: Path) -> int:
    template = Path(__file__).resolve().parent.parent / "assets" / "candidate-profile-template.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(template, output)
    print(f"Initialized blank profile: {output}")
    return 0


def command_sanitize(source: Path, output: Path) -> int:
    raw = source.read_text(encoding="utf-8")
    if source.suffix.lower() == ".json":
        clean = json.dumps(scrub_json(json.loads(raw)), ensure_ascii=False, indent=2) + "\n"
    else:
        clean = scrub_text(raw)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(clean, encoding="utf-8")
    print(f"Sanitized output: {output}")
    return 0


def iter_text_files(path: Path):
    if path.is_file():
        if path.suffix.lower() in TEXT_EXTENSIONS:
            yield path
        return
    for item in path.rglob("*"):
        if item.is_file() and item.suffix.lower() in TEXT_EXTENSIONS and not any(part in EXCLUDED_DIRS for part in item.relative_to(path).parts):
            yield item


def command_audit(path: Path) -> int:
    findings = []
    for file_path in iter_text_files(path):
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in PATTERNS.items():
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                findings.append((file_path, line, label))
    if findings:
        for file_path, line, label in findings:
            print(f"{file_path}:{line}: possible {label}")
        print(f"Audit failed: {len(findings)} possible PII pattern(s).")
        return 1
    print(f"Audit passed: no configured PII patterns found in {path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    init_parser = subparsers.add_parser("init", help="Copy the blank profile template")
    init_parser.add_argument("--output", required=True, type=Path)
    sanitize_parser = subparsers.add_parser("sanitize", help="Redact sensitive JSON keys and common PII patterns")
    sanitize_parser.add_argument("--input", required=True, type=Path)
    sanitize_parser.add_argument("--output", required=True, type=Path)
    audit_parser = subparsers.add_parser("audit", help="Scan text files for common raw PII patterns")
    audit_parser.add_argument("--path", required=True, type=Path)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.command == "init":
        return command_init(args.output)
    if args.command == "sanitize":
        return command_sanitize(args.input, args.output)
    if args.command == "audit":
        return command_audit(args.path)
    return 2


if __name__ == "__main__":
    sys.exit(main())
