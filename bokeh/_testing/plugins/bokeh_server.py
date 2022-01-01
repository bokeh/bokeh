#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin to provide a Bokeh server

'''

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
import os
import subprocess
import sys
import time
from typing import IO, Any, Callable

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
    'bokeh_server',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture(scope='session')
def bokeh_server(request: pytest.FixtureRequest, log_file: IO[str]) -> str:
    bokeh_port: int = request.config.option.bokeh_port

    cmd = ["python", "-m", "bokeh", "serve"]
    argv = [f"--port={bokeh_port}"]
    bokeh_server_url = f"http://localhost:{bokeh_port}"

    env = os.environ.copy()
    env['BOKEH_MINIFIED'] = 'false'

    try:
        proc = subprocess.Popen(cmd + argv, env=env, stdout=log_file, stderr=log_file)
    except OSError:
        write(f"Failed to run: {' '.join(cmd + argv)}")
        sys.exit(1)
    else:
        # Add in the clean-up code
        def stop_bokeh_server() -> None:
            write("Shutting down bokeh-server ...")
            proc.kill()
        request.addfinalizer(stop_bokeh_server)

        def wait_until(func: Callable[[], Any], timeout: float = 5.0, interval: float = 0.01) -> bool:
            start = time.time()

            while True:
                if func():
                    return True
                if time.time() - start > timeout:
                    return False
                time.sleep(interval)

        def wait_for_bokeh_server() -> bool:
            def helper() -> Any:
                if proc.returncode is not None:
                    return True
                try: # type: ignore[unreachable] # XXX: typeshed bug, proc.returncode: int
                    return requests.get(bokeh_server_url)
                except ConnectionError:
                    return False

            return wait_until(helper)

        if not wait_for_bokeh_server():
            write(f"Timeout when running: {' '.join(cmd + argv)}")
            sys.exit(1)

        if proc.returncode is not None:
            write(f"bokeh server exited with code {proc.returncode}")
            sys.exit(1)

        return bokeh_server_url # type: ignore[unreachable] # XXX: typeshed bug, proc.returncode: int

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
