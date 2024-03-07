#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
import sys
from os.path import (
    basename,
    dirname,
    join,
    splitext,
)
from tempfile import NamedTemporaryFile

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

def default_filename(ext: str) -> str:
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

    basedir = dirname(filename) or os.getcwd()

    if _no_access(basedir) or _shares_exec_prefix(basedir):
        return temp_filename(ext)

    name, _ = splitext(basename(filename))
    return join(basedir, name + "." + ext)

def detect_current_filename() -> str | None:
    ''' Attempt to return the filename of the currently running Python process

    Returns None if the filename cannot be detected.
    '''
    import inspect

    filename = None
    frame = inspect.currentframe()
    if frame is not None:
        try:
            while frame.f_back and frame.f_globals.get('name') != '__main__':
                frame = frame.f_back

            filename = frame.f_globals.get('__file__')
        finally:
            del frame

    return filename

def temp_filename(ext: str) -> str:
    ''' Generate a temporary, writable filename with the given extension

    '''
    # todo: not safe - the file is deleted before being written to so another
    # process can generate the same filename
    with NamedTemporaryFile(suffix="." + ext) as f:
        return f.name

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _no_access(basedir: str) -> bool:
    ''' Return True if the given base dir is not accessible or writeable

    '''
    return not os.access(basedir, os.W_OK | os.X_OK)

def _shares_exec_prefix(basedir: str) -> bool:
    ''' Whether a give base directory is on the system exex prefix

    '''
    # XXX: exec_prefix has type str so why the check?
    prefix: str | None = sys.exec_prefix
    return prefix is not None and basedir.startswith(prefix)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
