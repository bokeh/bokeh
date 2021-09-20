#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
import signal
import subprocess
import sys
import time
from os.path import (
    abspath,
    basename,
    dirname,
    join,
    relpath,
)
from types import FrameType
from typing import (
    Iterator,
    List,
    NoReturn,
    Tuple,
    Union,
)

# External imports
import _pytest.config
import _pytest.mark
import _pytest.python
from typing_extensions import Literal

# Bokeh imports
from bokeh._testing.util.examples import Example, Flags, collect_examples
from bokeh._testing.util.screenshot import JSResult, run_in_chrome
from bokeh.client import push_session
from bokeh.command.util import build_single_handler_application
from bokeh.core.types import ID
from bokeh.server.callbacks import NextTickCallback, PeriodicCallback, TimeoutCallback
from bokeh.util.terminal import (
    fail,
    info,
    red,
    warn,
    white,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh_server",
)

BASE_DIR = abspath(dirname(dirname(__file__)))

_examples: List[Example] | None = None

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def get_all_examples(config: _pytest.config.Config) -> List[Example]:
    global _examples
    if _examples is None:
        _examples = collect_examples(join(BASE_DIR, "tests", "examples.yaml"))

        for example in _examples:
            if config.option.no_js:
                example.flags |= Flags.no_js

    return _examples

def pytest_generate_tests(metafunc: _pytest.python.Metafunc) -> None:
    if 'example' in metafunc.fixturenames:
        config = metafunc.config
        examples = get_all_examples(config)

        def marks(example: Example) -> List[_pytest.mark.MarkDecorator]:
            result = []
            if example.is_skip:
                result.append(pytest.mark.skip(reason=f"skipping {example.relpath}"))
            if example.is_xfail and not example.no_js:
                result.append(pytest.mark.xfail(reason=f"xfail {example.relpath}", strict=True))
            return result

        if 'file_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_file ]
            metafunc.parametrize('file_example,example,config', params)
        if 'server_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_server ]
            metafunc.parametrize('server_example,example,config', params)
        if 'notebook_example' in metafunc.fixturenames:
            params = [ pytest.param(e.path, e, config, marks=marks(e)) for e in examples if e.is_notebook ]
            metafunc.parametrize('notebook_example,example,config', params)

@pytest.fixture(scope="session", autouse=True)
def report() -> Iterator[List[Example]]:
    report: List[Example] = []
    yield report

    images = ""
    for example in report:
        images += relpath(example.img_path, BASE_DIR) + "\n"

    contents = ""
    for example in report:
        path = relpath(example.path, BASE_DIR)
        img_path = relpath(example.img_path, BASE_DIR)
        contents += """<div>"""
        contents += f"""<div><b>{path}</b></div>\n"""
        contents += f"""<a href="{img_path}" target="_blank"><img src={img_path}></img></a>\n"""
        contents += """</div>"""

    html = f"""\
<html>
<head>
<title>Examples report</title>
</head>
<body style="display: flex; flex-direction: column;">
{contents}\
</body>
</html>
"""

    with open(join(BASE_DIR, ".images-list"), "w") as f:
        f.write(images)

    with open(join(BASE_DIR, "examples-report.html"), "w") as f:
        f.write(html)

def test_file_examples(file_example: Example, example: Example, report: List[Example], config: _pytest.config.Config, bokeh_server: str) -> None:
    if config.option.verbose:
        print()
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
        _run_in_browser(example, "file://%s.html" % example.path_no_ext, report, config.option.verbose)

def test_server_examples(server_example: Example, example: Example, report: List[Example], config: _pytest.config.Config, bokeh_server: str) -> None:
    if config.option.verbose:
        print()
    app = build_single_handler_application(example.path)
    doc = app.create_document()

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

    session_id = ID(basename(example.path))
    push_session(doc, session_id=session_id)

    if example.no_js:
        if not config.option.no_js:
            warn(f"skipping bokehjs for {example.relpath}")
    else:
        _run_in_browser(example, f"http://localhost:5006/?bokeh-session-id={session_id}", report, config.option.verbose)

def _print_webengine_output(result: JSResult) -> None:
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
        _url = error["url"]
        if _url is not None:
            fail(f"@{_url}", label="JS")
        for _line in error['text'].split("\n"):
            fail(_line, label="JS")

def _run_in_browser(example: Example, url: str, report: List[Example], verbose: bool = False) -> None:
    start = time.time()
    result = run_in_chrome(url)
    end = time.time()

    info("Example rendered in %s" % white("%.3fs" % (end - start)))

    success = result["success"]
    timeout = result["timeout"]
    errors = result["errors"]

    image = result["image"]
    example.store_img(image["data"])
    report.append(example)

    no_errors = len(errors) == 0

    if timeout:
        warn("%s %s" % (red("TIMEOUT:"), "bokehjs did not finish"))

    if verbose:
        _print_webengine_output(result)

    assert success, f"{example.relpath} failed to load"

    assert no_errors, f"{example.relpath} failed with {len(errors)} errors"

ProcStatus = Union[int, Literal["timeout"]]

def _run_example(example: Example) -> Tuple[ProcStatus, float, str, str]:
    code = f"""\
__file__ = filename = {example.path!r}

import random
random.seed(1)

import numpy as np
np.random.seed(1)

import warnings
warnings.filterwarnings("ignore", ".*", UserWarning, "matplotlib.font_manager")

for ext_dir in {example.extensions!r}:
    from bokeh.ext import build
    build(ext_dir)

with open(filename, 'rb') as example:
    exec(compile(example.read(), filename, 'exec'))
"""

    cmd = ["python", "-c", code]
    cwd = dirname(example.path)

    env = os.environ.copy()
    env['BOKEH_IGNORE_FILENAME'] = 'true'
    env['BOKEH_RESOURCES'] = 'server-dev'
    env['BOKEH_MINIFIED'] = 'false'
    env['BOKEH_BROWSER'] = 'none'

    class Timeout(Exception):
        pass

    if sys.platform != "win32":
        def alarm_handler(sig: int, frame: FrameType) -> NoReturn:
            raise Timeout

        signal.signal(signal.SIGALRM, alarm_handler)
        signal.alarm(20 if not example.is_slow else 60)

    start = time.time()
    proc = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    status: ProcStatus
    try:
        status = proc.wait()
    except Timeout:
        proc.kill()
        status = 'timeout'
    finally:
        if sys.platform != "win32":
            signal.alarm(0)

    end = time.time()

    assert proc.stdout is not None
    assert proc.stderr is not None

    out = proc.stdout.read().decode("utf-8")
    err = proc.stderr.read().decode("utf-8")

    return (status, end - start, out, err)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
