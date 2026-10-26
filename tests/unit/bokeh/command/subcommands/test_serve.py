#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import argparse
import contextlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from queue import Empty, Queue
from threading import Thread
from urllib.error import HTTPError
from urllib.request import Request, urlopen

# External imports
import pytest
from websockets.exceptions import InvalidStatus
from websockets.sync.client import connect

# Bokeh imports
from bokeh.command.subcommands.serve import Serve
from bokeh.protocol import pull_doc_req
from bokeh.protocol.receiver import Receiver
from bokeh.server.auth import AuthPolicy, load_auth_policy


def parser():
    result = argparse.ArgumentParser()
    Serve(result)
    return result


@contextlib.contextmanager
def running_server(tmp_path, *options, command="serve"):
    # The child must run without importing Tornado, even if notebook extras
    # happen to have installed it in the development environment.
    (tmp_path / "sitecustomize.py").write_text("""
import sys
class BlockTornado:
    def find_spec(self, fullname, path=None, target=None):
        if fullname == 'tornado' or fullname.startswith('tornado.'):
            raise ImportError('Tornado is unavailable in this test')
sys.meta_path.insert(0, BlockTornado())
""")
    env = dict(os.environ, PYTHONPATH=str(tmp_path) + os.pathsep + os.environ.get("PYTHONPATH", ""))
    env.pop("BOKEH_AUTH_MODULE", None)
    executable = Path(sys.executable).with_name("bokeh.exe" if sys.platform == "win32" else "bokeh")
    port_options = [] if "--unix-socket" in options else ["--port", "0"]
    proc = subprocess.Popen([str(executable), command, *port_options, *options],
                            cwd=tmp_path, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    lines = Queue()
    output = []

    def read():
        for line in proc.stdout:
            output.append(line)
            lines.put(line)
        lines.put(None)

    thread = Thread(target=read, daemon=True)
    thread.start()
    try:
        while True:
            try:
                line = lines.get(timeout=30)
            except Empty:
                pytest.fail("Server startup timed out: " + "".join(output))
            if line is None:
                pytest.fail("Server exited during startup: " + "".join(output))
            match = re.search(r"Bokeh (?:app running at|static assets available at): (https?://[^ ]+)|Bokeh server listening on (\S+)", line)
            if match:
                url = (match.group(1) or match.group(2)).strip()
                yield url, proc
                break
    finally:
        if proc.poll() is None:
            proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
            pytest.fail("Server failed to shut down: " + "".join(output))
        thread.join(timeout=5)
        proc.stdout.close()


@pytest.mark.parametrize("option", ["--num-procs", "--auth-module", "--dev", "--cookie-secret",
                                    "--enable-xsrf-cookies",
                                    "--websocket-compression-level"])
def test_removed_options_are_errors(option):
    with pytest.raises(SystemExit):
        parser().parse_args([option])


def test_load_auth_policy(monkeypatch):
    policy = AuthPolicy(lambda request: "user")
    from types import SimpleNamespace
    monkeypatch.setitem(sys.modules, "test_policy", SimpleNamespace(policy=policy, invalid=object()))
    assert load_auth_policy("test_policy:policy") is policy
    with pytest.raises(TypeError):
        load_auth_policy("test_policy:invalid")
    with pytest.raises(ValueError):
        load_auth_policy("test_policy")
    with pytest.raises(AttributeError):
        load_auth_policy("test_policy:missing")
    with pytest.raises(ModuleNotFoundError):
        load_auth_policy("missing_bokeh_auth_policy:policy")


def test_cli_http_and_websocket_authentication(tmp_path, monkeypatch):
    monkeypatch.setenv("BOKEH_SECRET_KEY", "test-only-session-signing-secret")
    (tmp_path / "auth.py").write_text("""
from bokeh.server.auth import AuthPolicy
policy = AuthPolicy(lambda request: 'user' if request.headers.get('Authorization') == 'Bearer test' else None)
""")
    (tmp_path / "app.py").write_text("from bokeh.io import curdoc\nfrom bokeh.models import Div\ncurdoc().add_root(Div(text='hello'))\n")
    with running_server(tmp_path, "app.py", "--prefix", "/tools", "--auth-policy", "auth:policy",
                        "--session-ids", "signed", "--exclude-headers", "Authorization") as (url, proc):
        headers = {"Authorization": "Bearer test"}
        with pytest.raises(HTTPError) as error:
            urlopen(url, timeout=5)
        assert error.value.code == 401
        with urlopen(Request(url, headers=headers), timeout=5) as response:
            assert response.status == 200
        with urlopen(Request(url + "/embed.json", headers=headers), timeout=5) as response:
            token = json.load(response)["token"]
        origin = url.split("/tools")[0]
        websocket_url = url.replace("http:", "ws:") + "/ws"
        with pytest.raises(InvalidStatus):
            connect(websocket_url, origin=origin, subprotocols=["bokeh", token], open_timeout=5)
        with pytest.raises(InvalidStatus):
            connect(websocket_url, origin="http://untrusted.example", subprotocols=["bokeh", token],
                    additional_headers=headers, open_timeout=5)
        with connect(websocket_url, origin=origin.replace("127.0.0.1", "localhost"), subprotocols=["bokeh", token],
                     additional_headers=headers, open_timeout=5) as socket:
            assert json.loads(socket.recv(timeout=5))["header"]["msgtype"] == "ACK"
            for fragment, binary in pull_doc_req().fragments():
                socket.send(fragment)
            receiver = Receiver()
            reply = None
            while reply is None:
                reply = receiver.consume(socket.recv(timeout=5))
            assert reply.msgtype == "PULL-DOC-REPLY"
        assert proc.poll() is None


def test_cli_script_directory_and_static_assets(tmp_path):
    app = tmp_path / "app"
    app.mkdir()
    (app / "static").mkdir()
    (app / "static" / "sample.txt").write_text("asset")
    (app / "main.py").write_text("from bokeh.io import curdoc\ncurdoc().title = 'Directory app'\n")
    with running_server(tmp_path, "app", "--disable-index-redirect") as (url, proc):
        with urlopen(url, timeout=5) as response:
            assert b"Directory app" in response.read()
        with urlopen(url + "/static/sample.txt", timeout=5) as response:
            assert response.read() == b"asset"
        root = url.rsplit("/", 1)[0]
        with urlopen(root + "/", timeout=5) as response:
            assert b"Bokeh applications" in response.read()
        assert proc.poll() is None


def test_cli_rejects_notebook(tmp_path):
    notebook = tmp_path / "app.ipynb"
    notebook.write_text("{}")
    args = parser().parse_args([str(notebook)])
    with pytest.raises(SystemExit):
        Serve(argparse.ArgumentParser()).invoke(args)


def test_cli_policy_import_failure_stops_startup(tmp_path):
    proc = subprocess.run([sys.executable, "-m", "bokeh", "serve", "--auth-policy", "missing_policy:policy"],
                          cwd=tmp_path, capture_output=True, text=True, timeout=15)
    assert proc.returncode != 0
    assert "missing_policy" in proc.stderr


def test_static_command_without_tornado(tmp_path):
    with running_server(tmp_path, command="static") as (url, proc):
        with urlopen(url + "js/bokeh.js", timeout=5) as response:
            assert response.status == 200
            assert b"Bokeh" in response.read()
        with pytest.raises(HTTPError) as error:
            urlopen(url.replace("/static/", "/"), timeout=5)
        assert error.value.code == 404
        assert proc.poll() is None


@pytest.mark.parametrize("variable", ["BOKEH_AUTH_MODULE", "BOKEH_COOKIE_SECRET", "BOKEH_XSRF_COOKIES"])
def test_retired_auth_settings_are_not_silently_ignored(monkeypatch, variable):
    monkeypatch.setenv(variable, "configured")
    args = parser().parse_args([])
    with pytest.raises(SystemExit):
        Serve(argparse.ArgumentParser()).invoke(args)


def test_console_imports_policy_from_working_directory(tmp_path):
    (tmp_path / "auth.py").write_text("from bokeh.server.auth import AuthPolicy\npolicy = AuthPolicy(lambda request: 'user')\n")
    executable = Path(sys.executable).with_name("bokeh.exe" if sys.platform == "win32" else "bokeh")
    env = dict(os.environ)
    env.pop("PYTHONPATH", None)
    proc = subprocess.run([str(executable), "serve", "--auth-policy", "auth:policy", "--keep-alive", "-1"],
                          cwd=tmp_path, env=env, capture_output=True, text=True, timeout=15)
    assert proc.returncode != 0
    assert "--keep-alive must be >= 0" in proc.stderr


def test_explicit_address_is_preserved_in_advertised_url(tmp_path):
    with running_server(tmp_path, '--address', '127.0.0.1') as (url, _proc):
        assert url.startswith('http://127.0.0.1:')
        with urlopen(url + 'embed.json', timeout=5) as response:
            token = json.load(response)['token']
        for origin in (url.rstrip('/'), url.replace('127.0.0.1', 'localhost').rstrip('/')):
            with connect(url.replace('http:', 'ws:') + 'ws', origin=origin,
                         subprotocols=['bokeh', token], open_timeout=5) as socket:
                assert json.loads(socket.recv(timeout=5))['header']['msgtype'] == 'ACK'


@pytest.mark.skipif(sys.platform == "win32", reason="POSIX signal handling")
def test_cli_exits_cleanly_on_sigterm(tmp_path):
    (tmp_path / "main.py").write_text("pass\n")
    (tmp_path / "app_hooks.py").write_text(
        "from pathlib import Path\n\n"
        "def on_server_unloaded(context):\n"
        "    Path(__file__).with_name('stopped').write_text('done')\n",
    )
    with running_server(tmp_path, str(tmp_path)) as (_url, proc):
        proc.terminate()
        # Uvicorn re-raises SIGTERM after awaiting application shutdown.
        assert proc.wait(timeout=10) == -15
        assert (tmp_path / "stopped").read_text() == "done"


@pytest.mark.skipif(sys.platform == "win32", reason="Unix sockets")
def test_long_unix_socket_path_fails_without_starting_lifespan(tmp_path):
    executable = Path(sys.executable).with_name("bokeh")
    path = str(tmp_path / ("x" * 200))
    proc = subprocess.run([str(executable), "serve", "--unix-socket", path],
                          capture_output=True, text=True, timeout=15)
    assert proc.returncode != 0
    assert "CancelledError" not in proc.stderr
    assert "Traceback" not in proc.stderr
