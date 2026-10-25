#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from subprocess import run

import pytest

from tests.support.util.project import TOP_PATH


@pytest.mark.parametrize("checker", ["mypy", "pyright"])
@pytest.mark.parametrize("fixture", ["model_initializers", "model_initializers_invalid"])
def test_model_initializer_types(checker: str, fixture: str, tmp_path: Path) -> None:
    # Copy fixtures outside the tests package so Mypy's test-module exclusions
    # cannot hide consumer errors. Invalid examples must not enter ordinary scans.
    source = (TOP_PATH / "tests" / "typing" / f"{fixture}.py.txt").read_text()
    path = tmp_path / f"{fixture}.py"
    path.write_text(source)
    expected = Counter(
        (path.resolve(), line_number, code)
        for line_number, line in enumerate(source.splitlines(), 1)
        if (match := re.search(rf"{checker}: ([\w,-]+)", line)) is not None
        for code in match.group(1).split(",")
    )

    if checker == "mypy":
        args = [
            sys.executable, "-m", "mypy", "--no-incremental", "--no-pretty", "--no-error-summary", "--show-error-codes",
            "--cache-dir", str(tmp_path / "mypy-cache"), "--config-file", str(TOP_PATH / "pyproject.toml"), str(path),
        ]
    else:
        args = ["pyright", "--outputjson", "--project", str(TOP_PATH), str(path)]
    result = run(args, cwd=TOP_PATH, capture_output=True, text=True, timeout=120)
    assert result.returncode == (1 if expected else 0), result.stdout + result.stderr

    if checker == "mypy":
        actual = Counter(
            (Path(match.group(1)).resolve(), int(match.group(2)), match.group(3))
            for line in result.stdout.splitlines()
            if (match := re.search(r"^(.*):([0-9]+):[0-9]+: error: .*\[([\w-]+)\]$", line)) is not None
        )
    else:
        diagnostics = json.loads(result.stdout)["generalDiagnostics"]
        actual = Counter(
            (Path(diagnostic["file"]).resolve(), diagnostic["range"]["start"]["line"] + 1, diagnostic.get("rule", ""))
            for diagnostic in diagnostics
            if diagnostic["severity"] == "error"
        )
    imported_errors = {key: count for key, count in actual.items() if key[0] != path.resolve()}
    assert not imported_errors, f"Errors outside the consumer fixture: {imported_errors}\n{result.stdout}"
    assert actual == expected, result.stdout + result.stderr
