from __future__ import absolute_import, print_function

import io
import os
from os.path import abspath, dirname, exists, expanduser, expandvars, join, pardir
import re

import jinja2
import pytest
from py.xml import html

from tests.plugins.constants import __version__
from tests.plugins.utils import get_version_from_git as resolve_ref
from tests.plugins.upload_to_s3 import upload_file_to_s3_by_job_id
from ..plugins.utils import warn

from .collect_examples import collect_examples, Flags

def pytest_addoption(parser):
    parser.addoption(
        "--notebook-phantom-wait", dest="notebook_phantom_wait", action="store", type=int, default=10,
        help="How long should PhantomJS wait before taking a snapshot of a notebook (in seconds)")
    parser.addoption(
        "--output-cells", type=str, choices=['complain', 'remove', 'ignore'], default='complain',
        help="what to do with notebooks' output cells")
    parser.addoption(
        "--report-path", action='store', dest='report_path', metavar='path', default='report.html',
        help='create examples html report file at given path.')
    parser.addoption(
        "--diff-ref", type=resolve_ref, default="master@{upstream}",
        help="compare generated images against this ref")
    parser.addoption(
        "--incremental", action="store_true", default=False,
        help="write report after each example")
    parser.addoption(
        "--no-js", action="store_true", default=False,
        help="only run python code and skip js and image diff")

_examples = None

def get_all_examples(config):
    global _examples
    if _examples is None:
        base_dir = abspath(join(dirname(__file__), pardir, pardir))

        _examples = []
        _examples.extend(collect_examples(join(base_dir, "examples", "examples.yaml")))
        _examples.extend(collect_examples(join(base_dir, "bokehjs", "examples", "examples.yaml")))

        for example in _examples:
            example._diff_ref = config.option.diff_ref
            example._upload = config.option.upload

            if config.option.no_js:
                example.flags |= Flags.no_js

    return _examples


def pytest_generate_tests(metafunc):
    if 'example' in metafunc.fixturenames:
        examples = get_all_examples(metafunc.config)

        if 'js_example' in metafunc.fixturenames:
            js_examples = [ e for e in examples if e.is_js ]
            metafunc.parametrize('js_example,example', zip([ e.path for e in js_examples ], js_examples))
        if 'file_example' in metafunc.fixturenames:
            file_examples = [ e for e in examples if e.is_file ]
            metafunc.parametrize('file_example,example', zip([ e.path for e in file_examples ], file_examples))
        if 'server_example' in metafunc.fixturenames:
            server_examples = [ e for e in examples if e.is_server ]
            metafunc.parametrize('server_example,example', zip([ e.path for e in server_examples ], server_examples))
        if 'notebook_example' in metafunc.fixturenames:
            notebook_examples = [ e for e in examples if e.is_notebook ]
            metafunc.parametrize('notebook_example,example', zip([ e.path for e in notebook_examples ], notebook_examples))

_warned = False

def pytest_runtest_call(item):
    if 'example' in item.fixturenames:
        if pytest.config.option.verbose:
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

        config.examples_report = ExamplesTestReport(report_path, diff_ref, examples)
        config.pluginmanager.register(config.examples_report)


class ExamplesTestReport(object):

    def __init__(self, report_path, diff_ref, examples):
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
            example_path = match.group(1).rsplit('-', 1)[0]
            self.entries.append((self.examples[example_path], failed, skipped))

            if pytest.config.option.incremental:
                self._write_report()

    def _write_report(self):
        with io.open(join(dirname(__file__), "examples_report.jinja"), encoding="utf-8") as f:
            template = jinja2.Template(f.read())

        diff_ref = pytest.config.option.diff_ref
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

        if pytest.config.option.upload:
            if pytest.config.option.verbose:
                print()

            for (example, _, _) in self.entries:
                example.upload_imgs()

            upload_file_to_s3_by_job_id(session.config.option.report_path, "text/html", "EXAMPLES REPORT SUCCESSFULLY UPLOADED")
            upload_file_to_s3_by_job_id(session.config.option.log_file, "text/text", "EXAMPLES LOG SUCCESSFULLY UPLOADED")

    def pytest_terminal_summary(self, terminalreporter):
        terminalreporter.write_sep('-', 'generated example report: {0}'.format(self.report_path))
