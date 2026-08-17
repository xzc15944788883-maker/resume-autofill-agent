#!/usr/bin/env python3
"""Build a privacy-safe, dependency-free ZIP for local Skill import."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path


EXCLUDED_DIRS = {".git", "__pycache__", "node_modules", ".pytest_cache", ".venv"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo", ".log", ".tmp"}


def should_include(path: Path, root: Path, output: Path) -> bool:
    relative = path.relative_to(root)
    if path.resolve() == output.resolve():
        return False
    if any(part in EXCLUDED_DIRS for part in relative.parts):
        return False
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    return path.is_file()


def build_zip(root: Path, output: Path) -> int:
    root = root.resolve()
    output = output.resolve()
    if not (root / "SKILL.md").is_file():
        raise SystemExit(f"SKILL.md not found under {root}")
    output.parent.mkdir(parents=True, exist_ok=True)
    files = [path for path in sorted(root.rglob("*")) if should_include(path, root, output)]
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            archive.write(path, Path(root.name) / path.relative_to(root))
    return len(files)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skill-dir", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=Path.cwd() / "student-resume-autofill.zip")
    args = parser.parse_args()
    count = build_zip(args.skill_dir, args.output)
    print(f"Created {args.output.resolve()} with {count} file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
