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

def runtests(verbosity=1, xunitfile=None, exit=False):
    """ Run the full Bokeh test suite, and output the results of the tests
    to sys.stdout.

    This function uses nosetests to discover which tests to run, and will
    run tests in any 'tests' subdirectory within the Bokeh module.

    Args:
        verbosity (int, optional) :
            Acceptable values are 0 (less verbose) to 2 (most verbose)

        xunitfile (str, optional) :
            Write xunit-style XML test results to a given filename. This
            is useful for running tests on a CI server. (default: None)

        exit (bool, optional) :
            Whether to return or exit. If True, call sys.exit with an
            error code after the tests are finished. (default: False)

    Returns:
        int : Nose return code

    """

    import nose, os, sys

    argv = ['nosetests', '--verbosity=%d' % verbosity]

    # Output an xunit file if requested
    if xunitfile:
        argv.extend(['--with-xunit', '--xunit-file=%s' % xunitfile])

    # Set the logging level to warn
    argv.extend(['--logging-level=WARN'])

    # Add all 'tests' subdirectories to the options
    rootdir = os.path.join(os.path.dirname(__file__), "..")
    for root, dirs, files in os.walk(rootdir):
        if 'tests' in dirs:
            testsdir = os.path.join(root, 'tests')
            argv.append(testsdir)
            print('Test dir: %s' % testsdir[len(rootdir)+1:])

    # print versions (handy when reporting problems)
    print_versions()
    sys.stdout.flush()

    # Run the tests
    return nose.main(argv=argv, exit=exit)
