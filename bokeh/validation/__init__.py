''' The validation module provides the capability to perform integrity
checks on an entire collection of Bokeh models.

'''
from __future__ import absolute_import

import logging
logger = logging.getLogger(__file__)


def check_integrity(models):

    import sys
    from inspect import getmembers, isfunction

    from . import errors
    from . import warnings

    messages = []

    error_validators = [o[1] for o in getmembers(errors) if isfunction(o[1])]
    for func in error_validators:
        messages.extend(func(models))

    warning_validators = [o[1] for o in getmembers(warnings) if isfunction(o[1])]
    for func in warning_validators:
        messages.extend(func(models))

    for message in messages:
        if   message.startswith("E"):
            logger.error(message)
        elif message.startswith("W"):
            logger.warn(message)

