# Standard library imports
import argparse
import importlib
import json
import os
import sys
import textwrap
import time
from shutil import rmtree

# TODO:
#       catch and log exceptions in examples files that fail to open

DIRECTORIES = {
    'plotting-file'    : '../../examples/plotting/file',
    'plotting-notebook': '../../examples/plotting/notebook',
    'server'           : '../../examples/plotting/server',
    'webgl'            : '../../examples/webgl',
    'models-file'      : '../../examples/models/file',
    'models-server'    : '../../examples/models/server',
}

DEFAULT_TEST_FILES = [
    '../../examples/plotting/file/stocks.py',
    '../../examples/plotting/file/glucose.py',
    '../../examples/plotting/server/hover.py',
]

SESSION_FILE = os.path.abspath("INTERACTIVE_TESTER_SESSION.json")

def get_parser():
    """Create the parser that will be used to add arguments to the script.
    """

    parser = argparse.ArgumentParser(description=textwrap.dedent("""
                    Tests a selection of .py or .ipynb bokeh example files.

                    The --location option allows you to select a specific examples subdirectory to test all files in,
                    ignoring __init__.py

                    Location arguments can be any valid path to a folder with the examples, like:

                     -l /path/to/my/examplesyou can choose:

                    or any of the pre-built keywords that point to the related examples:
                        - plotting-file
                        - plotting-notebook
                        - server
                        - models-file
                        - models-server
                    """), formatter_class=argparse.RawTextHelpFormatter)

    parser.add_argument('--no-log', action='store_true', dest='nolog', default=False,
                        help="don't save a log of any errors discovered")
    parser.add_argument('-l', '--location', action='store', default=False,
                        help="example directory in which you wish to test")
    parser.add_argument('--reuse-session', action='store_true', dest='reuseSession', default=False,
                        help="do not clean last session log and start from where you left")
    parser.add_argument('--notebook-options', action='store', dest='notebookOptions', default="",
                        help="options to be forwarded to ipython notebook to customize it's behaviour")

    return parser


def depend_check(dependency):
    """
    Make sure a given dependency is installed
    """
    try:
        importlib.import_module(dependency)
        found = True
    except ImportError as e:
        print("%s\nPlease use conda or pip to install the necessary dependency." % (e))
        found = False

    return found


def save_session(session):
    """
    Save the session object to the SESSION_FILE

    Args:
        session(dict): dict with all the example files and results of each run
    """
    with open(SESSION_FILE, 'w') as res_file:
        json.dump(session, res_file)


def get_session():
    """
    Return last stored session
    """
    try:
        with open(SESSION_FILE, 'r') as res_file:
            return json.load(res_file)
    except OSError:
        return {}


def clean_session():
    """
    Removes previous session file
    """
    if os.path.exists(SESSION_FILE):
        os.remove(SESSION_FILE)

def main(testing_ground=None, notebook_options=""):
    """
    Collect and run .py or .ipynb examples from a set list or given examples directory, ignoring __init__.py
    User input is collected to determine a properly or improperly displayed page

    """

    # Create a testing directory if one does not exist, then cd into it

    testing_directory = 'tmp_test'

    if not os.path.exists(testing_directory):
        os.mkdir(testing_directory)

    os.chdir(testing_directory)

    if testing_ground:
        log_name = results.location

        TestFiles = [
            fileName for fileName in os.listdir('%s/.' % testing_ground)
            if fileName.endswith(('.py', '.ipynb')) and fileName != '__init__.py'
        ]

    else:
        log_name = "fast"

        TestFiles = DEFAULT_TEST_FILES

    Log = []

    lastSession = get_session()

    for index, fileName in enumerate(TestFiles):
        if testing_ground:
            fileName = "%s/%s" % (testing_ground, fileName)
        try:

            if not fileName in lastSession:
                lastSession[fileName] = "TESTING..."
                save_session(lastSession)

                command = get_cmd(fileName, notebook_options)
                opener(fileName, command)

                if results.nolog:
                    # Don't display 'next file' message after opening final file in a dir
                    if index != len(TestFiles)-1:
                        input("\nPress enter to open next file ")  # lgtm [py/use-of-input]
                else:
                    ErrorReport = test_status()
                    if ErrorReport:
                        Log.append("\n\n%s: \n %s" % (fileName, ErrorReport))

                    lastSession[fileName] = ErrorReport
                    save_session(lastSession)
            else:
                prevRes = lastSession[fileName]
                if prevRes == "TESTING...":
                    print("RESULT OF %s LAST RUN NOT REGISTERED!!" % fileName)
                    ErrorReport = test_status()
                    lastSession[fileName] = ErrorReport
                    save_session(lastSession)
                else:
                    print("%s detected in last session: SKIPPING" % fileName)

        except (KeyboardInterrupt, EOFError):
            break

    # exit the testing directory and delete it

    os.chdir('../')
    rmtree(testing_directory)

    if Log:
        logger(Log, log_name)


def get_cmd(some_file, notebook_options=""):
    """Determines how to open a file depending
    on whether it is a .py or a .ipynb file
    """

    if some_file.endswith('.py'):
        command = "python"
    elif some_file.endswith('.ipynb'):
        command = "ipython notebook %s" % notebook_options

    return command


def opener(some_file, command):
    """Print to screen what file is being opened and then open the file using
    the command method provided.
    """

    print("\nOpening %s\n" % some_file.strip('../'))
    os.system("%s %s" % (command, some_file))


def test_status():
    """Collect user input to determine if a file displayed correctly or incorrectly.
    In the case of incorrectly displayed plots, an 'ErrorReport' string is returned.
    """

    status = input("Did the plot(s) display correctly? (y/n) ")
    while not status.startswith(('y', 'n')):
        print("")
        status = input("Unexpected answer. Please type y or n. ")  # lgtm [py/use-of-input]
    if status.startswith('n'):
        ErrorReport = input("Please describe the problem: ")  # lgtm [py/use-of-input]
        return ErrorReport


def logger(error_array, name):
    """
    Log errors by appending to a .txt file.  The name and directory the file is saved into
    is provided by the name and log_dir args.
    """

    logfile = "%s_examples_testlog.txt" % name
    if os.path.exists(logfile):
        os.remove(logfile)

    with open(logfile, 'a') as f:
        print("")
        print("\nWriting error log to %s" % logfile)
        for error in error_array:
            f.write("%s\n" % error)


if __name__ == '__main__':

    if not depend_check('bokeh'):
        sys.exit(1)

    parser = get_parser()
    results = parser.parse_args()

    if results.location:
        if results.location and results.location in DIRECTORIES:
            target = results.location

            test_dir = DIRECTORIES[target]

        elif os.path.exists(results.location):
            # in case target is not one of the recognized keys and is a
            # valid path we can run the examples in that folder
            test_dir = results.location
            print("Running examples in custom location:", test_dir)
        else:
            print("Test location '%s' not recognized.\nPlease type 'python interactive_tester.py -h' for a list of valid test directories."
                 % results.location)
            sys.exit(1)
    else:
        test_dir = None

    if results.location == 'server' or test_dir is None:
        print("Server examples require the bokeh server. Make sure you've typed 'bokeh serve' in another terminal tab.")
        time.sleep(4)

    if test_dir is None or 'notebook' in results.location:
        print("Notebook examples require ipython-notebook. Make sure you have conda installed ipython-notebook")
        time.sleep(4)

    if not results.reuseSession:
        print("cleaning previous session file...",)
        clean_session()
        print("OK")

    main(test_dir, notebook_options=results.notebookOptions)
