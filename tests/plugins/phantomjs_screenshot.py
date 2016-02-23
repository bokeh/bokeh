import json
import pytest
import subprocess
import sys

from os.path import join, dirname
from .utils import info, fail


def pytest_addoption(parser):
    parser.addoption(
        "--notebook-phantom-wait", dest="notebook_phantom_wait", action="store", type=int, default=10, help="how long should PhantomJS wait before taking a snapshot of a notebook (in seconds)"
    )
    parser.addoption(
        "--phantomjs", type=str, default="phantomjs", help="phantomjs executable"
    )


def get_phantomjs_screenshot(url, screenshot_path, width=1000, height=1000):
    phantomjs = pytest.config.getoption('phantomjs')

    cmd = [phantomjs, join(dirname(__file__), "phantomjs_screenshot.js"), url, screenshot_path, str(wait), width, height]
    info("Running command: %s" % " ".join(cmd))

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        proc.wait()
    except OSError:
        fail("Failed to run: %s" % " ".join(cmd))
        sys.exit(1)

    return json.loads(proc.stdout.read().decode("utf-8"))
