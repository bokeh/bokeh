#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Collect the examples report across local or pytest-xdist test runs.'''

from __future__ import annotations

# Standard library imports
from collections.abc import Iterator
from pathlib import Path
from typing import Any

# External imports
import pytest

# Bokeh imports
from tests.support.util.examples import Example

BASE_DIR = Path(__file__).parents[3]

type ReportEntry = tuple[str, str]

_report_active = False
_report_entries: list[ReportEntry] = []


@pytest.fixture(scope="session")
def report(request: pytest.FixtureRequest) -> Iterator[list[Example]]:
    examples: list[Example] = []
    yield examples

    global _report_active
    _report_active = True
    entries = [(example.path, example.img_path) for example in examples]

    worker_output = getattr(request.config, "workeroutput", None)
    if worker_output is None:
        _report_entries.extend(entries)
    else:
        worker_output["examples_report"] = entries


@pytest.hookimpl(optionalhook=True)
def pytest_testnodedown(node: Any, error: object) -> None:
    entries = node.workeroutput.get("examples_report")
    if entries is not None:
        global _report_active
        _report_active = True
        _report_entries.extend(entries)


def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    if hasattr(session.config, "workerinput") or not _report_active:
        return

    entries = sorted(_report_entries)
    images = "".join(f"{Path(img_path).relative_to(BASE_DIR)}\n" for _, img_path in entries)
    contents = "".join(
        f'<div><div><b>{Path(path).relative_to(BASE_DIR)}</b></div>\n'
        f'<a href="{Path(img_path).relative_to(BASE_DIR)}" target="_blank">'
        f'<img src={Path(img_path).relative_to(BASE_DIR)}></img></a>\n</div>'
        for path, img_path in entries
    )
    html = f"""\
<html>
<head>
<title>Examples report</title>
</head>
<body style="display: flex; flex-direction: column;">
{contents}\
</body>
</html>
"""

    (BASE_DIR / ".images-list").write_text(images)
    (BASE_DIR / "examples-report.html").write_text(html)
