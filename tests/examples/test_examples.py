from __future__ import absolute_import, print_function

import os
import time
import pytest
import subprocess
import signal

from os.path import abspath, dirname, exists, join, split

from tests.plugins.utils import trace, info, fail, ok, red, warn, white
from tests.plugins.phantomjs_screenshot import get_phantomjs_screenshot
from tests.plugins.image_diff import image_diff

from .utils import deal_with_output_cells

@pytest.mark.examples
def test_js_examples(js_example, example, report):
    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    if example.no_js:
        if not pytest.config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)
    else:
        _assert_snapshot(example, "file://%s" % example.path, 'js')

        if example.no_diff:
            warn("skipping image diff for %s" % example.relpath)
        else:
            _get_pdiff(example)

@pytest.mark.examples
def test_file_examples(file_example, example, report):
    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    (status, duration, out, err) = _run_example(example)
    info("Example run in %s" % white("%.3fs" % duration))

    for line in out.split("\n"):
        if len(line) == 0 or line.startswith("Wrote "):
            continue
        info(line, label="PY")

    for line in err.split("\n"):
        if len(line) == 0:
            continue
        warn(line, label="PY")

    assert status != "timeout", "%s timed out" % example.relpath
    assert status == 0, "%s failed to run (exit code %s)" % (example.relpath, status)

    if example.no_js:
        if not pytest.config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)
    else:
        _assert_snapshot(example, "file://%s.html" % example.path_no_ext, 'file')

        if example.no_diff:
            warn("skipping image diff for %s" % example.relpath)
        else:
            _get_pdiff(example)


### {{{ THIS IS BROKEN and all examples are skipped in examples.yaml
@pytest.mark.examples
def test_server_examples(server_example, example, bokeh_server, report):
    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    # Note this is currently broken - server uses random sessions but we're
    # calling for "default" here - this has been broken for a while.
    # https://github.com/bokeh/bokeh/issues/3897
    url = '%s/?bokeh-session-id=%s' % (bokeh_server, example.name)
    assert _run_example(example) == 0, 'Example did not run'

    if example.no_js:
        if not pytest.config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)
    else:
        _assert_snapshot(example, url, 'server')

        if example.no_diff:
            warn("skipping image diff for %s" % example.relpath)
        else:
            _get_pdiff(example)


@pytest.mark.examples
def test_notebook_examples(notebook_example, example, jupyter_notebook, report):
    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    notebook_port = pytest.config.option.notebook_port
    url_path = join(*_get_path_parts(abspath(example.path)))
    url = 'http://localhost:%d/notebooks/%s' % (notebook_port, url_path)
    assert deal_with_output_cells(example.path), 'Notebook failed'
    _assert_snapshot(example, url, 'notebook')
    if not example.no_diff:
        _get_pdiff(example)
# }}}

def _get_pdiff(example):
    img_path, ref_path, diff_path = example.img_path, example.ref_path, example.diff_path
    trace("generated image: " + img_path)

    ref = example.fetch_ref()

    if not ref:
        warn("reference image %s doesn't exist" % example.ref_url)
    else:
        ref_dir = dirname(ref_path)
        if not exists(ref_dir):
            os.makedirs(ref_dir)

        with open(ref_path, "wb") as f:
            f.write(ref)

        trace("saved reference: " + ref_path)

        example.pixels = image_diff(diff_path, img_path, ref_path)
        if example.pixels != 0:
            comment = "dimensions don't match" if example.pixels == -1 else white("%.02f%%" % example.pixels) + " of pixels"
            warn("generated and reference images differ: %s" % comment)
        else:
            ok("generated and reference images match")


def _get_path_parts(path):
    parts = []
    while True:
        newpath, tail = split(path)
        parts.append(tail)
        path = newpath
        if tail == 'examples':
            break
    parts.reverse()
    return parts


def _print_phantomjs_output(result):
    errors = result['errors']
    messages = result['messages']
    resources = result['resources']

    for message in messages:
        msg = message['msg']
        line = message.get('line')
        source = message.get('source')

        if source and line:
            msg = "%s:%s: %s" % (source, line, msg)

        info(msg, label="JS")

    for resource in resources:
        fail(resource['errorString'], label="JS")

    for error in errors:
        fail(error['msg'], label="JS")
        for item in error['trace']:
            file = item['file']
            line = item['line']

            if file and line:
                fail("  %s: %d" % (file, line), label="JS")


def _assert_snapshot(example, url, example_type):
    screenshot_path = example.img_path

    width = 1000
    height = 2000 if example_type == 'notebook' else 1000

    local_wait = 100
    global_wait = 30000

    start = time.time()
    result = get_phantomjs_screenshot(url, screenshot_path, local_wait, global_wait, width, height)
    end = time.time()

    info("Example rendered in %s" % white("%.3fs" % (end - start)))

    success = result['success']
    timeout = result['timeout']
    errors = result['errors']
    resources = result['resources']

    no_errors = len(errors) == 0
    no_resources = len(resources) == 0

    if timeout:
        warn("%s %s" % (red("TIMEOUT:"), "bokehjs did not finish in %s ms" % global_wait))

    if pytest.config.option.verbose:
        _print_phantomjs_output(result)

    assert success, "%s failed to load" % example.relpath
    assert no_resources, "%s failed with %d missing resources" % (example.relpath, len(resources))
    assert no_errors, "%s failed with %d errors" % (example.relpath, len(errors))


def _run_example(example):
    code = """\
__file__ = filename = '%s'

import random
random.seed(1)

import numpy as np
np.random.seed(1)

import warnings
warnings.filterwarnings("ignore", ".*", UserWarning, "matplotlib.font_manager")

with open(filename, 'rb') as example:
    exec(compile(example.read(), filename, 'exec'))
""" % example.path

    cmd = ["python", "-c", code]
    cwd = dirname(example.path)

    env = os.environ.copy()
    env['BOKEH_RESOURCES'] = 'relative'
    env['BOKEH_MINIFIED'] = 'false'
    env['BOKEH_BROWSER'] = 'none'

    class Timeout(Exception):
        pass

    def alarm_handler(sig, frame):
        raise Timeout

    signal.signal(signal.SIGALRM, alarm_handler)
    signal.alarm(20 if not example.is_slow else 60)

    start = time.time()
    try:
        proc = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        status = proc.wait()
    except Timeout:
        proc.kill()
        status = 'timeout'
    finally:
        signal.alarm(0)
    end = time.time()

    out = proc.stdout.read().decode("utf-8")
    err = proc.stderr.read().decode("utf-8")

    return (status, end - start, out, err)
