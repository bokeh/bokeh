""" Functions to help with testing Bokeh and reporting issues.

"""
from __future__ import absolute_import

def skipIfPy3(message):
    """ unittest decoractor to skip a test for Python 3

    """
    from unittest import skipIf
    from .platform import is_py3
    return skipIf(is_py3(), message)


def skipIfPyPy(message):
    """ unittest decoractor to skip a test for PyPy

    """
    from unittest import skipIf
    from .platform import is_pypy
    return skipIf(is_pypy(), message)

def print_versions():
    """ Print the versions for Bokeh and the current Python and OS.

    Returns:
        None

    """
    import platform as pt
    from .. import __version__
    message = """
   Bokeh version: %s
  Python version: %s-%s
        Platform: %s
    """ % (__version__, pt.python_version(),
           pt.python_implementation(), pt.platform())
    print(message)
