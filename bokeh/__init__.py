from __future__ import absolute_import, print_function
import warnings
from ._version import get_versions
from . import utils
try:
    from .__conda_version__ import conda_version
    __version__ = conda_version.replace("'","")
    del conda_version
except ImportError:
    __version__ = get_versions()['version']
    del get_versions


_notebook_loaded = None

def load_notebook(resources=None, verbose=False, force=False, skip=False):
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
            notebook = 'notebook' in get_ipython().config.IPKernelApp.parent_appname
        except Exception:
            pass
        if not notebook:
            raise RuntimeError('load_notebook only works inside an '
                               'IPython notebook, try using force=True.')

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
        skip = skip,
    )
    utils.publish_display_data({'text/html': html})

from .settings import settings
from . import sampledata

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

def report_issue(number=None , owner="ContinuumIO", repo="bokeh",
                 versions=True, browser=True):
    """ Open or add to a Github issue programmatically.

    This interactive function will ask you for some minimal content
    and submit a new Github issue, adding information about your
    current environment.

    You can also call this function with a specific issue
    number to add a comment to an already open issue.

    Args:
        number: int (default=None)
            The issue number if you want to add a new comment to an issue
            already created.

        owner: str (default="ContinuumIO")
            Username of the repository's owner.

        repo: str (default="bokeh")
            The name of the repository.

        versions: bool (default=True)
            Adds the `_print_versions` content information at the end of
            the body text.

        browser: bool (default=True)
            After submitting the new issue, it opens the issue webpage in
            your default web browser.

    .. note:
        Setting the environment variables GHUSER (Github username) and
        GHPASS (Github password) will supply those values automatically
        and streamline the dialog. Additionally, this function can report
        on any GitHub project by changing the default parameters.

    """

    import requests
    import json
    import os
    import webbrowser

    from six.moves import input
    from six.moves.urllib.parse import urljoin

    print("This is the Bokeh reporting engine.\n\n"
          "You will be guided to build a GitHub issue.\n")

    if number is None:
        title = input('Issue title: ')
        body = input('Description: ')
    else:
        body = input('Write your comment here: ')

    ghuser, ghpass = (os.environ.get(x) for x in ["GHUSER", "GHPASS"])

    if ghuser is None:
        ghuser = input('GitHub username: ')
    else:
        print("Found GHUSER, using for GitHub username")

    if ghpass is None:
        ghpass = input('GitHub password: ')
    else:
        print("Found GHPASS, using for GitHub password")

    base = "https://api.github.com"
    if number is None:
        url = "/".join(["repos", owner, repo, "issues"])
        if versions:
            data = {"title": title, "body": body + "\n" + _print_versions()}
        else:
            data = {"title": title, "body": body}
    else:
        url = "/".join(["repos", owner, repo, "issues", str(number), "comments"])
        if versions:
            data = {"body": body + "\n" + _print_versions()}
        else:
            data = {"body": body}
    issues_url = urljoin(base, url)

    print("\nPreview:\n")
    print("Title: ", data["title"])
    print("Description:\n\n")
    print(data["body"])
    value = input('Submit (y/n)? ')
    if value.lower() in ["true", "yes", "y", "1"]:
        r = requests.post(issues_url,
                          auth=(ghuser, ghpass),
                          headers={'Content-Type': 'application/json'},
                          data=json.dumps(data))
        if r.status_code == 201:
            g = requests.get(issues_url)
            if number is None:
                print("Issue successfully submitted.")
                if browser:
                    webbrowser.open_new(g.json()[0].get("html_url"))
            else:
                print("Comment successfully submitted.")
                g = requests.get(issues_url)
                if browser:
                    webbrowser.open_new(g.json()[-1].get("html_url"))
        else:
            print("Something failed, please check your username and password.")
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
