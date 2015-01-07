#!/usr/bin/env python

from __future__ import absolute_import, print_function

import os
import re
import sys
import hashlib
import unittest
import argparse

from bokeh.tests.selenium.utils import TestBrowserCaps
from bokeh.tests.selenium.config import TestMetadata, TestSettings

########
# INFO #
########



#############
# VARIABLES #
#############

metadata = TestMetadata(cwd=os.getcwd())

SCRIPT_NAME = sys.argv[0]

DEF_TEST_VERBOSITY = 1
DEF_BROWSER_ENGINE = metadata.browser_engine
DEF_BROWSER_PLATFORM = metadata.get_default_browser_cap(browser=metadata.browser_engine)
DEF_BROWSER_VERSION = metadata.get_default_browser_cap(browser=metadata.browser_engine, capability='version')
DEF_ENVIRONMENT_MODE = metadata.env_mode
DEF_SELENIUM_SERVER_JAR_PATH = metadata.selenium_server_jar_path
DEF_HEADLESS_MODE = metadata.headless_mode
DEF_HEADLESS_MODE_DISPLAY = metadata.headless_mode_display
DEF_SELENIUM_HUB_ADDRESS = metadata.selenium_hub_address
DEF_DATA_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data')
DEF_DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'down')

DEF_DISCOVER_VERBOSE = 1
DEF_TESTS_BASE_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'tests')

#
# PARSER
#

def InteractiveParser(parser):
    subparsers = parser.add_subparsers(help='Choose exactly one of them.')

    parser_utils = subparsers.add_parser('utils',
        help="Perform some command from utils toolbox.")
    parser_utils.set_defaults(cmd='utils')

    parser_utils.add_argument('-c', dest='list_browsers_caps', action='store_true', default=False,
        help="List all available browsers capabilities in 'distributive' mode.")
    parser_utils.add_argument('-l', dest='list_test_cases', action='store_true', default=False,
        help='List all of available selenium tests.')

    parser_discover = subparsers.add_parser('search',
        help="Use 'discover' module and search for tests, then run all of them.")
    parser_discover.set_defaults(cmd='discover')

    parser_auto = subparsers.add_parser('auto',
        help="Auto run particular tests from previously definied schemas.")
    parser_auto.set_defaults(cmd='auto')

    parser_manual = subparsers.add_parser('manual',
        help="Manually run particular test cases or/and test suites.")
    parser_manual.set_defaults(cmd='manual')

    parser_manual.add_argument('-c', dest='test_case_names', metavar='TEST_CASE_NAME', type=str, nargs='+', default=[],
        help="List of test case names to run. If test name is not unique then more precise name needs to be provided (suite_name.case_name or even file_name.suite_name.case_name).")
    parser_manual.add_argument('-i', dest='test_case_ids', metavar='TEST_CASE_ID', type=int, nargs='+', default=[],
        help="List of test case ID's to run.")
    parser_manual.add_argument('-a', dest='test_case_hashes', metavar='TEST_CASE_HASH', type=str, nargs='+', default=[],
        help="List of test case hashes to run. Hashes may be given partially as long as they are unique.")
    parser_manual.add_argument('-s', dest='test_suite_names', metavar='TEST_SUITE', type=str, nargs='+', default=[],
        help="List of test suites to run (this means run all test cases in each test suite). Full name of suite is required (file_name.suite_name).")

    parser = NonInteractiveParser(parser)

    return parser

def NonInteractiveParser(parser):
    parser.add_argument('-B', dest='browser_engine_bin',
        help="Browser binary (must be found in PATH).")
    parser.add_argument('-D', dest='data_dir', default=DEF_DATA_DIR,
        help="Directory to store any of additional test data. Default value: %s" % (DEF_DATA_DIR))
    parser.add_argument('-V', dest='verbosity', type=int, default=DEF_TEST_VERBOSITY,
        help="Change verbosity of test launcher. Default value: %i" % (DEF_TEST_VERBOSITY))
    parser.add_argument('-a', dest='selenium_hub_address', metavar='HUB_ADDRESS', type=str, action='store', default=DEF_SELENIUM_HUB_ADDRESS,
        help="Full address of selenium hub. The default address is: %s" % (DEF_SELENIUM_HUB_ADDRESS))
    parser.add_argument('-b', dest='browser_engine', metavar='BROWSER', default=DEF_BROWSER_ENGINE,
        choices=metadata.browser_engines, help="Browser engine to use in testing. Choices: %s. Default value: %s" % (metadata.browser_engines, DEF_BROWSER_ENGINE))
    parser.add_argument('-d', dest='discover_dir', metavar='SEARCH_DIR', type=str, action='store', default=DEF_TESTS_BASE_DIR,
        help="Directory where 'discover' module will perform search for tests. The default directory to search (with it's subdirs) is: %s" % (DEF_TESTS_BASE_DIR))
    parser.add_argument('-m', dest='env_mode', default=DEF_ENVIRONMENT_MODE,
        choices=metadata.env_modes, help="Setup environment mode for tests. Default value: %s" % (DEF_ENVIRONMENT_MODE))
    parser.add_argument('-s', dest='selenium_server_jar_path', default=DEF_SELENIUM_SERVER_JAR_PATH,
        help="Path where jar of selenium-server-standalone is placed. Default value: %s" % (DEF_SELENIUM_SERVER_JAR_PATH))
    parser.add_argument('-o', dest='down_dir',  default=DEF_DOWNLOAD_DIR,
        help="Directory where download data will be stored. WARNING: The content of this directory will be removed each time of initialization process. Default value: %s" % (DEF_DOWNLOAD_DIR))
    parser.add_argument('-p', dest='browser_cap_platform', metavar='PLATFORM', type=str, default=DEF_BROWSER_PLATFORM,
        help="Change browser platform in 'distributive' mode of testing. Default: %s" % (DEF_BROWSER_PLATFORM))
    parser.add_argument('-v', dest='browser_cap_version', metavar='VERSION', type=str, default=DEF_BROWSER_VERSION,
        help="Change browser version in 'distributive' mode of testing. Default: %s" % (DEF_BROWSER_VERSION))
    parser.add_argument('-x', dest='headless_mode', action='store_true', default=DEF_HEADLESS_MODE,
        help="Switch to headless way of browser launching. Is relevant only when using 'standalone' mode. Default value: %i" % (DEF_HEADLESS_MODE))
    parser.add_argument('-X', dest='headless_mode_display', metavar='DISPLAY', type=str, default=DEF_HEADLESS_MODE_DISPLAY,
        help="Change value of DISPLAY variable which is required in headless way of browser launching. Default value: '%s'" % (DEF_HEADLESS_MODE_DISPLAY))

    return parser

parser = argparse.ArgumentParser(prog=SCRIPT_NAME, description="Flexible tool responsbile of launching selenium tests for a number of different ways.")

if __name__ == '__main__':
    parser = InteractiveParser(parser)
    myargs = parser.parse_args()
else:
    parser = NonInteractiveParser(parser)
    myargs, unknown_args = parser.parse_known_args()

if not myargs.browser_engine_bin:
    myargs.browser_engine_bin = metadata.get_browser_bin(myargs.browser_engine)

settings = TestSettings(metadata=metadata, env_mode=myargs.env_mode,
    browser_engine=myargs.browser_engine, browser_engines_bin=dict({myargs.browser_engine:myargs.browser_engine_bin}),
    selenium_server_jar_path=myargs.selenium_server_jar_path, data_dir=myargs.data_dir, down_dir=myargs.down_dir,
    headless_mode=myargs.headless_mode, headless_mode_display=myargs.headless_mode_display, selenium_hub_address=myargs.selenium_hub_address,
    browser_caps=TestBrowserCaps(metadata=metadata, platform=myargs.browser_cap_platform, version=myargs.browser_cap_version))

#############
# FUNCTIONS #
#############

def prepare_list_of_tests(discover_dir):
    tests = []

    print("Preparing list of available tests ...")

    loader = unittest.loader.TestLoader()
    discovered_tests = loader.discover(discover_dir)

    for test_group in discovered_tests._tests:
        for test_suite in test_group._tests:
            if test_suite._tests:
                for test_case in test_suite._tests:
                    raw_name = str(test_case)
                    test_case_name = raw_name.rsplit(' ')[0]
                    test_file_name, test_suite_name = raw_name.rsplit(' ')[1].strip('()').split('.')
                    test_namespace = test_file_name+'.'+test_suite_name+'.'+test_case_name

                    test = TestObject(test_namespace, test_case)

                    tests.append(test)

    tests.reverse()

    return tests


def list_available_test_cases(tests):
    if not tests:
        print("\tNo tests were found!")
        return False

    print("")

    index_width = len(str(len(tests)))

    for index, test in enumerate(tests, 1):
        print("\t --- Test ID: {id:>{width}} / HASH: {hash} ---".format(id=index, width=index_width, hash=test.hash_value()))
        print("")

        msg = test.test.shortDescription()

        print("description: %s" % (msg))
        print("")

        test.info()

        print("")

    return True


def check_if_test_suite_is_unique(tests, chosen_suites):
    test_indexes = set()

    for suite in chosen_suites:
        check = False

        match = re.compile(r"\w+\.\w+").match(suite)

        if not match:
            print("The test suite name '%s' doesn't meet naming convention (file_name.suite_name)!" % (suite))
            sys.exit(1)

        for index, test in enumerate(tests):
            if test.suite_namespace() == suite:
                check = True
                test_indexes.add(index)

        if not check:
            print("The test suite '%s' doesn't exists!" % (suite))
            sys.exit(1)

    return list(test_indexes)


def check_if_test_is_unique(tests, chosen_tests):
    test_indexes = set()

    for key, values in iter(chosen_tests.items()):
        if key == 'names':
            for name in values:
                check = 0

                for index, test in enumerate(tests):
                    if name == test.namespace:
                        check += 1
                        test_indexes.add(index)
                        break
                    elif name == test.partial_namespace():
                        check += 1
                        test_indexes.add(index)
                    elif name == test.case_name():
                        check += 1
                        test_indexes.add(index)
                    else:
                        continue

                if check == 0:
                    print("Test case name '%s' was not found!" % (name))
                    sys.exit(1)
                elif check == 1:
                    continue
                else:
                    print("Test case name '%s' is not unique, please be more precise!" % (name))
                    sys.exit(1)
        elif key == 'ids':
            for id in values:
                if id in range(1, len(tests)+1):
                    id -= 1
                    test_indexes.add(id)
                else:
                    print("Test case ID '%i' is out of range!" % (id))
                    sys.exit(1)

        elif key == 'hashes':
            for hash in values:
                check = 0

                for index, test in enumerate(tests):
                    match = re.compile(r"^%s" % (hash), re.I).search(test.hash_value())

                    if match:
                        check += 1
                        test_indexes.add(index)

                if check == 0:
                    print("Test case hash '%s' was not found!" % (hash))
                    sys.exit(1)
                elif check == 1:
                    continue
                else:
                    print("Test case hash '%s' is not unique, please be more precise!" % (hash))
                    sys.exit(1)
        else:
            print("Unsupported key: %s" % (key))
            sys.exit(1)

    return list(test_indexes)


def manual_run(tests, test_indexes, verbosity):
    chosen_tests = []

    runner = unittest.TextTestRunner(verbosity=verbosity)

    for index in test_indexes:
        test = tests[index].test

        chosen_tests.append(test)

    suite = unittest.TestSuite(chosen_tests)

    result = runner.run(suite)


def auto_run():
    print("Currently not implemented. Sorry.")
    sys.exit(1)


def discover_run(discover_dir, verbosity):
    loader = unittest.loader.TestLoader()

    print("Discovering tests in %s ..." % (discover_dir))

    tests = loader.discover(discover_dir)

    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(tests)


def main(args):

    if args.cmd == 'utils':
        if args.list_browsers_caps:
            print("Available browser capabilities to use in 'distributive' mode:")
            metadata.print_default_browser_caps()

            return True

        if args.list_test_cases:
            tests = prepare_list_of_tests(args.discover_dir)
            list_available_test_cases(tests)

            return True

    if args.cmd == 'discover':
        discover_run(args.discover_dir, args.verbosity)

        return True

    if args.cmd == 'auto':
        auto_run()

        return True

    if args.cmd == 'manual':
        tests = prepare_list_of_tests(args.discover_dir)
        all_test_indexes = []

        if args.test_suite_names:
            test_suite_indexes = check_if_test_suite_is_unique(tests, args.test_suite_names)
        else:
            test_suite_indexes = []

        if args.test_case_names or args.test_case_ids or args.test_case_hashes:
            chosen_tests = {
                'names' : args.test_case_names,
                'ids' : args.test_case_ids,
                'hashes': args.test_case_hashes,
            }

            test_case_indexes = check_if_test_is_unique(tests, chosen_tests)
        else:
            test_case_indexes = []

        all_test_indexes = test_suite_indexes + test_case_indexes

        unique_test_indexes = set(all_test_indexes)
        all_test_indexes = list(unique_test_indexes)

        manual_run(tests, all_test_indexes, args.verbosity)

        return True

############
# CLASSESS #
############

class TestObject(object):

    def __init__(self, test_namespace, test):
        _namespace_component_pattern = "\w+"
        _pattern = re.compile(r"{0}\.{0}\.{0}".format(_namespace_component_pattern), re.I)

        _match = _pattern.match(test_namespace)

        if not _match:
            print("Given namespace '%s' doesn't meet pattern requirements: %s" % (test_namespace, _pattern.pattern))
            sys.exit(1)

        self.namespace = test_namespace
        self.test = test

    def partial_namespace(self):
        return self.namespace.split('.', 1)[1]

    def suite_namespace(self):
        return self.namespace.rsplit('.', 1)[0]

    def hash_value(self):
        h = hashlib.sha1()

        h.update(self.namespace)

        return h.hexdigest()

    def file_name(self):
        return self.namespace.rsplit('.')[0]

    def suite_name(self):
        return self.namespace.rsplit('.')[1]

    def case_name(self):
        return self.namespace.rsplit('.')[2]

    def info(self):
        print("file name    = %s" % (self.file_name()))
        print("suite name   = %s" % (self.suite_name()))
        print("case name    = %s" % (self.case_name()))

########
# MAIN #
########

if __name__ == '__main__':
    main(myargs)
