''' Utilities for checking dependencies

'''
from importlib import import_module
import logging
from subprocess import Popen, PIPE

from ..settings import settings

logger = logging.getLogger(__name__)


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
        logger.exception(msg)

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

def detect_phantomjs():
    '''Detect if PhantomJS is avaiable in PATH.'''
    if settings.phantomjs_path() is not None:
        phantomjs_path = settings.phantomjs_path()
    else:
        phantomjs_path = "phantomjs"

    try:
        proc = Popen([phantomjs_path, "--version"], stdout=PIPE, stderr=PIPE)
        proc.wait()
    except OSError:
        raise RuntimeError('PhantomJS is not present in PATH. Try "conda install phantomjs" or \
                           "npm install -g phantomjs-prebuilt"')
    else:
        return phantomjs_path
