from __future__ import absolute_import, print_function

import os
import time
import pytest
import requests
import subprocess
import signal

from os.path import abspath, basename, dirname, exists, join, relpath, split, splitext

from tests.plugins.upload_to_s3 import S3_URL
from tests.plugins.utils import trace, info, fail, ok, red, warn, write, yellow, white
from tests.plugins.image_diff import process_image_diff
from tests.plugins.phantomjs_screenshot import get_phantomjs_screenshot

from .collect_examples import example_dir
from .utils import (
    deal_with_output_cells,
    get_example_pngs,
    no_ext,
)

import logging
logging.getLogger('requests.packages.urllib3.connectionpool').setLevel(logging.INFO)


@pytest.mark.examples
def test_file_examples(file_example, example, diff, log_file):
    if pytest.config.option.verbose:
        print()

    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    html_file = "%s.html" % no_ext(example.path)
    url = 'file://' + html_file

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

    if not example.no_js:
        _assert_snapshot(example.path, url, 'file', diff)
        if not example.no_diff and diff:
            _get_pdiff(example.path, diff)
        else:
            warn("skipping image diff for %s" % example.relpath)
    else:
        warn("skipping bokehjs for %s" % example.relpath)


@pytest.mark.examples
def test_server_examples(server_example, example, bokeh_server, diff, log_file):
    if pytest.config.option.verbose:
        print()

    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    # Note this is currently broken - server uses random sessions but we're
    # calling for "default" here - this has been broken for a while.
    # https://github.com/bokeh/bokeh/issues/3897
    url = '%s/?bokeh-session-id=%s' % (bokeh_server, basename(no_ext(example.path)))
    assert _run_example(example) == 0, 'Example did not run'

    if not example.no_js:
        _assert_snapshot(example.path, url, 'server', diff)
        if not example.no_diff and diff:
            _get_pdiff(example.path, diff)
        else:
            warn("skipping image diff for %s" % example.relpath)
    else:
        warn("skipping bokehjs for %s" % example.relpath)


@pytest.mark.examples
def test_notebook_examples(notebook_example, example, jupyter_notebook, diff):
    if pytest.config.option.verbose:
        print()

    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    notebook_port = pytest.config.option.notebook_port
    url_path = join(*_get_path_parts(abspath(example.path)))
    url = 'http://localhost:%d/notebooks/%s' % (notebook_port, url_path)
    assert deal_with_output_cells(example.path), 'Notebook failed'
    _assert_snapshot(example.path, url, 'notebook', diff)
    if not example.no_diff and diff:
        _get_pdiff(example.path, diff)


def _get_pdiff(example, diff):
    test_png, ref_png, diff_png = get_example_pngs(example, diff)
    trace("generated image: " + test_png)

    retrieved_reference_image = _get_reference_image_from_s3(example, diff)

    if retrieved_reference_image:
        ref_png_path = dirname(ref_png)
        if not exists(ref_png_path):
            os.makedirs(ref_png_path)

        with open(ref_png, "wb") as f:
            f.write(retrieved_reference_image)

        trace("saved reference: " + ref_png)

        pixels = process_image_diff(diff_png, test_png, ref_png)
        if pixels != 0:
            comment = "dimensions don't match" if pixels == -1 else white("%.04f%%" % pixels) + " of pixels"
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

    # Process resources
    for resource in resources:
        url = resource['url']
        if url.endswith(".png"):
            ok("%s: %s (%s)" % (url, yellow(resource['status']), resource['statusText']))
        else:
            fail("Resource error:: %s: %s (%s)" % (url, red(resource['status']), resource['statusText']), label="JS")

    # You can have a successful test, and still have errors reported, so not failing here.
    for error in errors:
        fail(error['msg'], label="JS")
        for item in error['trace']:
            file = item['file']
            line = item['line']

            if file and line:
                fail("  %s: %d" % (file, line), label="JS")


def _assert_snapshot(example, url, example_type, diff):
    screenshot_path, _, _ = get_example_pngs(example, diff)

    height = 2000 if example_type == 'notebook' else 1000
    wait = 30000

    start = time.time()
    result = get_phantomjs_screenshot(url, screenshot_path, 1000, wait, 1000, height)
    end = time.time()

    info("Example rendered in %s" % white("%.3fs" % (end - start)))

    success = result['success']
    timeout = result['timeout']
    errors = result['errors']
    messages = result['messages']
    resources = result['resources']

    no_errors = len(errors) == 0

    if timeout:
        warn("%s: %s" % (red("TIMEOUT: "), "bokehjs did not finish in %s ms" % wait))

    if pytest.config.option.verbose:
        _print_phantomjs_output(result)

    assert success, "Example failed to load"
    assert no_errors, "Example failed with %d errors" % len(errors)

def _get_reference_image_from_s3(example, diff):
    example_path = relpath(splitext(example)[0], example_dir)
    ref_loc = join(diff, example_path + ".png")
    ref_url = join(S3_URL, ref_loc)
    response = requests.get(ref_url)

    if not response.ok:
        trace("reference image %s doesn't exist" % ref_url)
        return None
    return response.content


def _run_example(example):
    example_path = join(example_dir, example.path)

    code = """\
__file__ = filename = '%s'

import random
random.seed(1)

import numpy as np
np.random.seed(1)

with open(filename, 'rb') as example:
    exec(compile(example.read(), filename, 'exec'))
""" % example_path

    cmd = ["python", "-c", code]
    cwd = dirname(example_path)

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
