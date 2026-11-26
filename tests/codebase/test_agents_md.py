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

import re
import shlex
import tomllib
from pathlib import Path

import pytest

from tests.support.util.project import TOP_PATH, ls_files

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

_FENCED_BLOCK = re.compile(r"^```[^\n]*\n(.*?)^```", re.DOTALL | re.MULTILINE)
_CODE_SPAN = re.compile(r"(?<!`)(`+)(?!`)(.+?)(?<!`)\1(?!`)")
_LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")

#: A word that is a path if it contains a slash. Commands, patterns, and
#: placeholders such as <name> are left out.
_NOT_A_PATH = re.compile(r"[\s<>*=@#(]|^/|^-|://")

#: Words with a slash that are not paths.
_NOT_PATHS = {"bokeh/bokeh"}  # the repository on GitHub

#: Arguments of commands, and words without a slash, are only checked as paths
#: if they name a file.
_FILE_SUFFIXES = (".json", ".json5", ".lock", ".md", ".py", ".pyi", ".rst", ".toml", ".ts", ".txt", ".yaml", ".yml")


def _find(name: str) -> list[Path]:
    # only files that git knows, so that personal, untracked files are left alone
    files = ls_files(name, f"**/{name}", ":!:**/node_modules/**")
    return sorted(TOP_PATH / file for file in files if file)


AGENTS_FILES = _find("AGENTS.md")

_ids = [path.relative_to(TOP_PATH).as_posix() for path in AGENTS_FILES]


def _code_spans(path: Path) -> list[str]:
    ''' Return the inline code spans of a file, and the lines of its code blocks. '''
    text = path.read_text(encoding="utf-8")
    spans = [line.strip() for block in _FENCED_BLOCK.findall(text) for line in block.splitlines() if line.strip()]
    spans += [match.group(2).strip() for match in _CODE_SPAN.finditer(_FENCED_BLOCK.sub("", text))]
    return spans


def _split(command: str) -> list[str]:
    try:
        return shlex.split(command)
    except ValueError:
        return command.split()


def _commands(path: Path, prefix: str) -> list[list[str]]:
    ''' Return the arguments of every command in a file that starts with ``prefix``. '''
    commands = []
    for span in _code_spans(path):
        # a command may follow environment variables, as in "A=b pixi run task"
        index = span.find(prefix)
        if index == 0 or (index > 0 and span[index - 1] == " "):
            commands.append(_split(span[index + len(prefix):]))
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
    links = {link.removeprefix("./") for link in _LINK.findall(root)}
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
    for span in _code_spans(path):
        if " " not in span:
            # a code span that looks like a path, or that names a file
            # ".pyi" alone is a file type, not a file
            names_file = span.endswith(_FILE_SUFFIXES) and not span.startswith(".")
            if ("/" in span or names_file) and span not in _NOT_PATHS and not _NOT_A_PATH.search(span):
                candidates.append(span)
        else:
            # the files that a command names
            candidates += [
                arg for arg in _split(span)
                if arg.endswith(_FILE_SUFFIXES) and not _NOT_A_PATH.search(arg)
            ]

    missing = []
    for candidate in candidates:
        target = candidate.split("#")[0].rstrip("/")
        # paths are relative to the file or to the top of the repository
        if not (path.parent / target).exists() and not (TOP_PATH / target).exists():
            missing.append(candidate)
    assert missing == [], "these paths do not exist, relative to the file or to the top of the repository"


@pytest.mark.parametrize("name", POINTER_FILES)
def test_pointer_files_only_point_to_agents_file(name: str) -> None:
    for path in _find(name):
        assert (path.parent / "AGENTS.md").exists(), f"{path} has no AGENTS.md next to it"
        assert path.read_text(encoding="utf-8").strip() == POINTER_FILES[name], f"{path} must only contain {POINTER_FILES[name]!r}"
