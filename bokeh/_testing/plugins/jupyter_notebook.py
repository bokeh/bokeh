#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define Pytest plugins for Jupyter Notebook tests.

'''

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
from os.path import join, exists, dirname, pardir
import subprocess
import sys
import time


# External imports
import pytest
import requests
from requests.exceptions import ConnectionError

# Bokeh imports
from bokeh.util.terminal import write

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.log_file",
)

__all__ = (
    'jupyter_notebook',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture(scope="session")
def jupyter_notebook(request, log_file):
    """
    Starts a jupyter notebook server at the beginning of a session, and
    closes at the end of a session.

    Adds custom.js that runs all the cells on notebook opening. Cleans out
    this custom.js at the end of the test run.

    Returns the url that the jupyter notebook is running at.

    """

    # First - set-up the notebooks to run all cells when they're opened
    #
    # Can be cleaned up further to remember the user's existing customJS
    # and then restore it after the test run.
    from jupyter_core import paths
    config_dir = paths.jupyter_config_dir()

    body = """
require(["base/js/namespace", "base/js/events"], function (IPython, events) {
    events.on("kernel_ready.Kernel", function () {
        IPython.notebook.execute_all_cells();
    });
});
"""
    custom = join(config_dir, "custom")
    if not exists(custom):
        os.makedirs(custom)

    customjs = join(custom, "custom.js")

    old_customjs = None
    if exists(customjs):
        old_customjs =  open(customjs, "r").read()

    with open(customjs, "w") as f:
        f.write(body)

    # Add in the clean-up code
    def clean_up_customjs():
        text = old_customjs if old_customjs is not None else ""
        with open(customjs, "w") as f:
            f.write(text)

    request.addfinalizer(clean_up_customjs)

    # Second - Run a notebook server at the examples directory
    #

    notebook_port = request.config.option.notebook_port

    env = os.environ.copy()
    env['BOKEH_RESOURCES'] = 'server'

    # Launch from the base directory of bokeh repo
    notebook_dir = join(dirname(__file__), pardir, pardir)

    cmd = ["jupyter", "notebook"]
    argv = ["--no-browser", "--port=%s" % notebook_port, "--notebook-dir=%s" % notebook_dir]
    jupter_notebook_url = "http://localhost:%d" % notebook_port

    try:
        proc = subprocess.Popen(cmd + argv, env=env, stdout=log_file, stderr=log_file)
    except OSError:
        write("Failed to run: %s" % " ".join(cmd + argv))
        sys.exit(1)
    else:
        # Add in the clean-up code
        def stop_jupyter_notebook():
            write("Shutting down jupyter-notebook ...")
            proc.kill()

        request.addfinalizer(stop_jupyter_notebook)

        def wait_until(func, timeout=5.0, interval=0.01):
            start = time.time()

            while True:
                if func():
                    return True
                if time.time() - start > timeout:
                    return False
                time.sleep(interval)

        def wait_for_jupyter_notebook():
            def helper():
                if proc.returncode is not None:
                    return True
                try:
                    return requests.get(jupter_notebook_url)
                except ConnectionError:
                    return False

            return wait_until(helper)

        if not wait_for_jupyter_notebook():
            write("Timeout when running: %s" % " ".join(cmd + argv))
            sys.exit(1)

        if proc.returncode is not None:
            write("Jupyter notebook exited with code " + str(proc.returncode))
            sys.exit(1)

        return jupter_notebook_url

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
