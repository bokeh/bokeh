# Things I need to do:
#
#     Have a google spreadsheet template set up with very specific cell placement for the test matrix.
#
#     Learn the google API such that I can map true or false values to green and red, respectively (cont.)
#     Next, I will have the tests include the cell they need to go as a value in their dictionary.
#
#     Then it's just a matter of having the google API instatiate a copy of the template, plug the values in,
#     then return a URL to the spreadsheet it has created.
#

#     All pip installs failing, but in different ways depending on if they're
#     clean or updates.
#     I don't know how, but updates are still getting bokeh and running it, though
#     the tests fail due to absence of bs4 and websocket.

#     Another note, on windows, you just say "activate" not "source activate" and
#     also the dos command separator is "&&" not ";" so you have to do like
#     "activate foo && stuff" the ; in the python code parts stay tho.

#     --keep-envs (don't delete them at the end)

#     option to only do pip or only do conda

# a --dry-run option that shows (for each env) all the commands that will be run
# (but doesn't actually run them)

# output options. By default prints a human readable table, with --json output
# the JSON data it does now

# option to suppress output from all the commands

import argparse
import os
import shutil
import subprocess
import sys
import textwrap

# preversion = 0.6


def get_parser():
    """Create the parser that will be used to add arguments to the script.
    """

    parser = argparse.ArgumentParser(description=textwrap.dedent("""
                    Creates and runs tests on environments for a given version of bokeh installed using pip and
                    conda and including python 2.7 and python 3.4.

                    The --previous ('-p') option takes an earlier version of bokeh to test against, and for use
                    in creating environments where bokeh will be updated.

                    The --version (-v) option takes the latest version of bokeh to test against in enviornments
                    in which bokeh is updated.
                    """), formatter_class=argparse.RawTextHelpFormatter)

    parser.add_argument('-p', '--previous', action='store', default=False,
                        help="previous version of bokeh", required=True)
    parser.add_argument('-v', '--version', action='store', default=False,
                        help="version of bokeh to test", required=True)

    return parser


def cleaner(env_path):
    """Checks that an environment path exists and, if so, deletes it.
    """

    if os.path.exists(env_path):
        shutil.rmtree(env_path)


def conda_creator(env_name, pkgs):
    """Create a conda environment of a given name containing a given string of pkgs.
    """

    subprocess.call("conda create --yes -n %s %s" % (env_name, pkgs), shell=True)


def bokeh_installer(env_name, install_string):
    """Activate an environment and run its install string to either install or update bokeh using
    conda or pip.
    """

    command_string = 'source activate %s; %s' % (env_name, install_string)

    result = subprocess.call(command_string, shell=True)

    return result == 0


def version_check(env_name, expected_ver):
    """Check a given environment's version of bokeh.
    """

    command_string = 'source activate %s; python -c "import sys, bokeh; sys.exit(0 if bokeh.__version__ == %r else 1)"' % (env_name, expected_ver)



    result = subprocess.call(command_string, shell=True)

    return result == 0


def run_tests(env_name):
    """Run bokeh.test() in a given environment.  Writes results to a tmpfile that will be returned as a string
    in the event of a failure.
    """

    test_failure = ''
    file_name  = "tmpfile.txt"
    tmpfile = open(file_name, "w+")
    command_string = 'source activate %s; python -c "import nose, os, sys, bokeh; bokeh.test(exit=True)"' % env_name

    result = subprocess.call(command_string, shell=True, stderr=tmpfile)


    tmpfile.close()

    if result != 0:
        with open(file_name, "r") as tmpfile:
            test_failure = (tmpfile.read())

    os.remove(file_name)

    return result == 0, test_failure


def server_check(env_name):
    pass
    # Open subprocess, run bokeh server
    # Check return code, if 0, True, if 1, False
    # Kill subprocess


def logger(failure_list):
    """Log items in a list of errors to a logfile.
    """

    logfile = 'logfile'
    while os.path.exists('%s.txt' % logfile):
        logfile = logfile.split('-')
        if len(logfile) == 1:
            logfile.append('2')
        else:
            logfile[1] = str(int(logfile[1]) + 1)
        logfile = '-'.join(logfile)

    with open('%s.txt' % logfile, 'w') as log:
        for failure in failure_list:
            log.write(failure)


if __name__ == '__main__':

    parser = get_parser()
    results = parser.parse_args()
    preversion = results.previous
    current_version = results.version

    envs = {
        "py27_conda_clean"    : {
            "init"    : "python=2.7 nose mock",
            "install" : "conda install --yes bokeh"
            },
        "py27_conda_update"   : {
            "init"    : "python=2.7 nose mock bokeh=%s" % preversion,
            "install" : "conda update --yes bokeh"
            },
        "py27_pip_clean"      : {
            "init"    : "python=2.7 nose mock pip",
            "install" : "pip install bokeh"
            },
        "py27_pip_update"     : {
            "init"    : "python=2.7 pip nose mock bokeh=%s" % preversion,
            "install" : "pip install --upgrade bokeh"
            },
        "py34_conda_clean"    : {
            "init"    : "python=3.4 nose mock",
            "install" : "conda install --yes bokeh"
            },
        "py34_conda_update"   : {
            "init"    : "python=3.4 nose mock bokeh=%s" % preversion,
            "install" : "conda update --yes bokeh"
            },
        "py34_pip_clean"      : {
            "init"    : "python=3.4 nose mock pip",
            "install" : "pip install bokeh"
            },
        "py34_pip_update"     : {
            "init"    : "python=3.4 pip nose mock bokeh=%s" % preversion,
            "install" : "pip install --upgrade bokeh"
            }
    }


    results = {}
    test_failures = []

    for environment in envs:
        results[environment] = {}
        # It needs to clean up after itself AFTERWARDS, too.
        cleaner(os.path.expanduser('~/anaconda/envs/%s' % environment))
        conda_creator(environment, envs[environment]["init"])


        results[environment]['install'] = bokeh_installer(environment, envs[environment]["install"])

        results[environment]['version'] = version_check(environment, current_version)

        results[environment]['test'], failure = run_tests(environment)
        # reproducing line 221.  Better way?
        cleaner(os.path.expanduser('~/anaconda/envs/%s'  % environment))
        if failure:
            test_failures.append(failure)

    print results
    if test_failures:
        logger(test_failures)
