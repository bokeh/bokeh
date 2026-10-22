#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest # isort:skip

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import ast
import sys
from typing import Literal

# Bokeh imports
from tests.support.util.project import TOP_PATH, ls_files

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

Section = Literal["future", "stdlib", "third", "first", "local"]

STDLIB = "Standard library imports"
EXTERNAL = "External imports"
BOKEH = "Bokeh imports"

HEADINGS = {STDLIB, EXTERNAL, BOKEH}

FIRST_PARTY = {"bokeh", "tests", "tools"}

# Keep in sync with known-local-folder in pyproject.toml
LOCAL_FOLDER = {"_util_document", "_util_models", "_util_property", "_util_subcommands", "server"}

# Keep in sync with per-file-ignores in pyproject.toml
SKIP_PREFIXES = ("src/bokeh/sampledata/",)

# Ruff sorts imports, but doesn't support section headings, so verify them
# here. Directories not listed here (e.g. examples) don't use headings.
DIRECTORIES: dict[str, dict[Section, str | None]] = {
    "src/bokeh": {"stdlib": STDLIB, "third": EXTERNAL, "first": BOKEH, "local": BOKEH},
    "tools":     {"stdlib": STDLIB, "third": EXTERNAL, "first": BOKEH, "local": BOKEH},
    "tests":     {"stdlib": STDLIB, "third": EXTERNAL, "first": BOKEH, "local": None},
}

@pytest.mark.parametrize("directory", DIRECTORIES)
def test_import_headings(directory: str) -> None:
    ''' Assures that import sections are preceded by appropriate headings.

    '''
    headings = DIRECTORIES[directory]
    errors: list[str] = []
    for file in ls_files(directory):
        if file.endswith((".py", ".pyi")) and not file.startswith(SKIP_PREFIXES):
            source = (TOP_PATH / file).read_text(encoding="utf-8")
            errors.extend(f"{file}:{error}" for error in check_headings(source, headings))
    assert not errors, f"import heading issues in {directory}:\n" + "\n".join(errors)

@pytest.mark.parametrize("source, errors", [
    ("# Standard library imports\nimport os\n\n# External imports\nimport numpy\n", []),
    ("# Standard library imports\nimport os\n\nimport numpy\n", ["4: missing '# External imports'"]),
    ("# Standard library imports\n# External imports\nimport os\n", ["2: misplaced heading '# External imports'"]),
    ("# Bokeh imports\n# Bokeh test imports\nfrom tests import x\n", []),
    ("import os # isort:skip\n", []),
    ("# isort: skip_file\nimport os\n", []),
    ("import os ; os\n", []),
    ("if True:\n    import os\n", []),
])
def test_check_headings(source: str, errors: list[str]) -> None:
    assert check_headings(source, DIRECTORIES["tests"]) == errors

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

def section_of(node: ast.Import | ast.ImportFrom) -> Section:
    if isinstance(node, ast.ImportFrom):
        if node.level > 0:
            return "local"
        name = node.module or ""
    else:
        name = node.names[0].name

    root = name.split(".")[0]
    if root == "__future__":
        return "future"
    elif root in LOCAL_FOLDER:
        return "local"
    elif root in FIRST_PARTY:
        return "first"
    elif root in sys.stdlib_module_names:
        return "stdlib"
    else:
        return "third"

def check_headings(source: str, headings: dict[Section, str | None]) -> list[str]:
    ''' Check that the first import of each top-level section is preceded by
    a comment block starting with the section's heading, and that headings
    don't appear anywhere else.

    Relies on imports being sorted by ruff, so that a section starts whenever
    the section kind changes within a run of import statements.

    '''
    if "isort: skip_file" in source:
        return []

    lines = source.splitlines()
    errors: list[str] = []
    used: set[int] = set()

    prev: Section | None = None
    for node in ast.parse(source).body:
        if not isinstance(node, ast.Import | ast.ImportFrom):
            prev = None
            continue

        line = lines[node.lineno - 1]
        if "isort:skip" in line or "isort: skip" in line or ";" in line:
            continue

        section = section_of(node)
        if section != prev and (heading := headings.get(section)) is not None:
            # find the first line of the comment block directly above
            i = node.lineno - 1
            while i > 0 and lines[i - 1].startswith("# "):
                i -= 1
            if i < node.lineno - 1 and lines[i] == f"# {heading}":
                used.add(i)
            else:
                errors.append(f"{node.lineno}: missing '# {heading}'")
        prev = section

    for i, line in enumerate(lines):
        if line.startswith("# ") and line[2:] in HEADINGS and i not in used:
            errors.append(f"{i + 1}: misplaced heading '{line}'")

    return errors
