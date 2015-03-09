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
from __future__ import absolute_import

import logging

from ..settings import settings

level = settings.py_log_level()
if level is not None:
    logging.basicConfig(level=level)
