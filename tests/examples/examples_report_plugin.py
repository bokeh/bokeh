from __future__ import absolute_import

import pytest
import jinja2
import os
import re
import sys

from os.path import join, dirname, isfile, relpath
from py.xml import html

from tests.utils.constants import __version__, default_diff, default_timeout, s3
from tests.utils.utils import upload_file_to_s3, get_version_from_git

from .collect_examples import example_dir
from .utils import no_ext, get_example_pngs, upload_example_pngs_to_s3


PY3 = sys.version_info[0] == 3
if not PY3:
    from codecs import open


def pytest_addoption(parser):
    parser.addoption(
        "--examplereport", action='store', dest='examplereport', metavar='path', default=None, help='create examples html report file at given path.'
    )
    parser.addoption(
        "--patterns", type=str, nargs="*", help="select a subset of examples to test"
    )
    parser.addoption(
        "--phantomjs", type=str, default="phantomjs", help="phantomjs executable"
    )
    parser.addoption(
        "--timeout", type=int, default=default_timeout, help="how long can an example run (in seconds)"
    )
    parser.addoption(
        "--diff", type=str, default=default_diff, help="compare generated images against this ref"
    )


@pytest.fixture
def diff(request):
    rawdiff = request.config.option.diff
    return get_version_from_git(rawdiff)


def pytest_configure(config):
    examplereport = config.option.examplereport
    # prevent opening htmlpath on slave nodes (xdist)
    if examplereport and not hasattr(config, 'slaveinput'):
        diff = config.option.diff
        config.examplereport = ExamplesTestReport(examplereport, diff)
        config.pluginmanager.register(config.examplereport)


def pytest_unconfigure(config):
    examplereport = getattr(config, 'examplereport', None)
    if examplereport:
        del config.examplereport
        config.pluginmanager.unregister(html)


class ExamplesTestReport(object):

    def __init__(self, examplereport, diff):
        examplereport = os.path.expanduser(os.path.expandvars(examplereport))
        self.diff = get_version_from_git(diff)
        self.examplereport = os.path.abspath(examplereport)
        self.entries = []
        self.errors = self.failed = 0
        self.passed = self.skipped = 0
        self.xfailed = self.xpassed = 0

    def _appendrow(self, result, report):
        upload = pytest.config.option.upload

        skipped = False
        failed = False
        if result == 'Failed':
            failed = True
        if result == 'Skipped':
            skipped = True

        # Example is the path of the example that was run
        # It can be got from the report.location attribute which is a tuple
        # that looks # something like this:
        # ('tests/examples/test_examples.py', 49, 'test_file_examples[/Users/caged/Dev/bokeh/bokeh/examples/models/anscombe.py]')
        example = re.search(r'\[(.*?)\]', report.location[2]).group(1)
        example_path = no_ext(example)
        test_png, ref_png, diff_png = get_example_pngs(example, self.diff)

        images_differ = False
        if diff_png:
            if isfile(diff_png):
                images_differ = True

        if not upload:
            self.entries.append((example_path, self.diff, failed, skipped, test_png, diff_png, ref_png, images_differ))
        else:
            # We have to update the paths so that the html refers to the uploaded ones
            example_path = relpath(no_ext(example), example_dir)
            test_url = join(s3, __version__, example_path) + '.png'
            if self.diff:
                diff_url = join(s3, __version__, example_path) + self.diff + '-diff.png'
                ref_url = join(s3, self.diff, example_path) + '.png'
            else:
                diff_url = None
                ref_url = None
            self.entries.append((example_path, self.diff, failed, skipped, test_url, diff_url, ref_url, images_differ))

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
        with open(join(dirname(__file__), "examples_report.jinja")) as f:
            template = jinja2.Template(f.read())

        diff_version = get_version_from_git(session.config.option.diff)
        html = template.render(version=__version__, diff=diff_version, entries=self.entries)

        if not os.path.exists(os.path.dirname(self.examplereport)):
            os.makedirs(os.path.dirname(self.examplereport))

        with open(self.examplereport, 'w', encoding='utf-8') as f:
            f.write(html)

        if pytest.config.option.upload:
            upload_example_pngs_to_s3(diff_version)
            upload_file_to_s3(session.config.option.examplereport, "text/html")
            upload_file_to_s3(session.config.option.log_file, "text/text")

    def pytest_terminal_summary(self, terminalreporter):
        terminalreporter.write_sep('-', 'generated example report: {0}'.format(
            self.examplereport))
