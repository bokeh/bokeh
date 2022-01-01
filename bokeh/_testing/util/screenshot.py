#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
import os
import subprocess
import sys
from os.path import (
    abspath,
    dirname,
    join,
    pardir,
    split,
)
from typing import List

# External imports
from typing_extensions import TypedDict

# Bokeh imports
from bokeh.util.terminal import fail, trace

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

TOP_PATH = abspath(join(split(__file__)[0], pardir, pardir, pardir))

__all__ = (
    'run_in_chrome',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class JSImage(TypedDict):
    data: str

class JSError(TypedDict):
    url: str | None
    text: str

class JSMessage(TypedDict):
    level: str
    text: str
    url: str
    line: int
    col: int

class JSResult(TypedDict):
    success: bool
    timeout: float | None
    image: JSImage
    errors: List[JSError]
    messages: List[JSMessage]

def run_in_chrome(url: str, local_wait: int | None = None, global_wait: int | None = None) -> JSResult:
    return _run_in_browser(_get_chrome(), url, local_wait, global_wait)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _get_chrome() -> List[str]:
    return ["node", join(dirname(__file__), "chrome_screenshot.js")]

def _run_in_browser(engine: List[str], url: str, local_wait: int | None = None, global_wait: int | None = None) -> JSResult:
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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
