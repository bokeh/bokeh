from __future__ import absolute_import, print_function

import logging
import warnings
from . import utils
from . import sampledata
from ._version import get_versions
from .settings import settings

# configure logger level
level = settings.py_log_level()
logging.basicConfig(level=level)
# set up the logger
log = logging.getLogger(__name__)

try:
    from .__conda_version__ import conda_version
    __version__ = conda_version.replace("'","")
    del conda_version
except ImportError:
    __version__ = get_versions()['version']
    del get_versions

_notebook_loaded = None

def load_notebook(resources=None, verbose=False, hide_banner=False):
    ''' Prepare the IPython notebook for displaying Bokeh plots.

    Args:
        resources (Resource, optional) :
            how and where to load BokehJS from

        verbose (bool, optional) :
            whether to report detailed settings (default: False)

        hide_banner (bool, optional):
            whether to hide the Bokeh banner (default: False)

    Returns:
        None

    '''
    global _notebook_loaded

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
        hide_banner = hide_banner,
    )
    utils.publish_display_data({'text/html': html})

# load the notebook by default but let the door open for customization, also
# fail silently if IPython is not there.
resources = settings.notebook_resources()
verbose = settings.notebook_verbose()
hide_banner = settings.notebook_hide_banner()

# whether to skip the load_notebook at __init__
skip_load = settings.notebook_skip_load()

# detect if we are in a IPython instance
try:
    ip = get_ipython()
except NameError:
    ip = None
    log.debug("You are not inside an IPython/Jupyter instance.")

# load the notebook resources
try:
    if ip and not skip_load:
        load_notebook(resources=resources, verbose=verbose, hide_banner=hide_banner)
except ImportError:
    log.debug("You don't have IPython/Jupyter installed.")
except IOError:
    log.debug("You don't have the static files available.")

def _print_versions():
    import platform as pt
    message = """
   Bokeh version: %s
  Python version: %s-%s
        Platform: %s
    """ % (__version__, pt.python_version(),
           pt.python_implementation(), pt.platform())
    return(message)

def print_versions():
    """ Print the versions for Bokeh and the current Python and OS.

    Returns:
        None

    """
    print(_print_versions())

def report_issue(number=None , owner="bokeh", repo="bokeh",
                 versions=True, browser=True):
    """ Open or add to a Github issue programmatically.

    This interactive function will ask you for some minimal content
    and submit a new Github issue, adding information about your
    current environment.

    You can also call this function with a specific issue number to
    add a comment to an already open issue.

    Args:
        number (int, optional) :
            Omit to create a new issue, otherwise supply to comment on an
            already created issue. (default: None)

        owner (str, optional) : owner username (default: "bokeh")

        repo (str, optional) : repository name (default: "bokeh")

        versions (bool, optional) :
            Whether to print system information. If True, add the current
            system info to the end of the issue description. (default: True)

        browser (bool, optional) :
            Whether to open a browser automatically. If True, open a browser
            to the GitHub issue page (default: True)

    Notes:
        Setting the environment variables GHUSER (Github username) and
        GHPASS (Github password) will supply those values automatically
        and streamline the dialog. Additionally, this function can report
        on any GitHub project by changing the default parameters.

    Returns:
        None

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
            data = {"title": title, "body": body + "\nSystem information:" + _print_versions()}
        else:
            data = {"title": title, "body": body}
    else:
        url = "/".join(["repos", owner, repo, "issues", str(number), "comments"])
        if versions:
            data = {"body": body + "\nSystem information:" + _print_versions()}
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
    """ Run the full Bokeh test suite, and output the results of the tests
    to sys.stdout.

    This function uses nosetests to discover which tests to run, and will
    run tests in any 'tests' subdirectory within the Bokeh module.

    Args:
        verbosity (int, optional) :
            Acceptatable values are 0 (less verbose) to 2 (most verbose)

        xunitfile (str, optional) :
            Write xunit-style XML test results to a given filename. This
            is useful for running tests on a CI server. (default: None)

        exit (bool, optional) :
            Whether to return or exit. If True, call sys.exit with an
            error code after the tests are finished. (default: False)

    Returns:
        int : nose return code

    """
    import nose, os, sys

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

    # Run the tests
    return nose.main(argv=argv, exit=exit)
