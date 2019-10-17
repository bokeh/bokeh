from __future__ import absolute_import, print_function

import os
import time
import pytest
import subprocess
import platform
import signal

from os.path import basename, dirname, split

import six

from bokeh.server.callbacks import NextTickCallback, PeriodicCallback, TimeoutCallback
from bokeh._testing.util.screenshot import run_in_chrome

from bokeh.client import push_session
from bokeh.command.util import build_single_handler_application
from bokeh.util.terminal import info, fail, ok, red, warn, white

is_windows = platform.system() == "Windows"

pytest_plugins = (
    "bokeh._testing.plugins.bokeh_server",
    "bokeh._testing.plugins.examples_report",
)

@pytest.mark.examples
def test_js_examples(js_example, example, config, report):
    if example.no_js:
        if not config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)
    else:
        _run_in_browser(example, "file://%s" % example.path, config.option.verbose)

@pytest.mark.examples
def test_file_examples(file_example, example, config, report):
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
        if not config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)
    else:
        _run_in_browser(example, "file://%s.html" % example.path_no_ext, config.option.verbose)

@pytest.mark.examples
def test_server_examples(server_example, example, config, report, bokeh_server):
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
        if not config.option.no_js:
            warn("skipping bokehjs for %s" % example.relpath)
    else:
        _run_in_browser(example, "http://localhost:5006/?bokeh-session-id=%s" % session_id, config.option.verbose)

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

def _create_baseline(items):
    lines = []

    def descend(items, level):
        for item in items:
            type = item["type"]

            bbox = item.get("bbox", None)
            children = item.get("children", [])

            line = "%s%s" % ("  "*level, type)

            if bbox is not None:
                line += " bbox=[%s, %s, %s, %s]" % (bbox["x"], bbox["y"], bbox["width"], bbox["height"])

            line += "\n"

            lines.append(line)
            descend(children, level+1)

    descend(items, 0)
    return "".join(lines)

def _run_in_browser(example, url, verbose=False):
    start = time.time()
    result = run_in_chrome(url)
    end = time.time()

    info("Example rendered in %s" % white("%.3fs" % (end - start)))

    success = result["success"]
    timeout = result["timeout"]
    errors = result["errors"]
    state = result["state"]
    image = result["image"]

    no_errors = len(errors) == 0

    if timeout:
        warn("%s %s" % (red("TIMEOUT:"), "bokehjs did not finish"))

    if verbose:
        _print_webengine_output(result)

    assert success, "%s failed to load" % example.relpath

    has_image = image is not None
    has_state = state is not None
    has_baseline = example.has_baseline
    baseline_ok = True

    if not has_state:
        fail("no state data was produced for comparison with the baseline")
    else:
        new_baseline = _create_baseline(state)
        example.store_baseline(new_baseline)

        if not has_baseline:
            fail("%s baseline doesn't exist" % example.baseline_path)
        else:
            result = example.diff_baseline()

            if result is not None:
                baseline_ok = False
                fail("BASELINE DOESN'T MATCH (make sure to update baselines before running tests):")

                for line in result.split("\n"):
                    fail(line)

    example.store_img(image["data"])
    ref = example.fetch_ref()

    if not ref:
        warn("reference image %s doesn't exist" % example.ref_url)

    if example.no_diff:
        warn("skipping image diff for %s" % example.relpath)
    elif not has_image:
        fail("no image data was produced for comparison with the reference image")
    elif ref:
        pixels = example.image_diff()
        if pixels != 0:
            comment = white("%.02f%%" % pixels) + " of pixels"
            warn("generated and reference images differ: %s" % comment)
        else:
            ok("generated and reference images match")

    assert no_errors, "%s failed with %d errors" % (example.relpath, len(errors))
    assert has_state, "%s didn't produce state data" % example.relpath
    assert has_baseline, "%s doesn't have a baseline" % example.relpath
    assert baseline_ok, "%s's baseline differs" % example.relpath


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
""" % example.path.replace("\\", "\\\\")

    cmd = ["python", "-c", code]
    cwd = dirname(example.path)

    env = os.environ.copy()
    env['BOKEH_IGNORE_FILENAME'] = 'true'
    env['BOKEH_RESOURCES'] = 'relative'
    env['BOKEH_MINIFIED'] = 'false'
    env['BOKEH_BROWSER'] = 'none'

    class Timeout(Exception):
        pass

    if not is_windows:
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
        if not is_windows:
            signal.alarm(0)
    end = time.time()

    out = proc.stdout.read().decode("utf-8")
    err = proc.stderr.read().decode("utf-8")

    return (status, end - start, out, err)
