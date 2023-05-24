#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Literal,
    NoReturn,
    Union,
)

if TYPE_CHECKING:
    from types import FrameType
    from typing_extensions import TypeAlias

# External imports
import _pytest.config
import _pytest.mark
import _pytest.python

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent.parent
CASE_DIR = BASE_DIR / "tests" / "cross" / "cases"
BASELINE_DIR = BASE_DIR / "tests" / "baselines" / "cross"

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def pytest_generate_tests(metafunc: _pytest.python.Metafunc) -> None:
    if "case_path" not in metafunc.fixturenames:
        return
    config = metafunc.config
    params = [ pytest.param(str(path.relative_to(CASE_DIR)), config) for path in CASE_DIR.rglob("*.py") ]
    metafunc.parametrize("case_path,config", params)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.mark.skipif(sys.platform == "win32", reason="not supported on windows")
def test_cross(case_path: str, config: _pytest.config.Config) -> None:
    status, _, out, err = _run_test_case(CASE_DIR / case_path)
    if status == 0:
        baseline = (BASELINE_DIR / case_path).with_suffix(".json5")

        os.makedirs(baseline.parent, exist_ok=True)
        with baseline.open("w", encoding="utf-8") as file:
            file.write(out)

        baseline_path = baseline.relative_to(BASE_DIR)
        result = load_baseline(baseline_path)
        if result is None:
            assert False, "missing baseline; commit the baseline and re-run tests"

        status, out, _ = diff_baseline(baseline_path)
        if status != 0:
            print(out)
            assert False, "baseline differs"
    else:
        print(err)
        assert False, "test case failed to run"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

ProcStatus: TypeAlias = Union[int, Literal["timeout"]]

TIMEOUT = 10 # seconds

def _run_test_case(path: Path) -> tuple[ProcStatus, float, str, str]:
    code = f"""\
__file__ = {str(path)!r}

import random
random.seed(1)

import numpy as np
np.random.seed(1)

import warnings
warnings.filterwarnings("ignore", ".*", UserWarning, "matplotlib.font_manager")

with open(__file__, "rb") as file:
    source = file.read()

global_vars = {{}}
exec(compile(source, __file__, "exec"), global_vars)

output = global_vars.get("output")
if output is None:
    raise RuntimeError("'output' not exported from a test case")

from bokeh.document import Document
from bokeh.model import Model

if isinstance(output, Model):
    doc = Document()
    doc.add_root(output)
elif isinstance(output, Document):
    doc = output
else:
    raise RuntimeError("invalid 'output', expected a 'Model' or 'Document'")

rep = doc.to_json(deferred=False)
del rep["title"]
del rep["version"]

import json5
json = json5.dumps(rep, sort_keys=False, indent=2)
print(json)
"""

    cmd = [sys.executable, "-c", code]
    cwd = path.parent

    env = os.environ.copy()

    class Timeout(Exception):
        pass

    if sys.platform != "win32":
        def alarm_handler(sig: int, frame: FrameType | None) -> NoReturn:
            raise Timeout

        signal.signal(signal.SIGALRM, alarm_handler)
        signal.alarm(TIMEOUT)

    start = time.time()
    with subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE) as proc:
        status: ProcStatus
        try:
            status = proc.wait()
        except Timeout:
            proc.kill()
            status = "timeout"
        finally:
            if sys.platform != "win32":
                signal.alarm(0)

        end = time.time()

        assert proc.stdout is not None
        assert proc.stderr is not None

        out = proc.stdout.read().decode("utf-8")
        err = proc.stderr.read().decode("utf-8")

    return (status, end - start, out, err)

def git(*args: str) -> tuple[int, str, str]:
    proc = subprocess.Popen(["git", *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    out = stdout.decode("utf-8", errors="ignore")
    err = stderr.decode("utf-8", errors="ignore")
    return (proc.returncode, out, err)

def load_baseline(baseline_path: Path, ref: str = "HEAD") -> str | None:
    status, out, _ = git("show", f"{ref}:./{baseline_path!s}")
    return out if status == 0 else None

def diff_baseline(baseline_path: Path, ref: str = "HEAD") -> tuple[int, str, str]:
    return git("diff", "--color", "--exit-code", ref, "--", str(baseline_path))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
