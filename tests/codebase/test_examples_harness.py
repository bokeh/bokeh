#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
import os
import subprocess
import sys
import time
from pathlib import Path

# Bokeh imports
from tests import test_examples as examples
from tests.support.util.examples import Example, Flags

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.mark.parametrize(("slow", "package", "expected"), [
    (False, False, 20),
    (True, False, 60),
    (False, True, 180),
    (True, True, 180),
])
def test_example_timeout(tmp_path: Path, slow: bool, package: bool, expected: int) -> None:
    extension = tmp_path / "extension"
    extension.mkdir()
    if package:
        (extension / "package.json").write_text("{}")

    flags = Flags.file | (Flags.slow if slow else 0)
    example = Example(str(tmp_path / "example.py"), flags, str(tmp_path), [str(extension)])

    assert examples._example_timeout(example) == expected

def test_terminate_process_tree_terminates_descendants(tmp_path: Path) -> None:
    started = tmp_path / "started"
    release = tmp_path / "release"

    child_code = f"""\
import time
from pathlib import Path

Path({str(started)!r}).touch()
while not Path({str(release)!r}).exists():
    time.sleep(0.01)
"""
    parent_code = f"""\
import subprocess
import sys
import time
from pathlib import Path

subprocess.Popen([sys.executable, "-c", {child_code!r}])
while not Path({str(started)!r}).exists():
    time.sleep(0.01)
print("child started", flush=True)
time.sleep(60)
"""

    proc = subprocess.Popen(
        [sys.executable, "-c", parent_code],
        cwd=str(tmp_path),
        env=os.environ.copy(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=sys.platform != "win32",
    )

    try:
        deadline = time.monotonic() + examples._PROCESS_CLEANUP_TIMEOUT
        while not started.exists():
            assert time.monotonic() < deadline, "descendant process did not start"
            time.sleep(0.01)

        examples._terminate_process_tree(proc)
        proc.communicate(timeout=1)
    finally:
        release.touch()
        examples._close_process(proc)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
