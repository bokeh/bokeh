from __future__ import absolute_import, print_function
from ._version import get_versions
__version__ = get_versions()['version']
del get_versions

_notebook_loaded = None

def load_notebook(resources=None, verbose=False, force=False):
    ''' Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) : a resource object describing how and where to load BokehJS from
        verbose (bool, optional) : whether to report detailed settings (default: False)
        force (bool, optional) : whether to skip IPython notebook check (default: False)

    Returns:
        None

    '''
    global _notebook_loaded

    # It's possible the IPython folks will chance things in the future, `force` parameter
    # provides an escape hatch as long as `displaypub` works
    if not force:
        notebook = False
        try:
            notebook = 'notebook' in get_ipython().config['IPKernelApp']['parent_appname']
        except Exception:
            pass
        if not notebook:
            raise RuntimeError('load_notebook() only works inside an IPython Notebook.')

    import IPython.core.displaypub as displaypub
    from .resources import INLINE
    from .templates import NOTEBOOK_LOAD, RESOURCES

    if resources is None:
        resources = INLINE

    plot_resources = RESOURCES.render(
        js_raw = resources.js_raw,
        css_raw = resources.css_raw,
        js_files = resources.js_files,
        css_files = resources.css_files,
    )

    if resources.mode == 'inline':
        js_info = 'inline'
        css_info = 'inline'
    else:
        js_info = resources.js_files[0] if len(resources.js_files) == 1 else resources.js_files
        css_info = resources.css_files[0] if len(resources.css_files) == 1 else resources.css_files

    warnings = ["Warning: " + msg['text'] for msg in resources.messages if msg['type'] == 'warn']

    if _notebook_loaded:
        warnings.append('Warning: BokehJS previously loaded')

    _notebook_loaded = resources

    html = NOTEBOOK_LOAD.render(
        plot_resources = plot_resources,
        logo_url = resources.logo_url,
        verbose = verbose,
        js_info = js_info,
        css_info = css_info,
        bokeh_version = __version__,
        warnings = warnings,
    )
    displaypub.publish_display_data('bokeh', {'text/html': html})

from .settings import settings
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
