#!/usr/bin/env python3
"""Build a deterministic, portable OpenAI Co-Invest plugin ZIP."""

import argparse
import hashlib
import os
from pathlib import Path
import stat
import subprocess
import sys
import zipfile


FILES = (
    "CHANGELOG.md",
    "LICENSE",
    "README.md",
    "assets/logo.svg",
    "mcp.json",
    "plugin.json",
)
DIRECTORIES = ("assets",)


def fail(message: str) -> "NoReturn":
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def ensure_no_symlink_ancestry(repo_root: Path, package_dir: Path) -> None:
    if repo_root.is_symlink() or not repo_root.is_dir():
        fail(f"repository root must be a real directory: {repo_root}")
    current = repo_root
    for part in package_dir.relative_to(repo_root).parts:
        current = current / part
        if current.is_symlink():
            fail(f"symlink in package path ancestry: {current}")
        if current.exists() and not current.is_dir():
            fail(f"package path ancestry is not a directory: {current}")


def collect_package_files(package_dir: Path) -> list[tuple[str, Path]]:
    actual_files: set[str] = set()
    if not package_dir.is_dir():
        fail(f"OpenAI package directory does not exist: {package_dir}")

    for root, dirs, files in os.walk(package_dir, topdown=True, followlinks=False):
        root_path = Path(root)
        for name in list(dirs):
            path = root_path / name
            relative = path.relative_to(package_dir).as_posix()
            if path.is_symlink():
                fail(f"symlink in package: {relative}")
            if relative not in DIRECTORIES:
                fail(f"unexpected package directory: {relative}")
        for name in files:
            path = root_path / name
            relative = path.relative_to(package_dir).as_posix()
            if path.is_symlink():
                fail(f"symlink in package: {relative}")
            if not stat.S_ISREG(path.lstat().st_mode):
                fail(f"package entry is not a regular file: {relative}")
            if relative not in FILES:
                fail(f"unexpected package file: {relative}")
            actual_files.add(relative)

    for expected in FILES:
        if expected not in actual_files:
            fail(f"required package file is missing: {expected}")
    return [(name, package_dir / name) for name in sorted(FILES)]


def run_validator(repo_root: Path, script_dir: Path) -> None:
    command = ["node", str(script_dir / "openai-package.mjs"), str(repo_root)]
    try:
        result = subprocess.run(command, check=False, text=True, capture_output=True)
    except OSError as error:
        fail(f"could not run Node validator: {error}")
    if result.returncode:
        if result.stdout:
            print(result.stdout, end="", file=sys.stderr)
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        fail(f"OpenAI package validation failed (exit {result.returncode})")


def is_within(path: Path, directory: Path) -> bool:
    try:
        path.relative_to(directory)
        return True
    except ValueError:
        return False


def build_zip(output: Path, files: list[tuple[str, Path]]) -> tuple[str, int]:
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, source in files:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.flag_bits = 0
            archive.writestr(info, source.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    return digest, len(files)


def main() -> None:
    default_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path, help="new ZIP path outside plugins/co-invest-openai")
    parser.add_argument("--repo-root", type=Path, default=default_root, help="repository root (defaults to this script's checkout)")
    args = parser.parse_args()

    repo_root = args.repo_root.expanduser().absolute()
    package_dir = repo_root / "plugins" / "co-invest-openai"
    ensure_no_symlink_ancestry(repo_root, package_dir)
    requested_output = args.out.expanduser().absolute()
    output = requested_output.parent.resolve() / requested_output.name
    if output.exists() or output.is_symlink():
        fail(f"output already exists: {output}")
    if is_within(output, package_dir.resolve()):
        fail("output path must be outside the OpenAI package directory")

    run_validator(repo_root, Path(__file__).resolve().parent)
    files = collect_package_files(package_dir)
    digest, count = build_zip(output, files)
    print(f"SHA256 {digest}")
    print(f"FILES {count}")


if __name__ == "__main__":
    main()
