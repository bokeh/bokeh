#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide utilities for formatting terminal output.

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
import sys

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# provide fallbacks for highlights in case colorama is not installed
try:
    import colorama
    from colorama import Fore, Style

    def bright(text): return "%s%s%s"   % (Style.BRIGHT, text, Style.RESET_ALL)
    def dim(text):    return "%s%s%s"   % (Style.DIM,    text, Style.RESET_ALL)
    def red(text):    return "%s%s%s"   % (Fore.RED,     text, Style.RESET_ALL)
    def green(text):  return "%s%s%s"   % (Fore.GREEN,   text, Style.RESET_ALL)
    def white(text):  return "%s%s%s%s" % (Fore.WHITE, Style.BRIGHT, text, Style.RESET_ALL)
    def yellow(text): return "%s%s%s"   % (Fore.YELLOW,  text, Style.RESET_ALL)
    sys.platform == "win32" and colorama.init()

except ImportError:
    def bright(text): return text
    def dim(text):    return text
    def red(text):    return text
    def green(text):  return text
    def white(text):  return text
    def yellow(text): return text

def trace(*values, **kwargs):
    pass

def write(*values, **kwargs):
    end = kwargs.get('end', '\n')
    print(*values, end=end)

def fail(msg=None, label="FAIL"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (red("[%s]" % label), msg))

def info(msg=None, label="INFO"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (white("[%s]" % label), msg))

def ok(msg=None, label="OK"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (green("[%s]" % label), msg))

def warn(msg=None, label="WARN"):
    msg = " " + msg if msg is not None else ""
    write("%s%s" % (yellow("[%s]" % label), msg))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
