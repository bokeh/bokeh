#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from os import getcwd
from os.path import dirname, basename, splitext, join
from tempfile import NamedTemporaryFile

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'default_filename',
    'detect_current_filename',
    'temp_filename',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def default_filename(ext):
    ''' Generate a default filename with a given extension, attempting to use
    the filename of the currently running process, if possible.

    If the filename of the current process is not available (or would not be
    writable), then a temporary file with the given extension is returned.

    Args:
        ext (str) : the desired extension for the filename

    Returns:
        str

    Raises:
        RuntimeError
            If the extensions requested is ".py"

    '''
    if ext == "py":
        raise RuntimeError("asked for a default filename with 'py' extension")

    filename = detect_current_filename()

    if filename is None:
        return temp_filename(ext)

    basedir = dirname(filename) or getcwd()

    if _no_access(basedir) or _shares_exec_prefix(basedir):
        return temp_filename(ext)

    name, _ = splitext(basename(filename))
    return join(basedir, name + "." + ext)

def detect_current_filename():
    ''' Attempt to return the filename of the currently running Python process

    Returns None if the filename cannot be detected.
    '''
    import inspect

    filename = None
    frame = inspect.currentframe()
    try:
        while frame.f_back and frame.f_globals.get('name') != '__main__':
            frame = frame.f_back

        filename = frame.f_globals.get('__file__')
    finally:
        del frame

    return filename

def temp_filename(ext):
    ''' Generate a temporary, writable filename with the given extension

    '''
    return NamedTemporaryFile(suffix="." + ext).name

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _no_access(basedir):
    ''' Return True if the given base dir is not accessible or writeable

    '''
    import os
    return not os.access(basedir, os.W_OK | os.X_OK)

def _shares_exec_prefix(basedir):
    ''' Whether a give base directory is on the system exex prefix

    '''
    import sys
    prefix = sys.exec_prefix
    return (prefix is not None and basedir.startswith(prefix))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
