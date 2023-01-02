#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Configure the logging system for Bokeh.

By default, logging is not configured, to allow users of Bokeh to have full
control over logging policy. However, it is useful to be able to enable
logging arbitrarily during when developing Bokeh. This can be accomplished
by setting the environment variable ``BOKEH_PY_LOG_LEVEL``. Valid values are,
in order of increasing severity:

  - ``debug``
  - ``info``
  - ``warn``
  - ``error``
  - ``fatal``
  - ``none``

The default logging level is ``none``.
"""

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
import sys
from typing import Any, cast

# Bokeh imports
from ..settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
  'basicConfig',
)

default_handler: logging.Handler | None = None

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# TODO: needs typings for basicConfig()
def basicConfig(**kwargs: Any) -> None:
    """
    A logging.basicConfig() wrapper that also undoes the default
    Bokeh-specific configuration.
    """
    if default_handler is not None:
        bokeh_logger.removeHandler(default_handler)
        bokeh_logger.propagate = True
    logging.basicConfig(**kwargs)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

TRACE = 9
logging.addLevelName(TRACE, "TRACE")
def trace(self: logging.Logger, message: str, *args: Any, **kws: Any) -> None:
    if self.isEnabledFor(TRACE):
        self._log(TRACE, message, args, **kws)
cast(Any, logging).Logger.trace = trace
cast(Any, logging).TRACE = TRACE

level = settings.py_log_level()
bokeh_logger = logging.getLogger('bokeh')
root_logger = logging.getLogger()

if level is not None:
    bokeh_logger.setLevel(level)

if not (root_logger.handlers or bokeh_logger.handlers):
    # No handlers configured => at least add a printer to sys.stderr for
    # Bokeh warnings to be displayed
    default_handler = logging.StreamHandler(sys.stderr)
    default_handler.setFormatter(logging.Formatter(logging.BASIC_FORMAT))
    bokeh_logger.addHandler(default_handler)
    # Avoid printing out twice if the root logger is later configured
    # by user.
    bokeh_logger.propagate = False
