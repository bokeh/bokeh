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

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from io import StringIO
from pathlib import Path
from textwrap import indent

# External imports
from isort.api import check_file
from isort.exceptions import FileSkipComment, FileSkipSetting
from isort.settings import Config

# Bokeh imports
from tests.support.util.project import TOP_PATH, ls_files

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

DIRECTORIES = (
    "src/bokeh",
    "examples",
    "tools",
    "docs/bokeh",
    "tests",
    "src/typings",
)

@pytest.mark.parametrize("directory", DIRECTORIES)
def test_isort(directory: str) -> None:
    issues = isort(directory)
    assert not issues, f"isort issues in {directory}:\n" + "\n".join(issues)

def test_isort_reports_diff(tmp_path: Path) -> None:
    path = tmp_path / "unsorted.py"
    path.write_text("import sys\nimport os\n")

    report = _check(path, Config(settings_path=str(TOP_PATH / "tests")))

    assert isinstance(report, str), f"expected a report for a mis-sorted file, got {report!r}"
    assert str(path) in report, f"expected the file name in:\n{report}"
    assert "--- " in report and "+++ " in report, f"expected a unified diff, got:\n{report}"
    assert "-import os" in report, f"expected the offending import in:\n{report}"
    assert "+import os" in report, f"expected the reordered import in:\n{report}"

def test_isort_reports_nothing_for_sorted_file(tmp_path: Path) -> None:
    path = tmp_path / "sorted.py"
    path.write_text("# Standard library imports\nimport os\nimport sys\n")

    assert _check(path, Config(settings_path=str(TOP_PATH / "tests"))) is None

#-----------------------------------------------------------------------------
# Support
#-----------------------------------------------------------------------------

def isort(directory: str) -> list[str]:
    ''' Assures that the Python codebase imports are correctly sorted.

    Returns a report for each file with unsorted imports, including the diff
    that isort would apply to fix it.

    '''
    config = Config(settings_path=str(TOP_PATH / directory))
    files = [file for file in ls_files(directory) if file.endswith((".py", ".pyi"))]
    reports = []
    for file in files:
        report = _check(TOP_PATH / file, config)
        if report is not None:
            indented = indent(report, "    ")
            reports.append(f"{file}:\n{indented}")
    return reports

def _check(path: Path, config: Config) -> str | None:
    ''' Returns the diff isort would apply to the file, or ``None`` if the
    imports are already sorted.

    '''
    diff = StringIO()
    try:
        is_sorted = check_file(path, config=config, disregard_skip=False, show_diff=diff)
    except (FileSkipComment, FileSkipSetting):
        return None
    return None if is_sorted else diff.getvalue()
