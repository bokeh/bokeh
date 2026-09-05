#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from os.path import (
    abspath,
    basename,
    dirname,
    join,
)
from typing import Any, Literal
from urllib.parse import urlparse

# External imports
import _pytest.config
import _pytest.mark
import _pytest.python
from playwright.sync_api import (  # type: ignore[attr-defined]
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)

# Bokeh imports
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
from tests.support.util.examples import Example, Flags, collect_examples

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.bokeh_server",
)

BASE_DIR = abspath(dirname(dirname(__file__)))

_examples: list[Example] | None = None

_browser_args = [
    "--font-render-hinting=none",
    "--disable-font-subpixel-positioning",
    "--force-color-profile=srgb",
    "--force-device-scale-factor=1",
]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def get_all_examples(config: _pytest.config.Config) -> list[Example]:
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

        def marks(example: Example) -> list[_pytest.mark.MarkDecorator]:
            result: list[_pytest.mark.MarkDecorator] = []
            if example.is_skip:
                result.append(pytest.mark.skip(reason=f"skipping {example.relpath}"))
            if example.min_python is not None:
                result.append(
                    pytest.mark.skipif(
                        sys.version_info[:2] < example.min_python,
                        reason=f"skipping {example.relpath}; requires Python {example.min_python} or above",
                    ),
                )
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

@pytest.fixture(scope="session")
def examples_browser() -> Iterator[Any]:
    manager = sync_playwright().start()
    try:
        browser = manager.chromium.launch(args=_browser_args)
        context = browser.new_context(  # type: ignore[attr-defined]
            device_scale_factor=1,
            viewport={"width": 2000, "height": 4000},
        )
        page = context.new_page()
        try:
            yield page
        finally:
            page.close()
            context.close()
            browser.close()
    finally:
        manager.stop()

def test_file_examples(
    file_example: Example,
    example: Example,
    report: list[Example],
    config: _pytest.config.Config,
    bokeh_server: str,
    request: pytest.FixtureRequest,
) -> None:
    if config.option.verbose:
        print()
    (status, duration, out, err) = _run_example(example, bokeh_server)
    info(f"Example run in {white(f'{duration:.3f}s')}")

    for line in out.split("\n"):
        if len(line) == 0 or line.startswith("Wrote "):
            continue
        info(line, label="PY")

    for line in err.split("\n"):
        if len(line) == 0:
            continue
        warn(line, label="PY")

    assert status != "timeout", f"{example.relpath} timed out"
    assert status == 0, f"{example.relpath} failed to run (exit code {status})"

    if example.no_js:
        if not config.option.no_js:
            warn(f"skipping bokehjs for {example.relpath}")
    else:
        examples_browser = request.getfixturevalue("examples_browser")
        _run_in_browser(example, f"file://{example.path_no_ext}.html", report, examples_browser, config.option.verbose)

def test_server_examples(
    server_example: Example,
    example: Example,
    report: list[Example],
    config: _pytest.config.Config,
    bokeh_server: str,
    request: pytest.FixtureRequest,
) -> None:
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
    # Playwright's synchronous driver owns the current thread's asyncio loop.
    # Push from a worker thread so Tornado can run its own loop there.
    with ThreadPoolExecutor(max_workers=1) as executor:
        executor.submit(push_session, doc, session_id=session_id, url=bokeh_server).result()

    if example.no_js:
        if not config.option.no_js:
            warn(f"skipping bokehjs for {example.relpath}")
    else:
        examples_browser = request.getfixturevalue("examples_browser")
        _run_in_browser(example, f"{bokeh_server}/?bokeh-session-id={session_id}", report, examples_browser, config.option.verbose)

type BrowserError = tuple[str | None, str]

def _stack_url(stack: str) -> str | None:
    for frame in stack.splitlines()[1:]:
        location = frame.strip().removeprefix("at ").rstrip(")")
        if "(" in location:
            location = location.rsplit("(", maxsplit=1)[1]
        try:
            url, line, col = location.rsplit(":", maxsplit=2)
        except ValueError:
            continue
        if line.isdigit() and col.isdigit() and urlparse(url).scheme:
            return url
    return None

def _print_browser_output(messages: list[Any], errors: list[BrowserError]) -> None:
    for message in messages:
        location = message.location
        url = location["url"]
        line = location["lineNumber"] + 1
        col = location["columnNumber"] + 1

        msg = f"{{{message.type}}} {url}:{line}:{col} {message.text}"
        info(msg, label="JS")

    for url, text in errors:
        if url is not None:
            fail(f"@{url}", label="JS")
        for line in text.split("\n"):
            fail(line, label="JS")

def _run_in_browser(example: Example, url: str, report: list[Example], page: Any, verbose: bool = False) -> None:
    messages: list[Any] = []
    errors: list[BrowserError] = []

    def on_page_error(error: Any) -> None:
        stack = error.stack or str(error)
        errors.append((_stack_url(stack), stack))

    def on_console(message: Any) -> None:
        messages.append(message)

    def on_request_failed(request: Any) -> None:
        if request.resource_type in ("script", "stylesheet"):
            errors.append((request.url, request.failure or "Failed to load resource"))

    def on_response(response: Any) -> None:
        if not response.ok and response.request.resource_type in ("script", "stylesheet"):
            errors.append((response.url, f"Failed to load resource: {response.status} {response.status_text}"))

    page.on("console", on_console)
    page.on("pageerror", on_page_error)
    page.on("requestfailed", on_request_failed)
    page.on("response", on_response)

    start = time.time()
    try:
        page.goto(url, wait_until="load")
        success = page.evaluate("typeof Bokeh !== 'undefined'")
        timeout = False

        if success:
            try:
                page.wait_for_function(
                    """Bokeh.documents.length > 0 &&
                        Bokeh.documents.every((doc) => doc.is_idle) &&
                        Bokeh.index.roots.some((view) => {
                            const {width, height} = view.el.getBoundingClientRect()
                            return width > 0 && height > 0
                        })""",
                    timeout=15_000,
                )
            except PlaywrightTimeoutError:
                timeout = True

        image = _screenshot(page)
    finally:
        page.remove_listener("console", on_console)
        page.remove_listener("pageerror", on_page_error)
        page.remove_listener("requestfailed", on_request_failed)
        page.remove_listener("response", on_response)

    info(f"Example rendered in {(time.time()-start):.3f} seconds")
    example.store_img(image)
    report.append(example)

    if timeout:
        warn(f"{red('TIMEOUT:')} bokehjs did not finish")

    if verbose:
        _print_browser_output(messages, errors)

    assert success, f"{example.relpath} failed to load"
    assert not errors, f"{example.relpath} failed with {len(errors)} errors"

def _screenshot(page: Any) -> bytes:
    clip = page.evaluate("""() => {
        const style = getComputedStyle(document.body)
        const bounds = Bokeh.index.roots.map((view) => view.el.getBoundingClientRect())
        const right = Math.ceil(Math.max(0, ...bounds.map((bbox) => bbox.right)))
        const bottom = Math.ceil(Math.max(0, ...bounds.map((bbox) => bbox.bottom)))
        return {
            x: 0,
            y: 0,
            width: Math.max(1, Math.ceil(right + parseFloat(style.marginRight || 0))),
            height: Math.max(1, Math.ceil(bottom + parseFloat(style.marginBottom || 0))),
        }
    }""")
    return page.screenshot(clip=clip, type="png")

type ProcStatus = int | Literal["timeout"]

_EXAMPLE_TIMEOUT = 20
_SLOW_EXAMPLE_TIMEOUT = 60
_PACKAGE_EXAMPLE_TIMEOUT = 180
_PROCESS_CLEANUP_TIMEOUT = 5

def _example_timeout(example: Example) -> int:
    if any(os.path.isfile(join(ext_dir, "package.json")) for ext_dir in example.extensions):
        return _PACKAGE_EXAMPLE_TIMEOUT
    return _SLOW_EXAMPLE_TIMEOUT if example.is_slow else _EXAMPLE_TIMEOUT

def _kill_process(proc: subprocess.Popen[bytes]) -> None:
    if proc.poll() is None:
        try:
            proc.kill()
        except OSError:
            pass

def _terminate_process_tree(proc: subprocess.Popen[bytes]) -> None:
    if sys.platform == "win32":
        try:
            result = subprocess.run(
                ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=_PROCESS_CLEANUP_TIMEOUT,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired):
            _kill_process(proc)
        else:
            if result.returncode != 0:
                _kill_process(proc)
    else:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except OSError:
            _kill_process(proc)

def _close_process(proc: subprocess.Popen[bytes]) -> None:
    _kill_process(proc)

    for stream in (proc.stdout, proc.stderr):
        if stream is not None:
            try:
                stream.close()
            except OSError:
                pass

    try:
        proc.wait(timeout=_PROCESS_CLEANUP_TIMEOUT)
    except subprocess.TimeoutExpired:
        pass

def _decode_output(output: bytes | str | None) -> str:
    if output is None:
        return ""
    if isinstance(output, bytes):
        return output.decode("utf-8")
    return output

def _run_process(cmd: list[str], cwd: str, env: dict[str, str], timeout: float) -> tuple[ProcStatus, float, str, str]:
    start = time.monotonic()
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=sys.platform != "win32",
    )

    status: ProcStatus
    out: bytes | str | None
    err: bytes | str | None
    try:
        out, err = proc.communicate(timeout=timeout)
        assert proc.returncode is not None
        status = proc.returncode
    except subprocess.TimeoutExpired:
        status = "timeout"
        _terminate_process_tree(proc)
        try:
            out, err = proc.communicate(timeout=_PROCESS_CLEANUP_TIMEOUT)
        except subprocess.TimeoutExpired as error:
            out, err = error.output, error.stderr
            _close_process(proc)

    duration = time.monotonic() - start
    return status, duration, _decode_output(out), _decode_output(err)

def _run_example(example: Example, bokeh_server: str) -> tuple[ProcStatus, float, str, str]:
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
    if not build(ext_dir):
        raise RuntimeError("failed to build extension '" + ext_dir + "'")

with open(filename, 'rb') as example:
    exec(compile(example.read(), filename, 'exec'))
"""

    cmd = [sys.executable, "-c", code]
    cwd = dirname(example.path)

    env = os.environ.copy()
    env['BOKEH_IGNORE_FILENAME'] = 'true'
    env['BOKEH_RESOURCES'] = 'server-dev'
    env['BOKEH_BROWSER'] = 'none'
    port = urlparse(bokeh_server).port
    assert port is not None
    env['BOKEH_DEFAULT_SERVER_PORT'] = str(port)

    return _run_process(cmd, cwd, env, _example_timeout(example))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
