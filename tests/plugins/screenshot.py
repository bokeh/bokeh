from __future__ import absolute_import, print_function

import os
import sys
import json
import pytest
import subprocess

from os.path import abspath, dirname, join, pardir, split
from .utils import trace, fail

TOP_PATH = abspath(join(split(__file__)[0], pardir, pardir))

def pytest_addoption(parser):
    parser.addoption(
        "--phantomjs", type=str,
        default=join(TOP_PATH, 'bokehjs', 'node_modules', '.bin', 'phantomjs'),
        help="phantomjs executable"
    )

def _get_phantomjs():
    phantomjs = pytest.config.getoption('phantomjs') if hasattr(pytest, "config") else "phantomjs"
    return [phantomjs, join(dirname(__file__), "phantomjs_screenshot.js")]

def _get_chrome():
    return ["node", join(dirname(__file__), "chrome_screenshot.js")]

def _get_screenshot(engine, url, screenshot_path, local_wait, global_wait, width, height):
    """
    wait is in milliseconds
    """
    cmd = engine + [url, screenshot_path, str(local_wait), str(global_wait), str(width), str(height)]
    trace("Running command: %s" % " ".join(cmd))

    env = os.environ.copy()
    env["NODE_PATH"] = join(TOP_PATH, 'bokehjs', 'node_modules')

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        proc.wait()
    except OSError as e:
        fail("Failed to run: %s" % " ".join(cmd))
        fail(str(e))
        sys.exit(1)

    if proc.returncode != 0:
        output = proc.stderr.read().decode("utf-8")
        fail(output)
        sys.exit(1)

    output = proc.stdout.read().decode("utf-8")
    return json.loads(output)

def get_screenshot(url, screenshot_path, local_wait, global_wait, width, height):
    return _get_screenshot(_get_chrome(), url, screenshot_path, local_wait, global_wait, width, height)
