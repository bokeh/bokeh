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

def _print_versions():
    import platform as pt
    from .. import __version__
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


def report_issue(number=None, owner="bokeh", repo="bokeh",
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

    .. note::
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


