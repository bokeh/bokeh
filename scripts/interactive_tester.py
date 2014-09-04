import argparse
import importlib
import os
from shutil import rmtree
from six.moves import input
import sys
import textwrap
import time


# TODO:
#       catch and log exceptions in examples files that fail to open

DIRECTORIES = {
    'file'    : '../../examples/plotting/file',
    'notebook': '../../examples/plotting/notebook',
    'server'  : '../../examples/plotting/server',
    'ggplot'  : '../../examples/compat/ggplot',
    'glyphs'  : '../../examples/glyphs',
    'mpl'     : '../../examples/compat/mpl',
    'pandas'  : '../../examples/compat/pandas',
    'seaborn' : '../../examples/compat/seaborn',
    'charts'  : '../../examples/charts',
}

DEFAULT_TEST_FILES = [
    '../../examples/plotting/file/stocks.py',
    '../../examples/plotting/file/glucose.py',
    '../../examples/compat/ggplot/density.py',
    '../../examples/plotting/server/stocks.py',
    '../../examples/plotting/server/glucose.py',
    '../../examples/plotting/notebook/candlestick.ipynb',
    '../../examples/plotting/notebook/glucose.ipynb',
    '../../examples/compat/seaborn/violin.py',
    '../../examples/charts/boxplot.py',
]


def get_parser():
    """Create the parser that will be used to add arguments to the script.
    """

    parser = argparse.ArgumentParser(description=textwrap.dedent("""
                    Tests a selection of .py or .ipynb bokeh example files.

                    The --location option allows you to select a specific examples subdirectory to test all files in,
                    ignoring __init__.py

                    Location arguments you can choose:
                        - file
                        - notebook
                        - server
                        - ggplot
                        - glyphs
                        - mpl
                        - pandas
                        - seaborn
                    """), formatter_class=argparse.RawTextHelpFormatter)

    parser.add_argument('--no-log', action='store_true', dest='nolog', default=False,
                        help="don't save a log of any errors discovered")
    parser.add_argument('-l', '--location', action='store', default=False,
                        help="example directory in which you wish to test")

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


def main(testing_ground=None):
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

    for index, fileName in enumerate(TestFiles):
        if testing_ground:
            fileName = "%s/%s" % (testing_ground, fileName)
        try:
            command = get_cmd(fileName)
            opener(fileName, command)

            if results.nolog:
                # Don't display 'next file' message after opening final file in a dir
                if index != len(TestFiles)-1:
                    input("\nPress enter to open next file ")
            else:
                ErrorReport = test_status()
                if ErrorReport:
                    Log.append("\n\n%s: \n %s" % (fileName, ErrorReport))

        except (KeyboardInterrupt, EOFError):
            break

    # exit the testing directory and delete it

    os.chdir('../')
    rmtree(testing_directory)

    if Log:
        logger(Log, log_name)


def get_cmd(some_file):
    """Determines how to open a file depending
    on whether it is a .py or a .ipynb file
    """

    if some_file.endswith('.py'):
        command = "python"
    elif some_file.endswith('.ipynb'):
        command = "ipython notebook"

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
        status = input("Unexpected answer. Please type y or n. ")
    if status.startswith('n'):
        ErrorReport = input("Please describe the problem: ")
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

            if target in ['ggplot', 'pandas', 'seaborn', 'charts']:
                if not depend_check(target):
                    sys.exit(1)

            test_dir = DIRECTORIES[target]
    else:
        test_dir = None

    if results.location == 'server' or test_dir is None:
        print("Server examples require bokeh-server. Make sure you've typed 'bokeh-server' in another terminal tab.")
        time.sleep(5)

    main(test_dir)
