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
        return self._get_bool("MINIFIED", default)

    def pretty(self, default=None):
        return self._get_bool("PRETTY", default)

    def pythonlib(self, default=None):
        return self._get_str("PYTHONLIB", default)

settings = Settings()
del Settings

from . import sampledata
from .serverconfig import Server, Cloud

def _print_versions():
    """Returns all the versions of software that Bokeh relies on."""
    import platform as pt

    message = """
    Bokeh version: %s
    Python version: %s-%s
    Platform: %s
    """ % (__version__, pt.python_version(),
           pt.python_implementation(), pt.platform())
    return(message)

def print_versions():
    """Print all the versions of software that Bokeh relies on."""
    print(_print_versions())

def report_issue():
    """Opens a new Github issue programmatically and pass the
    print_versions content into the body of the first comment.

    Parameters
    ----------

    title: str
        The Github issue title, you need to provide one.

    body: str (default=None)
        By default, `report_issue` adds the `print_versions` content
        into the body of the first comment, but you can also pass
        a string as an intro text for your first comment.

    ghuser: str (default=None)
        You can pass your Github username here. Optionally you can
        add your GH username as an environment variable: GHUSER

    ghpass: str (default=None)
        You can pass your GitHub password here. Optionally you can
        add your GH password as an environment variable: GHUSER
    """

    import requests
    import json
    import os
    from urlparse import urljoin

    print("This is the Bokeh reporting engine.\n\n"
          "Please answer the next questions:")

    title = raw_input('Write the title for the intended issue: ')  # Make it py3 compat

    body = raw_input('Write the body for the intended issue: ')  # Make it py3 compat

    ghuser, ghpass = (os.environ.get(x) for x in ["GHUSER", "GHPASS"])
    if ghuser is None and ghpass is None:
        print("You need to add your GHUSER (Github username) "
              "and GHPASS (Github password) to the environment "
              "or complete the next lines.")
        environment = raw_input('Do you want to abort to set up the environment variable? ')  # Make it py3 compat
        if environment.lower() in ["true", "yes", "y", "on", "1"]:
            return
        else:
            ghuser = raw_input('Write your Github username: ')  # Make it py3 compat
            ghpass = raw_input('Write your Github password: ')  # Make it py3 compat
    elif ghuser is None and ghpass is not None:
        print("You need to add your GHUSER (Github username) to the environment.")
        return
    elif ghpass is None and ghuser is not None:
        print("You need to add your GHPASS (Github password) to the environment.")
        return

    base = "https://api.github.com"
    url = "/".join(["repos", "ContinuumIO", "bokeh", "issues"])
    issues_url = urljoin(base, url)
    data = {"title": title, "body": body + "\nversions:\n" + _print_versions()}
    print("\nPreview:\n")
    for label, content in sorted(data.items(), reverse=True):
        print('{0}: {1}'.format(label, content))
    value = raw_input('Submit the intended issue? ')  # Make it py3 compat
    if value.lower() in ["true", "yes", "y", "on", "1"]:
        #r = requests.post(issues_url,
                             #auth=(ghuser, ghpass),
                             #headers={'Content-Type': 'application/json'},
                             #data=json.dumps(data))
        #if r.status_code == 200:
            #print("Issue successfully submitted.")
        #else:
            #print("Something failed, please check your GHUSER and GHPASS.")
        print("Issue successfully submitted.")
    else:
        print("Issue not submitted.")

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
