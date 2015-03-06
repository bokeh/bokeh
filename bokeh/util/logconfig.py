"""

"""
from __future__ import absolute_import

import logging

from ..settings import settings

level = settings.py_log_level()
if level is not None:
    logging.basicConfig(level=level)