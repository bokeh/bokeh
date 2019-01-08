#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import sys
import json
import subprocess

from os.path import abspath, dirname, join, pardir, split

# External imports

# Bokeh imports
from bokeh.util.terminal import trace, fail

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

def run_in_chrome(url, local_wait=None, global_wait=None):
    return _run_in_browser(_get_chrome(), url, local_wait, global_wait)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
