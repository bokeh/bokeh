#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utilities for formatting terminal output.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from typing import Optional

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bright',
    'dim',
    'fail',
    'green',
    'info',
    'ok',
    'red',
    'trace',
    'white',
    'yellow',
    'warn',
    'write',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# provide fallbacks for highlights in case colorama is not installed
try:
    import colorama
    from colorama import Fore, Style

    def bright(text: str) -> str: return "%s%s%s" % (Style.BRIGHT, text, Style.RESET_ALL)
    def dim(text: str) -> str:    return "%s%s%s" % (Style.DIM, text, Style.RESET_ALL)
    def red(text: str) -> str:    return "%s%s%s" % (Fore.RED, text, Style.RESET_ALL)
    def green(text: str) -> str:  return "%s%s%s" % (Fore.GREEN, text, Style.RESET_ALL)
    def white(text: str) -> str:  return "%s%s%s%s" % (Fore.WHITE, Style.BRIGHT, text, Style.RESET_ALL)
    def yellow(text: str) -> str: return "%s%s%s" % (Fore.YELLOW, text, Style.RESET_ALL)

    sys.platform == "win32" and colorama.init()
except ImportError:
    def bright(text: str) -> str: return text
    def dim(text: str) -> str:    return text
    def red(text: str) -> str:    return text
    def green(text: str) -> str:  return text
    def white(text: str) -> str:  return text
    def yellow(text: str) -> str: return text


def trace(*values: str, **kwargs: str) -> None:
    pass


def write(*values: str, **kwargs: str) -> None:
    end = kwargs.get('end', '\n')
    print(*values, end=end)


def fail(msg: Optional[str] = None, label: str = "FAIL") -> None:
    text = " " + msg if msg is not None else ""
    write("%s%s" % (red("[%s]" % label), text))


def info(msg: Optional[str] = None, label: str = "INFO") -> None:
    text = " " + msg if msg is not None else ""
    write("%s%s" % (white("[%s]" % label), text))


def ok(msg: Optional[str] = None, label: str = "OK") -> None:
    text = " " + msg if msg is not None else ""
    write("%s%s" % (green("[%s]" % label), text))


def warn(msg: Optional[str] = None, label: str = "WARN") -> None:
    text = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[%s]" % label), text))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
