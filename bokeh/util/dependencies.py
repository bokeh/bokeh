''' Utilities for checking dependencies

'''
from importlib import import_module

def optional(mod_name):
    ''' Try to import a module; return None if not available

    '''
    try:
        return import_module(mod_name)
    except ImportError:
        return None

def required(mod_name, msg):
    ''' Try to import a module; raise RunTimeError with given message
    if not available

    '''
    try:
        return import_module(mod_name)
    except ImportError:
        raise RuntimeError(msg)
