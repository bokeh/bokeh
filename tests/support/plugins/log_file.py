#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin for a log file fixture.

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
from datetime import datetime
from os.path import splitext
from typing import IO, Iterator

# External imports
import pytest

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'log_file',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture(scope="session")
def log_file(request: pytest.FixtureRequest) -> Iterator[IO[str]]:
    log_file = request.config.option.log_file
    if log_file is None:
        dt = datetime.now().isoformat(timespec="seconds")
        log_file = f"bokeh_{dt}.log"
    worker_input = getattr(request.config, "workerinput", None)
    if worker_input is not None:
        base, ext = splitext(log_file)
        log_file = f"{base}-{worker_input['workerid']}{ext}"
    with open(log_file, "w") as f:
        # Clean-out any existing log-file
        f.write("")
    with open(log_file, "a") as f:
        yield f

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
