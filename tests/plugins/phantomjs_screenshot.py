from __future__ import absolute_import, print_function

import json
import pytest
import subprocess
import sys

from os.path import abspath, dirname, join, pardir, split
from .utils import trace, fail

TOP_PATH = abspath(join(split(__file__)[0], pardir, pardir))


def pytest_addoption(parser):
    parser.addoption(
        "--phantomjs", type=str,
        default=join(TOP_PATH, 'bokehjs', 'node_modules', '.bin', 'phantomjs'),
        help="phantomjs executable"
    )


def get_phantomjs_screenshot(url, screenshot_path, local_wait=100, global_wait=30000, width=1000, height=1000):
    """
    wait is in milliseconds
    """
    if hasattr(pytest, "config"):
        phantomjs = pytest.config.getoption('phantomjs')
    else:
        phantomjs = "phantomjs"

    cmd = [phantomjs, join(dirname(__file__), "phantomjs_screenshot.js"), url, screenshot_path, str(local_wait), str(global_wait), str(width), str(height)]
    trace("Running command: %s" % " ".join(cmd))

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        proc.wait()
    except OSError:
        fail("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    output = proc.stdout.read().decode("utf-8")
    return json.loads(output)
