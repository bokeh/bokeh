from __future__ import absolute_import, print_function
from ._version import get_versions
__version__ = get_versions()['version']
del get_versions

def load_notebook(resources=None, verbose=False, force=False):
    ''' Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) : a resource object describing how and where to load BokehJS from
        verbose (bool, optional) : whether to report detailed settings (default: True)
        force (bool, optional) : whether to skip IPython notebook check (default: False)

    '''

    # It's possible the IPython folks will chance things in the future, `force` parameter
    # provides an escape hatch as long as `displaypub` works
    if not force:
        notebook = False
        try:
            from IPython import get_ipython
            notebook = 'notebook' in get_ipython().config['IPKernelApp']['parent_appname']
        except:
            pass
        if not notebook:
            raise RuntimeError('load_notebook() only works inside an IPython notebook.')

    import IPython.core.displaypub as displaypub
    from . import output
    from .templates import NOTEBOOK

    if resources is None:
        resources = output.RESOURCES_INLINE

    data = dict(verbose=verbose)

    if resources.mode == 'inline':
        data['js_raw']  = resources.js_raw
        data['js_info'] = 'inline'
        data['css_raw']  = resources.css_raw
        data['css_info'] = 'inline'
    else:
        data['js_files']  = resources.js_files
        data['js_info'] = data['js_files'][0] if len(data['js_files']) == 1 else data['js_files']
        data['css_files']  = resources.css_files
        data['css_info'] = data['css_files'][0] if len(data['css_files']) == 1 else data['css_files']

    data['logo_url'] = resources.logo_url
    data['bokeh_version'] = __version__
    data['warnings'] = [msg['text'] for msg in resources.messages if msg['type'] == 'warn']

    html = NOTEBOOK.render(data)

    displaypub.publish_display_data('bokeh', {'text/html': html})

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

    def version(self, default=None):
        return self._get_str("VERSION", default)

    def minified(self, default=None):
        return self._get_str("MINIFIED", default)

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
