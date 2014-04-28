from __future__ import absolute_import, print_function
from ._version import get_versions
__version__ = get_versions()['version']
del get_versions

class Settings(object):
    _prefix = "BOKEH_"

    @property
    def _environ(self):
        import os
        return os.environ

    def _get_str(self, key, default):
        return self._environ.get(self._prefix + key, default)

    def _get_bool(self, key, default):
        value = self._environ.get(self._prefix + key)

        if value is None:
            value = default
        elif value.lower() in ["true", "yes", "on", "1"]:
            value = True
        elif value.lower() in ["false", "no", "off", "0"]:
            value = False
        else:
            raise ValueError("invalid value %r for boolean property %s%s" % (value, self._prefix, key))

        return value

    def browser(self, default=None):
        return self._get_str("BROWSER", default)

    def resources(self, default=None):
        return self._get_str("RESOURCES", default)

    def rootdir(self, default=None):
        return self._get_str("ROOTDIR", default)

    def pretty(self, default=None):
        return self._get_bool("PRETTY", default)
    def pythonlib(self, default=None):
        return self._get_str("PYTHONLIB", default)

settings = Settings()
del Settings

from . import sampledata
from .serverconfig import Server, Cloud

def print_versions():
    """Print all the versions of software that Bokeh relies on."""
    import sys, platform
    print("-=" * 38)
    print("Bokeh version: %s" % __version__)
    print("Python version: %s" % sys.version)
    (sysname, nodename, release, version, machine, processor) = \
        platform.uname()
    print("Platform: %s-%s-%s (%s)" % (sysname, release, machine, version))
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
