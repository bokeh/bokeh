""" Functions to help with testing Bokeh and reporting issues.

"""
from __future__ import absolute_import, print_function


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


def runtests(args=None):

    """
    Run the Bokeh tests under the bokeh python directory using pytest.

    Does not run tests from bokehjs or examples.

    Args:
        args(list, optional): List of command line arguments accepted by py.test
        e.g. args=['-s', '-k charts'] prevents capture of standard
        out and only runs tests that match charts. For more py.test options see
        http://pytest.org/latest/usage.html#usage.

    Returns:
        int: pytest exitcode
    """

    import pytest
    import os

    try:
        import faulthandler
        faulthandler.enable()
    except ImportError:
        # We can live without in python 2.7
        pass

    # change to the bokeh python source directory, for test collection
    rootdir = os.path.join(os.path.dirname(__file__), os.pardir)
    os.chdir(rootdir)

    return pytest.main(args=args)
