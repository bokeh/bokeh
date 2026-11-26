# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
''' Check that the AGENTS.md files match the repository.

The AGENTS.md files give coding agents the commands and conventions of this
repository. These tests fail when a file mentions a pixi task, a BokehJS build
task, or a path that does not exist, so that the files do not go stale
unnoticed. They cannot tell whether a described convention is still correct.

'''
from __future__ import annotations

import os
import re
import shlex
import tomllib
from pathlib import Path

import pytest

from tests.support.util.project import TOP_PATH

#: Agents load these files into their context in every session. A limit keeps
#: the cost in tokens low, and stops a file from turning into a second
#: contributor guide. Move explanations to the contributor guide instead of
#: raising the limit.
MAX_SIZE = 6000  # characters

#: Files that some tools read instead of AGENTS.md. If one exists, it must only
#: point to the AGENTS.md next to it, so that there is one source of truth.
POINTER_FILES = {
    "CLAUDE.md": "@AGENTS.md",
    "GEMINI.md": "@AGENTS.md",
}

#: Executables that the files may run with ``pixi run``, in addition to tasks.
EXECUTABLES = {"mypy", "node", "pyright", "pytest", "python", "ruff"}

_SKIPPED_DIRS = {"build", "dist", "node_modules"}

_CODE_SPAN = re.compile(r"`([^`\n]+)`")
_LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")


def _find(name: str) -> list[Path]:
    found = []
    for root, dirs, files in os.walk(TOP_PATH):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in _SKIPPED_DIRS]
        if name in files:
            found.append(Path(root) / name)
    return sorted(found)


AGENTS_FILES = _find("AGENTS.md")

_ids = [path.relative_to(TOP_PATH).as_posix() for path in AGENTS_FILES]


def _code_spans(path: Path) -> list[str]:
    return _CODE_SPAN.findall(path.read_text(encoding="utf-8"))


def _commands(path: Path, prefix: str) -> list[list[str]]:
    ''' Return the arguments of every command in a file that starts with ``prefix``. '''
    commands = []
    for span in _code_spans(path):
        # a command may follow environment variables, as in "A=b pixi run task"
        index = span.find(prefix)
        if index == 0 or (index > 0 and span[index - 1] == " "):
            commands.append(shlex.split(span[index + len(prefix):]))
    return commands


def _pixi() -> tuple[set[str], set[str]]:
    with open(TOP_PATH / "pixi.toml", "rb") as f:
        pixi = tomllib.load(f)
    tasks = set(pixi.get("tasks", {}))
    for feature in pixi["feature"].values():
        tasks |= set(feature.get("tasks", {}))
    return tasks, set(pixi["environments"])


def _bokehjs_tasks() -> set[str]:
    tasks: set[str] = set()
    for path in (TOP_PATH / "bokehjs" / "make" / "tasks").glob("*.ts"):
        tasks |= set(re.findall(r'''\btask2?\(\s*["']([^"']+)["']''', path.read_text(encoding="utf-8")))
    return tasks


def test_agents_files_exist() -> None:
    assert TOP_PATH / "AGENTS.md" in AGENTS_FILES


def test_nested_files_are_linked_from_the_root_file() -> None:
    root = (TOP_PATH / "AGENTS.md").read_text(encoding="utf-8")
    links = set(_LINK.findall(root))
    nested = {path.relative_to(TOP_PATH).as_posix() for path in AGENTS_FILES} - {"AGENTS.md"}
    assert nested - links == set()


@pytest.mark.parametrize("path", AGENTS_FILES, ids=_ids)
def test_size(path: Path) -> None:
    size = len(path.read_text(encoding="utf-8"))
    assert size <= MAX_SIZE, f"{size} characters, the limit is {MAX_SIZE}. Move explanations to the contributor guide."


@pytest.mark.parametrize("path", AGENTS_FILES, ids=_ids)
def test_pixi_commands_exist(path: Path) -> None:
    tasks, environments = _pixi()
    for args in _commands(path, "pixi run "):
        positional = []
        args = list(reversed(args))
        while args:
            arg = args.pop()
            if arg in ("-e", "--environment"):
                environment = args.pop()
                assert environment in environments, f"unknown pixi environment {environment!r}"
            elif not arg.startswith("-"):
                positional.append(arg)
                break
        assert positional, "pixi run without a task"
        assert positional[0] in tasks | EXECUTABLES, f"unknown pixi task {positional[0]!r}"


@pytest.mark.parametrize("path", AGENTS_FILES, ids=_ids)
def test_bokehjs_tasks_exist(path: Path) -> None:
    tasks = _bokehjs_tasks() | {"help"}
    for args in _commands(path, "node make "):
        names = []
        for arg in args:
            if arg.startswith("-"):
                break  # options and their values follow the task names
            names.append(arg)
        assert names, "node make without a task"
        assert set(names) - tasks == set(), "unknown BokehJS build task"


@pytest.mark.parametrize("path", AGENTS_FILES, ids=_ids)
def test_paths_exist(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    candidates = [link for link in _LINK.findall(text) if "://" not in link]
    # a code span that looks like a path, and not like a command or a pattern
    candidates += [span for span in _code_spans(path) if "/" in span and not re.search(r"[\s<>*=@#(]|^/|^-|://", span)]

    missing = []
    for candidate in candidates:
        target = candidate.split("#")[0].rstrip("/")
        # paths are relative to the file or to the top of the repository
        if not (path.parent / target).exists() and not (TOP_PATH / target).exists():
            missing.append(candidate)
    assert missing == []


@pytest.mark.parametrize("name", POINTER_FILES)
def test_pointer_files_only_point_to_agents_file(name: str) -> None:
    for path in _find(name):
        assert (path.parent / "AGENTS.md").exists(), f"{path} has no AGENTS.md next to it"
        assert path.read_text(encoding="utf-8").strip() == POINTER_FILES[name], f"{path} must only contain {POINTER_FILES[name]!r}"
