#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define Pytest a plugin for generating the Bokeh examples image diff report

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import io
import os
from os.path import normpath, abspath, dirname, exists, expanduser, expandvars, join, pardir
import re

# External imports
import jinja2
import pytest
from py.xml import html

# Bokeh imports
from bokeh._testing.util.examples import collect_examples, Flags
from bokeh._testing.util.git import __version__
from bokeh._testing.util.s3 import connect_to_s3, upload_file_to_s3_by_job_id
from bokeh.util.terminal import warn

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

_examples = None

__all__ = (
    'ExamplesTestReport',
    'get_all_examples',
    'pytest_generate_tests',
    'pytest_runtest_call',
    'pytest_unconfigure',
    'report',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def get_all_examples(config):
    global _examples
    if _examples is None:
        base_dir = abspath(join(dirname(__file__), pardir, pardir, pardir))

        _examples = collect_examples(join(base_dir, "examples.yaml"))

        for example in _examples:
            example._diff_ref = config.option.diff_ref
            example._upload = config.option.upload

            if config.option.no_js:
                example.flags |= Flags.no_js

    return _examples


def pytest_generate_tests(metafunc):
    if 'example' in metafunc.fixturenames:
        config = metafunc.config
        examples = get_all_examples(config)

        def marks(example):
            result = []
            if example.is_skip:
                result.append(pytest.mark.skip(reason="skipping %s" % example.relpath))
            if example.is_xfail and not example.no_js:
                result.append(pytest.mark.xfail(reason="xfail %s" % example.relpath, strict=True))
            return result

        if 'js_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_js ]
            metafunc.parametrize('js_example,example,config', params)
        if 'file_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_file ]
            metafunc.parametrize('file_example,example,config', params)
        if 'server_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_server ]
            metafunc.parametrize('server_example,example,config', params)
        if 'notebook_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_notebook ]
            metafunc.parametrize('notebook_example,example,config', params)

_warned = False

def pytest_runtest_call(item):
    if 'example' in item.fixturenames:
        if item.config.option.verbose:
            print()

        global _warned
        if not _warned and item.config.option.no_js:
            _warned = True
            warn("All examples will skip js rendering and image diff (under --no-js flag)")

def pytest_unconfigure(config):
    examples_report = getattr(config, 'examples_report', None)
    if examples_report:
        del config.examples_report
        config.pluginmanager.unregister(html)


@pytest.fixture(scope="session")
def report(request):
    config = request.config

    if not hasattr(config, 'examples_report'):
        report_path = config.option.report_path
        diff_ref = config.option.diff_ref

        examples = get_all_examples(config)

        config.examples_report = ExamplesTestReport(config, report_path, diff_ref, examples)
        config.pluginmanager.register(config.examples_report)


class ExamplesTestReport(object):

    def __init__(self, config, report_path, diff_ref, examples):
        self.config = config
        report_path = expanduser(expandvars(report_path))
        self.report_path = abspath(report_path)
        self.examples = { e.path: e for e in examples }
        self.diff = diff_ref
        self.entries = []
        self.errors = self.failed = 0
        self.passed = self.skipped = 0
        self.xfailed = self.xpassed = 0

    def _appendrow(self, result, report):
        skipped = False
        failed = False
        if result == 'Failed':
            failed = True
        if result == 'Skipped':
            skipped = True

        # Example is the path of the example that was run
        # It can be got from the report.location attribute which is a tuple
        # that looks # something like this:
        # ('tests/examples/test_examples.py', 49, 'test_file_examples[/Users/caged/Dev/bokeh/bokeh/examples/models/file/anscombe.py-exampleN]')
        match = re.search(r'\[(.*?)\]', report.location[2])
        if match is not None:
            example_path = normpath(match.group(1).rsplit('-', 2)[0])
            self.entries.append((self.examples[example_path], failed, skipped))

            if self.config.option.incremental:
                self._write_report()

    def _write_report(self):
        with io.open(join(dirname(__file__), "examples_report.jinja"), encoding="utf-8") as f:
            template = jinja2.Template(f.read())

        diff_ref = self.config.option.diff_ref
        html = template.render(version=__version__, diff_ref=diff_ref, entries=self.entries)

        if not exists(dirname(self.report_path)):
            os.makedirs(dirname(self.report_path))

        with io.open(self.report_path, 'w', encoding='utf-8') as f:
            f.write(html)

    def append_pass(self, report):
        self.passed += 1
        self._appendrow('Passed', report)

    def append_failure(self, report):
        if hasattr(report, "wasxfail"):
            self._appendrow('XPassed', report)
            self.xpassed += 1
        else:
            self._appendrow('Failed', report)
            self.failed += 1

    def append_error(self, report):
        self._appendrow('Error', report)
        self.errors += 1

    def append_skipped(self, report):
        if hasattr(report, "wasxfail"):
            self._appendrow('XFailed', report)
            self.xfailed += 1
        else:
            self._appendrow('Skipped', report)
            self.skipped += 1

    def pytest_runtest_logreport(self, report):
        if report.passed:
            if report.when == 'call':
                self.append_pass(report)
        elif report.failed:
            if report.when != "call":
                self.append_error(report)
            else:
                self.append_failure(report)
        elif report.skipped:
            self.append_skipped(report)

    def pytest_sessionfinish(self, session):
        self._write_report()

        if self.config.option.upload:
            if self.config.option.verbose:
                print()

            if connect_to_s3() is None:
                return

            for (example, _, _) in self.entries:
                example.upload_imgs()

            upload_file_to_s3_by_job_id(session.config.option.report_path, "text/html", "EXAMPLES REPORT SUCCESSFULLY UPLOADED")
            upload_file_to_s3_by_job_id(session.config.option.log_file, "text/text", "EXAMPLES LOG SUCCESSFULLY UPLOADED")

    def pytest_terminal_summary(self, terminalreporter):
        terminalreporter.write_sep('-', 'generated example report: {0}'.format(self.report_path))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
