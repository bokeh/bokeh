
from ._version import get_versions
__version__ = get_versions()['version']
del get_versions

import sampledata

def print_versions():
    """Print all the versions of software that Blaze relies on."""
    import sys, platform
    print("-=" * 38)
    print("Bokeh version: %s" % __version__)
    print("Python version: %s" % sys.version)
    (sysname, nodename, release, version, machine, processor) = \
        platform.uname()
    print("Platform: %s-%s-%s (%s)" % (sysname, release, machine, version))
    if sysname == "Linux":
        print("Linux dist: %s" % " ".join(platform.linux_distribution()[:-1]))
    if not processor:
        processor = "not recognized"
    print("-=" * 38)

def test(verbosity=1, xunitfile=None, exit=False):
    """
    Runs the full Bokeh test suite, outputting
    the results of the tests to sys.stdout.

    This uses nose tests to discover which tests to
    run, and runs tests in any 'tests' subdirectory
    within the Bokeh module.

    Parameters
    ----------
    verbosity : int, optional
        Value 0 prints very little, 1 prints a little bit,
        and 2 prints the test names while testing.
    xunitfile : string, optional
        If provided, writes the test results to an xunit
        style xml file. This is useful for running the tests
        in a CI server such as Jenkins.
    exit : bool, optional
        If True, the function will call sys.exit with an
        error code after the tests are finished.
    """
    import nose
    import os
    import sys
    argv = ['nosetests', '--verbosity=%d' % verbosity]
    # Output an xunit file if requested
    if xunitfile:
        argv.extend(['--with-xunit', '--xunit-file=%s' % xunitfile])
    # Set the logging level to warn
    argv.extend(['--logging-level=WARN'])
    # Add all 'tests' subdirectories to the options
    rootdir = os.path.dirname(__file__)
    for root, dirs, files in os.walk(rootdir):
        if 'tests' in dirs:
            testsdir = os.path.join(root, 'tests')
            argv.append(testsdir)
            print('Test dir: %s' % testsdir[len(rootdir)+1:])
    # print versions (handy when reporting problems)
    print_versions()
    sys.stdout.flush()
    # Ask nose to do its thing
    return nose.main(argv=argv, exit=exit)
