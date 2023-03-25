#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utilities for formatting terminal output.

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
import sys

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

    def bright(text: str) -> str: return f"{Style.BRIGHT}{text}{Style.RESET_ALL}"
    def dim(text: str) -> str:    return f"{Style.DIM}{text}{Style.RESET_ALL}"
    def red(text: str) -> str:    return f"{Fore.RED}{text}{Style.RESET_ALL}"
    def green(text: str) -> str:  return f"{Fore.GREEN}{text}{Style.RESET_ALL}"
    def white(text: str) -> str:  return f"{Fore.WHITE}{Style.BRIGHT}{text}{Style.RESET_ALL}"
    def yellow(text: str) -> str: return f"{Fore.YELLOW}{text}{Style.RESET_ALL}"

    if sys.platform == "win32":
        colorama.init()
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


def fail(msg: str | None = None, label: str = "FAIL") -> None:
    text = " " + msg if msg is not None else ""
    write(red(f"[{label}]") + text)


def info(msg: str | None = None, label: str = "INFO") -> None:
    text = " " + msg if msg is not None else ""
    write(white(f"[{label}]") + text)


def ok(msg: str | None = None, label: str = "OK") -> None:
    text = " " + msg if msg is not None else ""
    write(green(f"[{label}]") + text)


def warn(msg: str | None = None, label: str = "WARN") -> None:
    text = " " + msg if msg is not None else ""
    write(yellow(f"[{label}]") + text)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
