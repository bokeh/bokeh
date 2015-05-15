from __future__ import print_function

import argparse
import os
import shutil
import subprocess
import textwrap

OPTIONS = {
    "dry-run"  :  False,
}

def call_wrapper(cmd_str, *args, **kw):
    """A wrapper for subprocess.call to support 'dry-run' option"""

    if OPTIONS["dry-run"]:
        print(cmd_str)
        return 0
    else:
        return subprocess.call(cmd_str, *args, **kw)


def get_parser():
    """Create the parser that will be used to add arguments to the script.
    """

    parser = argparse.ArgumentParser(description=textwrap.dedent("""
                    Creates and runs tests on conda environments for a given
                    version of bokeh installed using pip and
                    conda and including python 2.7 and python 3.4.

                    The --previous ('-p') option takes an earlier version of
                    bokeh to test against, and for use
                    in creating environments where bokeh will be updated.

                    The --version (-v) option takes the latest version of bokeh
                    to test against in enviornments
                    in which bokeh is updated.

                    By default, all envs created will be deleted when the
                    script finishes.  You can elect to keep these environments
                    with the --keep option.

                    Ex: ' python test_matrix.py -v 0.7.1 -p 0.7.0'
                    """), formatter_class=argparse.RawTextHelpFormatter)

    parser.add_argument('-p', '--previous', action='store', default=False,
                        help='Previous version of bokeh', required=True)
    parser.add_argument('-v', '--version', action='store', default=False,
                        help='Version of bokeh to test', required=True)
    parser.add_argument('--keep', action='store_true', default=False,
                        help="Don't delete conda envs created by this script")
    parser.add_argument('--dry-run', action='store_true', default=False,
                        help="""Display commands that will be run in each environment
                        without executing them.""")
    parser.add_argument('--skip-tests', action='store_true',
                        help="""Skip running tests.""")
    # parser.add_argument('')

    return parser


def cleaner(env_path):
    """Checks that an environment path exists and, if so, deletes it.
    """

    if os.path.exists(env_path):
        shutil.rmtree(env_path)


def conda_creator(env_name, pkgs):
    """Create a conda environment of a given name containing a given string of pkgs.
    """
    call_wrapper("conda create --yes -n %s %s %s" % (env_name, pkgs, OPTIONS["channel"]), shell=True)


def bokeh_installer(env_name, install_string):
    """Activate an environment and run its install string to either install or update bokeh using
    conda or pip.
    """
    if os.name == 'nt':
        command_string = 'activate %s & %s' % (env_name, install_string)
    else:
        command_string = 'source activate %s; %s' % (env_name, install_string)

    result = call_wrapper(command_string, shell=True)

    return result == 0


def version_check(env_name, expected_ver):
    """Check a given environment's version of bokeh.
    """
    if os.name == 'nt':
        command_string = 'activate %s & python -c "import sys, bokeh; sys.exit(0 if bokeh.__version__ == %r else 1)"' % (env_name, expected_ver)
    else:
        command_string = 'source activate %s; python -c "import sys, bokeh; sys.exit(0 if bokeh.__version__ == %r else 1)"' % (env_name, expected_ver)

    result = call_wrapper(command_string, shell=True)

    return result == 0


def run_tests(env_name):
    """Run bokeh.test() in a given environment.  Writes results to a tmpfile that will be returned as a string
    in the event of a failure.
    """

    test_failure = ''
    file_name  = "tmpfile.txt"
    tmpfile = open(file_name, "w+")

    if os.name == 'nt':
        command_string = 'activate %s & python -c "import nose, os, sys, bokeh; bokeh.test(exit=True)"' % env_name
    else:
        command_string = 'source activate %s; python -c "import nose, os, sys, bokeh; bokeh.test(exit=True)"' % env_name

    result = call_wrapper(command_string, shell=True, stderr=tmpfile)

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


def logger(failure_list, logfile='logfile.txt'):
    """Log items in a list of errors to a logfile.
    """

    while os.path.exists(logfile):
        logfile = logfile.split('-')
        if len(logfile) == 1:
            logfile.append('2')
        else:
            logfile[1] = str(int(logfile[1]) + 1)
        logfile = '-'.join(logfile)

    with open(logfile, 'w') as log:
        for failure in failure_list:
            log.write(failure)


if __name__ == '__main__':

    parser = get_parser()
    ops = parser.parse_args()
    OPTIONS["dry-run"] = ops.dry_run

    preversion = ops.previous
    current_version = ops.version

    envs = {
        "py27_conda_clean"    : {
            "init"    : "python=2.7 nose mock",
            "install" : '; '.join([
                    # install latest version from dev channel
                    "conda install --yes -c bokeh/channel/dev bokeh",
                    # install dependencies needed for testing
                    "conda install --yes  -c auto websocket-client",
                    "conda install --yes  -c bokeh nose mock blaze abstract-rendering beautiful-soup "
                    "ipython scipy websocket multiuserblazeserver pillow",
                ])
            },
        "py27_conda_update"   : {
            "init"    : "python=2.7 nose mock bokeh=%s" % preversion,
            "install" : '; '.join([
                    "conda update --yes -c bokeh/channel/dev bokeh",
                    # install dependencies needed for testing
                    "conda install --yes -c auto websocket-client",
                    "conda install --yes -c bokeh nose mock blaze abstract-rendering beautiful-soup "
                    "ipython scipy websocket multiuserblazeserver pillow",
                ])
            },
        "py27_pip_clean"      : {
            "init"    : "python=2.7 nose mock pip",
            "install" : '; '.join([
                "pip install --pre -i https://pypi.binstar.org/bokeh/channel/dev/simple"
                " bokeh --extra-index-url https://pypi.python.org/simple/",
                # install dependencies needed for testing
                "pip install nose mock blaze abstract-rendering beautifulsoup4"
                " ipython scipy websocket-client multiuserblazeserver",
                ])
            },
        "py27_pip_update"     : {
            "init"    : "python=2.7 pip nose mock bokeh=%s" % preversion,
            "install" :  '; '.join([
                "pip install --upgrade --pre -i "
                "https://pypi.binstar.org/bokeh/channel/dev/simple "
                "bokeh --extra-index-url https://pypi.python.org/simple/",
                # install dependencies needed for testing
                "pip install nose mock blaze abstract-rendering beautifulsoup4"
                " ipython scipy websocket-client multiuserblazeserver",
                ])
            },
        "py34_conda_clean"    : {
            "init"    : "python=3.4 nose mock",
            "install" : '; '.join([
                    # install latest version from dev channel
                    "conda install --yes -c bokeh/channel/dev bokeh",
                    # install dependencies needed for testing
                    "conda install --yes  -c bokeh nose mock blaze abstract-rendering beautiful-soup "
                    "ipython scipy multiuserblazeserver pillow",
                ])
            },
        "py34_conda_update"   : {
            "init"    : "python=3.4 nose mock bokeh=%s" % preversion,
            "install" : '; '.join([
                    "conda update --yes -c bokeh/channel/dev bokeh",
                    # install dependencies needed for testing
                    "conda install --yes -c bokeh nose mock blaze abstract-rendering beautiful-soup "
                    "ipython scipy multiuserblazeserver pillow",
                ])
            },
        "py34_pip_clean"      : {
            "init"    : "python=3.4 nose mock pip",
            "install" : '; '.join([
                "pip install --pre -i https://pypi.binstar.org/bokeh/channel/dev/simple"
                " bokeh --extra-index-url https://pypi.python.org/simple/",
                # install dependencies needed for testing
                "pip install nose mock blaze abstract-rendering beautifulsoup4"
                " ipython scipy websocket-client multiuserblazeserver",
                ])
            },
        "py34_pip_update"     : {
            "init"    : "python=3.4 pip nose mock bokeh=%s" % preversion,
            "install" :  '; '.join([
                "pip install --upgrade --pre -i "
                "https://pypi.binstar.org/bokeh/channel/dev/simple "
                "bokeh --extra-index-url https://pypi.python.org/simple/",
                # install dependencies needed for testing
                "pip install nose mock blaze abstract-rendering beautifulsoup4"
                " ipython scipy websocket-client multiuserblazeserver",
                ])
            },
    }

    results = {}
    test_failures = []

    # Use this method rather than os.path.expanduser('~/anaconda') to provide
    # miniconda support
    root = subprocess.check_output(['conda', 'info', '--root']).rstrip()

    for environment in envs:
        print
        print ("CREATING NEW ENV", environment)
        results[environment] = {}
        cleaner(os.path.join(root, "envs", environment))
        conda_creator(environment, envs[environment]["init"])

        results[environment]['install'] = bokeh_installer(environment, envs[environment]["install"])

        results[environment]['version'] = version_check(environment, current_version)

        if not ops.skip_tests:
            results[environment]['test'], failure = run_tests(environment)

            if not ops.keep:
                cleaner(os.path.join(root, "envs", environment))
            if failure:
                test_failures.append(failure)

    print ("*********************")
    print ("RESULTS")
    print(results)
    print ()
    print ("*********************")

    if ops.skip_tests:
        print ("TESTS SKIPPED")
    elif not not ops.dry_run:

        if test_failures:
            logfile = 'logfile.txt'
            print()
            print()
            print("SOME TESTS FAILED, CHECK %s FOR MORE DETAILS" % logfile)
            logger(test_failures, logfile=logfile)
