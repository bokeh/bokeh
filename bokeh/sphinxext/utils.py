""" Functions useful to directives and roles contained in
the ``bokeh.sphinxext`` package.

"""
from __future__ import absolute_import

import os
from os.path import exists

def out_of_date(original, derived):
    """ Test whether a derived file is newer than its original.

    Args:
        original (str) : full path to original file
        derived (str) : full path to derived file

    Returns:
        bool :
            True if original is newer or derived does not
            exist, False otherwise

    Raises:
        RuntimeError : if original does not exists

    """
    if not exists(original):
        raise RuntimeError()

    if not exists(derived):
        return True

    return os.stat(derived).st_mtime < os.stat(original).st_mtime
