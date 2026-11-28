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
from functools import cache
from itertools import pairwise
from pathlib import Path

import pytest

from tests.support.util.project import TOP_PATH, ls_files

#: Agents load these files into their context in every session. A limit keeps
#: the cost in tokens low, and stops a file from turning into a second
#: contributor guide. Move explanations to the contributor guide instead of
#: raising the limit.
MAX_SIZE = 6000  # characters

_POINTER = """\
<!--
This file is only a pointer. Never add instructions here. All instructions for coding agents go into AGENTS.md.
Why it exists: {why}
Remove this file when {until}.
-->
{pointer}"""

#: Files that some tools read instead of AGENTS.md. If one exists, it must only
#: point to the AGENTS.md next to it, so that there is one source of truth. The
#: comment says why the tool needs the file, so that it can go when it doesn't.
POINTER_FILES = {
    "CLAUDE.md": _POINTER.format(
        why="Claude Code reads AGENTS.md only as a fallback. Older versions do not read it, and neither does a session with a CLAUDE.md in a parent directory.",
        until="Claude Code always reads AGENTS.md",
        pointer="@AGENTS.md",
    ),
    "GEMINI.md": _POINTER.format(
        why="Gemini CLI reads GEMINI.md by default. It reads AGENTS.md only if the contributor sets context.fileName.",
        until="Gemini CLI reads AGENTS.md by default",
        # Gemini CLI documents imports only with an explicit relative path
        pointer="@./AGENTS.md",
    ),
    ".github/copilot-instructions.md": _POINTER.format(
        why="The Copilot harness in VS Code reads .github/copilot-instructions.md as its project instruction file, and AGENTS.md only if the harness supports it.",
        until="the Copilot harness reads AGENTS.md at the root by default",
        pointer="See [AGENTS.md](../AGENTS.md).",
    ),
}

#: Executables that the files may run with ``pixi run``, in addition to tasks.
EXECUTABLES = {"mypy", "node", "pyright", "pytest", "python", "ruff"}

_FENCED_BLOCK = re.compile(r"^```[^\n]*\n(.*?)^```", re.DOTALL | re.MULTILINE)
_CODE_SPAN = re.compile(r"(?<!`)(`+)(?!`)(.+?)(?<!`)\1(?!`)")
_LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")

#: A word that is a path if it contains a slash. Commands, patterns, and
#: placeholders such as <name> are left out.
_NOT_A_PATH = re.compile(r"[\s<>*=@#(]|^/|^-|://")

#: Words with a slash that are not paths in a checkout.
_NOT_PATHS = {
    "bokeh/bokeh",            # the repository on GitHub
    "docs/bokeh/build/html",  # the output of the documentation build
}

#: Arguments of commands, and words without a slash, are only checked as paths
#: if they name a file.
_FILE_SUFFIXES = (".json", ".json5", ".lock", ".md", ".py", ".pyi", ".rst", ".toml", ".ts", ".txt", ".yaml", ".yml")


def _find(name: str) -> list[Path]:
    # only files that git knows, so that personal, untracked files are left alone
    files = ls_files(name, f"**/{name}", ":!:**/node_modules/**")
    return sorted(TOP_PATH / file for file in files if file)


AGENTS_FILES = _find("AGENTS.md")

_ids = [path.relative_to(TOP_PATH).as_posix() for path in AGENTS_FILES]


@cache
def _tracked() -> set[str]:
    ''' Return the files that git tracks, and their directories.

    A path that only exists in a working tree, such as build output, must not
    make a test pass on one machine and fail on another.

    '''
    tracked: set[str] = set()
    for file in ls_files():
        if file:
            tracked.add(file)
            tracked.update(parent.as_posix() for parent in Path(file).parents)
    return tracked


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

    tracked = _tracked()
    here = path.parent.relative_to(TOP_PATH)

    missing = []
    for candidate in candidates:
        target = candidate.split("#")[0].rstrip("/")
        # paths are relative to the file or to the top of the repository
        relative = Path(os.path.normpath(here / target)).as_posix()
        top = Path(os.path.normpath(target)).as_posix()
        if relative not in tracked and top not in tracked:
            missing.append(candidate)
    assert missing == [], "git tracks no such paths, relative to the file or to the top of the repository"


#: A pointer to a section: one or more titles in double quotes, followed by the
#: file that has them. "there" and "in the same file" mean the file that the
#: text named last.
_TITLES = r'"[^"\n]+"(?:(?:,? (?:and|or) |, )"[^"\n]+")*'
_SECTION_POINTER = re.compile(
    rf"({_TITLES}) (?:in `([^`\n]+\.rst)`|in \[[^\]]*\]\(([^)\s]+\.md)\)|(in the same file|there)\b)",
)
_RST_UNDERLINE = re.compile(r"^([=\-~'^\"+#*])\1{3,}$")


def _headings(path: Path) -> set[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if path.suffix == ".md":
        return {line.lstrip("#").strip() for line in lines if line.startswith("#")}
    return {title.strip() for title, underline in pairwise(lines) if _RST_UNDERLINE.match(underline)}


@pytest.mark.parametrize("path", AGENTS_FILES, ids=_ids)
def test_section_titles_exist(path: Path) -> None:
    # The AGENTS.md files point to sections of the contributor guide instead of
    # repeating them. If you rename, move, or remove a section there, this test
    # fails: update the AGENTS.md files that quote its title. Check as well
    # whether the pointer still leads to what the agent needs.
    text = path.read_text(encoding="utf-8")

    missing = []
    target: Path | None = None
    for match in _SECTION_POINTER.finditer(text):
        titles, rst, md, same = match.groups()
        if not same:
            name = rst or md
            here = path.parent / name
            target = here if here.exists() else TOP_PATH / name
        if target is None or not target.exists():
            missing.append(match.group(0))
            continue
        headings = _headings(target)
        missing += [f"{title!r} in {target.relative_to(TOP_PATH)}" for title in re.findall(r'"([^"\n]+)"', titles) if title not in headings]
    assert missing == [], "no such section titles. Update the AGENTS.md file to match the renamed or moved section."


@pytest.mark.parametrize("name", POINTER_FILES)
def test_pointer_files_only_point_to_agents_file(name: str) -> None:
    # the instructions live in the root AGENTS.md, which is not always next to the pointer
    assert (TOP_PATH / "AGENTS.md").exists()
    for path in _find(name):
        assert path.read_text(encoding="utf-8").strip() == POINTER_FILES[name], f"{path} must only contain {POINTER_FILES[name]!r}"
