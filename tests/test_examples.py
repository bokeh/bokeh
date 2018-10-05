from __future__ import absolute_import, print_function

import os
from os.path import basename
import time
import pytest
import subprocess
import signal

from os.path import dirname, exists, split

import six

from bokeh.server.callbacks import NextTickCallback, PeriodicCallback, TimeoutCallback
from bokeh._testing.util.images import image_diff
from bokeh._testing.util.screenshot import get_screenshot

from bokeh.client import push_session
from bokeh.command.util import build_single_handler_application
from bokeh.util.terminal import trace, info, fail, ok, red, warn, white

pytest_plugins = (
    "bokeh._testing.plugins.bokeh_server",
    "bokeh._testing.plugins.examples_report",
)

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


@pytest.mark.examples
def test_server_examples(server_example, example, report, bokeh_server):
    if example.is_skip:
        pytest.skip("skipping %s" % example.relpath)

    # mitigate some weird interaction isolated to simple ids, py2.7,
    # "push_session" server usage, and TravisCI
    if six.PY2: os.environ['BOKEH_SIMPLE_IDS'] = 'no'
    app = build_single_handler_application(example.path)
    doc = app.create_document()
    if six.PY2: del os.environ['BOKEH_SIMPLE_IDS']

    # remove all next-tick, periodic, and timeout callbacks
    for session_callback in doc.session_callbacks:
        if isinstance(session_callback, NextTickCallback):
            doc.remove_next_tick_callback(session_callback)
        elif isinstance(session_callback, PeriodicCallback):
            doc.remove_periodic_callback(session_callback)
        elif isinstance(session_callback, TimeoutCallback):
            doc.remove_timeout_callback(session_callback)
        else:
            raise RuntimeError('Unhandled callback type', type(session_callback))

    session_id = basename(example.path)
    push_session(doc, session_id=session_id)

    if example.no_js:
        if not pytest.config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)

    else:
        _assert_snapshot(example, "http://localhost:5006/?bokeh-session-id=%s" % session_id, 'server')

        if example.no_diff:
            warn("skipping image diff for %s" % example.relpath)
        else:
            _get_pdiff(example)


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
            comment = white("%.02f%%" % example.pixels) + " of pixels"
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


def _print_webengine_output(result):
    errors = result['errors']
    messages = result['messages']

    for message in messages:
        level = message['level']
        text = message['text']
        url = message['url']
        line = message['line']
        col = message['col']

        msg = "{%s} %s:%s:%s %s" % (level, url, line, col, text)
        info(msg, label="JS")

    for error in errors:
        for line in error['text'].split("\n"):
            fail(line, label="JS")


def _assert_snapshot(example, url, example_type):
    screenshot_path = example.img_path

    width = 1000
    height = 2000 if example_type == 'notebook' else 1000

    local_wait = 100
    global_wait = 15000

    start = time.time()
    result = get_screenshot(url, screenshot_path, local_wait, global_wait, width, height)
    end = time.time()

    info("Example rendered in %s" % white("%.3fs" % (end - start)))

    success = result['success']
    timeout = result['timeout']
    errors = result['errors']

    no_errors = len(errors) == 0

    if timeout:
        warn("%s %s" % (red("TIMEOUT:"), "bokehjs did not finish in %s ms" % global_wait))

    if pytest.config.option.verbose:
        _print_webengine_output(result)

    assert success, "%s failed to load" % example.relpath
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
    env['BOKEH_IGNORE_FILENAME'] = 'true'
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
