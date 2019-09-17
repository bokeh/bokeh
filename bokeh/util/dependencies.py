#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utilities for checking dependencies

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
from importlib import import_module
import shutil
from subprocess import Popen, PIPE

from packaging.version import Version as V

# External imports

# Bokeh imports
from ..settings import settings


#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'import_optional',
    'import_required',
    'detect_phantomjs',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def import_optional(mod_name):
    ''' Attempt to import an optional dependency.

    Silently returns None if the requested module is not available.

    Args:
        mod_name (str) : name of the optional module to try to import

    Returns:
        imported module or None, if import fails

    '''
    try:
        return import_module(mod_name)
    except ImportError:
        pass
    except Exception:
        msg = "Failed to import optional module `{}`".format(mod_name)
        log.exception(msg)

def import_required(mod_name, error_msg):
    ''' Attempt to import a required dependency.

    Raises a RuntimeError if the requested module is not available.

    Args:
        mod_name (str) : name of the required module to try to import
        error_msg (str) : error message to raise when the module is missing

    Returns:
        imported module

    Raises:
        RuntimeError

    '''
    try:
        return import_module(mod_name)
    except ImportError:
        raise RuntimeError(error_msg)

def detect_phantomjs(version='2.1'):
    ''' Detect if PhantomJS is avaiable in PATH, at a minimum version.

    Args:
        version (str, optional) :
            Required minimum version for PhantomJS (mostly for testing)

    Returns:
        str, path to PhantomJS

    '''
    if settings.phantomjs_path() is not None:
        phantomjs_path = settings.phantomjs_path()
    else:
        if hasattr(shutil, "which"):
            phantomjs_path = shutil.which("phantomjs") or "phantomjs"
        else:
            # Python 2 relies on Environment variable in PATH - attempt to use as follows
            phantomjs_path = "phantomjs"

    try:
        proc = Popen([phantomjs_path, "--version"], stdout=PIPE, stderr=PIPE)
        proc.wait()
        out = proc.communicate()

        if len(out[1]) > 0:
            raise RuntimeError('Error encountered in PhantomJS detection: %r' % out[1].decode('utf8'))

        required = V(version)
        installed = V(out[0].decode('utf8'))
        if installed < required:
            raise RuntimeError('PhantomJS version to old. Version>=%s required, installed: %s' % (required, installed))

    except OSError:
        raise RuntimeError('PhantomJS is not present in PATH or BOKEH_PHANTOMJS_PATH. Try "conda install phantomjs" or \
            "npm install -g phantomjs-prebuilt"')

    return phantomjs_path

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
