from __future__ import absolute_import, print_function

import os
import sys
import json
import subprocess

from os.path import abspath, dirname, join, pardir, split
from bokeh.util.terminal import trace, fail

TOP_PATH = abspath(join(split(__file__)[0], pardir, pardir, pardir))

def _get_chrome():
    return ["node", join(dirname(__file__), "chrome_screenshot.js")]

def _run_in_browser(engine, url, local_wait=None, global_wait=None):
    """
    wait is in milliseconds
    """
    cmd = engine + [url]
    if local_wait is not None:
        cmd += [str(local_wait)]
    if global_wait is not None:
        cmd += [str(global_wait)]
    trace("Running command: %s" % " ".join(cmd))

    env = os.environ.copy()
    env["NODE_PATH"] = join(TOP_PATH, 'bokehjs', 'node_modules')

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
    except OSError as e:
        fail("Failed to run: %s" % " ".join(cmd))
        fail(str(e))
        sys.exit(1)

    (stdout, stderr) = proc.communicate()

    if proc.returncode != 0:
        output = stderr.decode("utf-8")
        fail(output)
        sys.exit(1)

    output = stdout.decode("utf-8")
    return json.loads(output)

def run_in_chrome(url, local_wait=None, global_wait=None):
    return _run_in_browser(_get_chrome(), url, local_wait, global_wait)
