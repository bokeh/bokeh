from __future__ import absolute_import, print_function

import pytest
import jinja2
import os
import re
import sys

from os.path import join, dirname, isfile, relpath
from py.xml import html

from tests.plugins.constants import __version__
from tests.plugins.utils import get_version_from_git
from tests.plugins.upload_to_s3 import upload_file_to_s3_by_job_id, S3_URL

from .collect_examples import example_dir, get_all_examples
from .utils import no_ext, get_example_pngs, upload_example_pngs_to_s3


PY3 = sys.version_info[0] == 3
if not PY3:
    from codecs import open

default_diff = os.environ.get("BOKEH_DEFAULT_DIFF")
default_upload = default_diff is not None

def pytest_addoption(parser):
    parser.addoption(
        "--notebook-phantom-wait", dest="notebook_phantom_wait", action="store", type=int, default=10, help="How long should PhantomJS wait before taking a snapshot of a notebook (in seconds)"
    )
    parser.addoption(
        "--output-cells", type=str, choices=['complain', 'remove', 'ignore'], default='complain', help="what to do with notebooks' output cells"
    )
    parser.addoption(
        "--report-path", action='store', dest='report_path', metavar='path', default='report.html', help='create examples html report file at given path.'
    )
    parser.addoption(
        "--patterns", type=str, nargs="*", help="select a subset of examples to test"
    )
    parser.addoption(
        "--diff", type=str, default=default_diff, help="compare generated images against this ref"
    )


def pytest_generate_tests(metafunc):
    examples = get_all_examples()
    if 'file_example' in metafunc.fixturenames:
        file_examples = [ e for e in examples if e.is_file ]
        metafunc.parametrize('file_example,example', zip([ e.path for e in file_examples ], file_examples))
    if 'server_example' in metafunc.fixturenames:
        server_examples = [ e for e in examples if e.is_server ]
        metafunc.parametrize('server_example,example', zip([ e.path for e in server_examples ], server_examples))
    if 'notebook_example' in metafunc.fixturenames:
        notebook_examples = [ e for e in examples if e.is_notebook ]
        metafunc.parametrize('notebook_example,example', zip([ e.path for e in notebook_examples ], notebook_examples))


@pytest.fixture
def diff(request):
    rawdiff = request.config.option.diff
    return get_version_from_git(rawdiff)


def pytest_configure(config):
    report_path = config.option.report_path
    # prevent opening htmlpath on slave nodes (xdist)
    if report_path and not hasattr(config, 'slaveinput'):
        diff = config.option.diff
        config.examplereport = ExamplesTestReport(report_path, diff)
        config.pluginmanager.register(config.examplereport)


def pytest_unconfigure(config):
    examplereport = getattr(config, 'examplereport', None)
    if examplereport:
        del config.examplereport
        config.pluginmanager.unregister(html)


class ExamplesTestReport(object):

    def __init__(self, report_path, diff):
        report_path = os.path.expanduser(os.path.expandvars(report_path))
        self.diff = get_version_from_git(diff)
        self.report_path = os.path.abspath(report_path)
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
        example = re.search(r'\[(.*?)\]', report.location[2]).group(1).rsplit('-', 1)[0]
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
            test_url = join(S3_URL, __version__, example_path) + '.png'
            if self.diff:
                diff_url = join(S3_URL, __version__, example_path) + self.diff + '-diff.png'
                ref_url = join(S3_URL, self.diff, example_path) + '.png'
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

        if not os.path.exists(os.path.dirname(self.report_path)):
            os.makedirs(os.path.dirname(self.report_path))

        with open(self.report_path, 'w', encoding='utf-8') as f:
            f.write(html)

        if pytest.config.option.upload:
            upload_example_pngs_to_s3(diff_version)
            upload_file_to_s3_by_job_id(session.config.option.report_path, "text/html", "EXAMPLES REPORT SUCCESSFULLY UPLOADED")
            upload_file_to_s3_by_job_id(session.config.option.log_file, "text/text", "EXAMPLES LOG SUCCESSFULLY UPLOADED")

    def pytest_terminal_summary(self, terminalreporter):
        terminalreporter.write_sep('-', 'generated example report: {0}'.format(self.report_path))
