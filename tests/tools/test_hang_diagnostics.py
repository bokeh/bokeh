#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import os
import subprocess
import sys
from pathlib import Path

# External imports
import pytest


@pytest.mark.parametrize("parallel", [False, True])
@pytest.mark.parametrize("phase", ["call", "teardown", "finished"])
def test_timeout_preserves_current_test_and_thread_stacks(tmp_path: Path, phase: str, parallel: bool) -> None:
    diagnostics = tmp_path / "diagnostics"
    # Speed up only the watchdog in the isolated probe. The production plugin
    # otherwise runs unchanged, including under pytest's output capture.
    (tmp_path / "conftest.py").write_text(
        "from tests.support.plugins import hang_diagnostics as plugin\n"
        "original = plugin.faulthandler.dump_traceback_later\n"
        "plugin.faulthandler.dump_traceback_later = lambda timeout, **kw: original(0.1, **kw)\n",
        encoding="utf-8",
    )
    if phase == "call":
        source = "import time\ndef test_stuck():\n    time.sleep(60)\n"
    elif phase == "teardown":
        source = (
            "import pytest, time\n"
            "@pytest.fixture\ndef cleanup():\n    yield\n    time.sleep(60)\n"
            "def test_stuck(cleanup):\n    pass\n"
        )
    else:
        source = "def test_stuck():\n    pass\n"
    (tmp_path / "test_probe.py").write_text(source, encoding="utf-8")
    workers = ["-p", "xdist.plugin", "-n", "2", "--max-worker-restart=0"] if parallel else []
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "-p", "pytest_timeout",
         "-p", "tests.support.plugins.hang_diagnostics", "--timeout=0.6",
         "--timeout-method=thread", *workers, "test_probe.py"],
        cwd=tmp_path,
        env={**os.environ, "PYTHONPATH": str(Path(__file__).resolve().parents[2]),
             "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1", "PYTEST_ADDOPTS": "",
             "BOKEH_TEST_DIAGNOSTICS_DIR": str(diagnostics)},
        capture_output=True, text=True, timeout=15,
    )
    assert (result.returncode == 0) == (phase == "finished"), result.stdout + result.stderr
    if phase != "finished" and not parallel:
        assert "Timeout" in result.stdout + result.stderr
    current, = diagnostics.glob("*.current.txt")
    assert current.read_text(encoding="utf-8").strip() == f"test_probe.py::test_stuck ({phase})"
    if phase != "finished":
        trace = current.with_name(current.name.replace(".current.txt", ".stacks.txt"))
        assert "test_probe.py" in trace.read_text(encoding="utf-8")
