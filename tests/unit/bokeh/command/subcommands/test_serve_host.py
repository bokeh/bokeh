#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""CLI configuration and listener behavior through the ASGI host."""

from __future__ import annotations

# Standard library imports
import argparse
import http.client
import json
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen

# External imports
import pytest
import uvicorn
from websockets.exceptions import ConnectionClosed
from websockets.sync.client import connect

# Bokeh imports
from bokeh.command.subcommands.serve import Serve
from bokeh.protocol import pull_doc_req
from bokeh.util.token import generate_jwt_token, generate_session_id

# Bokeh test imports
from tests.unit.bokeh.command.subcommands.test_serve import running_server


def cli(tmp_path, *options):
    executable = Path(sys.executable).with_name("bokeh.exe" if sys.platform == "win32" else "bokeh")
    return subprocess.run([str(executable), "serve", *options], cwd=tmp_path, capture_output=True, text=True, timeout=30)


@pytest.mark.parametrize(("keep_alive", "interval"), [(None, 37), (0, None), (1500, 1.5)])
def test_cli_configures_host_keepalive_and_message_limit(tmp_path, monkeypatch, keep_alive, interval):
    observed = []
    monkeypatch.setattr(uvicorn.Server, "run", lambda server, **kwargs: observed.append(server.config))
    options = ["--address", "127.0.0.1", "--port", "0", "--websocket-max-message-size", "4096"]
    if keep_alive is not None:
        options += ["--keep-alive", str(keep_alive)]
    configuration = argparse.ArgumentParser()
    command = Serve(configuration)
    command.invoke(configuration.parse_args(options))
    [config] = observed
    assert config.ws_max_size == 4096
    assert config.ws_ping_interval == interval


def test_cli_forwards_script_arguments(tmp_path):
    script = tmp_path / "arguments.py"
    script.write_text("import sys\nfrom bokeh.io import curdoc\ncurdoc().title = '|'.join(sys.argv[1:])\n")
    with running_server(tmp_path, str(script), "--args", "first", "--label=second") as (url, _):
        assert "<title>first|--label=second</title>" in urlopen(url).read().decode()


def test_cli_expands_globs_only_when_requested(tmp_path):
    for name in ("one", "two"):
        (tmp_path / f"sample_{name}.py").write_text(f"from bokeh.io import curdoc\ncurdoc().title = '{name}'\n")
    pattern = "sample_*.py"
    result = cli(tmp_path, pattern)
    assert result.returncode != 0
    assert "does not exist" in result.stderr
    with running_server(tmp_path, "--glob", pattern) as (url, _):
        root = url.rsplit("/", 1)[0]
        index = urlopen(root).read().decode()
        for name in ("one", "two"):
            assert f"sample_{name}" in index
            assert f"<title>{name}</title>" in urlopen(f"{root}/sample_{name}").read().decode()


@pytest.mark.parametrize(("trusted", "expected"), [("127.0.0.1", "203.0.113.10|https"), ("10.0.0.1", "127.0.0.1|http")])
def test_cli_trusts_forwarded_headers_only_from_selected_proxies(tmp_path, trusted, expected):
    script = tmp_path / "proxy.py"
    script.write_text("from bokeh.io import curdoc\nrequest = curdoc().session_context.request\n"
                      "curdoc().title = request.remote_ip + '|' + request.protocol\n")
    with running_server(tmp_path, str(script), "--address", "127.0.0.1", "--use-xheaders",
                        "--forwarded-allow-ips", trusted) as (url, _):
        request = Request(url, headers={"X-Forwarded-For": "203.0.113.10", "X-Forwarded-Proto": "https"})
        assert f"<title>{expected}</title>" in urlopen(request).read().decode()


def test_cli_enforces_websocket_message_limit(tmp_path):
    with running_server(tmp_path, "--websocket-max-message-size", "1024") as (url, _):
        token = generate_jwt_token(generate_session_id())
        with connect(url.rstrip("/").replace("http:", "ws:") + "/ws", subprotocols=["bokeh", token]) as connection:
            assert json.loads(connection.recv(timeout=5))["header"]["msgtype"] == "ACK"
            message = pull_doc_req()
            for fragment, _binary in message.fragments():
                connection.send(fragment)
            assert json.loads(connection.recv(timeout=5))["header"]["msgtype"] == "PULL-DOC-REPLY"
            connection.send("x" * 8192)
            with pytest.raises(ConnectionClosed) as error:
                connection.recv(timeout=5)
            assert error.value.rcvd.code == 1009


def test_cli_serves_tls_with_an_encrypted_private_key(tmp_path, monkeypatch):
    # The locked Python environment provides OpenSSL. Trust only this test's certificate.
    openssl = shutil.which("openssl")
    assert openssl is not None
    cert = tmp_path / "cert.pem"
    key = tmp_path / "key.pem"
    subprocess.run([openssl, "req", "-x509", "-newkey", "rsa:2048", "-passout", "pass:test-password",
                    "-keyout", str(key), "-out", str(cert), "-days", "1", "-subj", "/CN=localhost",
                    "-addext", "subjectAltName=IP:127.0.0.1,DNS:localhost"], check=True, capture_output=True, timeout=30)
    monkeypatch.setenv("BOKEH_SSL_PASSWORD", "test-password")
    context = ssl.create_default_context(cafile=str(cert))
    with running_server(tmp_path, "--address", "127.0.0.1", "--ssl-certfile", str(cert), "--ssl-keyfile", str(key)) as (url, _):
        assert url.startswith("https://")
        with urlopen(url.rstrip("/") + "/embed.json", context=context) as response:
            assert response.status == 200
            assert "token" in json.loads(response.read())


@pytest.mark.parametrize("options", [["--address", "127.0.0.1"], ["--port", "5010"],
                                    ["--ssl-certfile", "cert.pem"], ["--ssl-keyfile", "key.pem"], ["--show"]])
def test_cli_rejects_incompatible_unix_listener_options(tmp_path, options):
    result = cli(tmp_path, "--unix-socket", str(tmp_path / "server.sock"), *options)
    assert result.returncode != 0
    assert ("cannot be combined with --unix-socket" in result.stderr or "requires a TCP listener" in result.stderr)
    assert "Traceback" not in result.stderr


@pytest.mark.skipif(sys.platform == "win32", reason="Requires a Unix-domain listener")
def test_cli_serves_over_unix_socket(tmp_path):
    # Use a short path independently of pytest's potentially long temporary directory.
    with tempfile.TemporaryDirectory(dir="/tmp") as directory:
        path = Path(directory) / "server.sock"
        with running_server(tmp_path, "--unix-socket", str(path)) as (_endpoint, _process):
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
                client.settimeout(5)
                client.connect(str(path))
                client.sendall(b"GET /embed.json HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n")
                response = http.client.HTTPResponse(client)
                response.begin()
                assert response.status == 200
                assert "token" in json.loads(response.read())


def test_cli_reports_unavailable_host(tmp_path):
    result = cli(tmp_path, "--address", "192.0.2.123")
    assert result.returncode != 0
    assert "Could not bind Bokeh server" in result.stderr
    assert "Traceback" not in result.stderr
    assert "CancelledError" not in result.stderr


def test_cli_reports_occupied_port(tmp_path):
    with socket.create_server(("127.0.0.1", 0)) as listener:
        port = listener.getsockname()[1]
        result = cli(tmp_path, "--address", "127.0.0.1", "--port", str(port))
    assert result.returncode != 0
    assert "Could not bind Bokeh server" in result.stderr
    assert "Traceback" not in result.stderr
    assert "CancelledError" not in result.stderr


def test_cli_serves_favicon_from_environment(tmp_path, monkeypatch):
    path = tmp_path / "company.ico"
    content = b"\x00\x00\x01\x00custom-favicon"
    path.write_bytes(content)
    monkeypatch.setenv("BOKEH_ICO_PATH", str(path))
    with running_server(tmp_path, "--prefix", "/tools") as (url, _):
        endpoint = url.rstrip("/") + "/favicon.ico"
        with urlopen(endpoint) as response:
            assert response.headers["Content-Type"] == "image/x-icon"
            assert response.read() == content
        with urlopen(Request(endpoint, method="HEAD")) as response:
            assert response.headers["Content-Length"] == str(len(content))
            assert response.read() == b""


def test_cli_restores_index_favicon_and_diagnostic_flags(tmp_path, monkeypatch):
    icon = tmp_path / "logo.ico"
    icon.write_bytes(b"test-icon")
    template = tmp_path / "index.html"
    template.write_text('<h1>Applications</h1>{% for item in items %}<a href="{{ prefix }}{{ item }}">{{ item }}</a>{% endfor %}')
    (tmp_path / "example.py").write_text("from bokeh.io import curdoc\ncurdoc().title = 'Example'\n")
    monkeypatch.setenv("BOKEH_ICO_PATH", "none")
    with running_server(tmp_path, "example.py", "--prefix", "/tools", "--disable-index-redirect",
                        "--index", str(template), "--ico-path", str(icon), "--stats-log-frequency", "10",
                        "--mem-log-frequency", "10") as (url, _):
        root = url.rsplit("/", 1)[0]
        with urlopen(root + "/") as response:
            assert b'<a href="/tools/example">/example</a>' in response.read()
        with urlopen(root + "/favicon.ico") as response:
            assert response.read() == b"test-icon"


def test_cli_customization_hooks_reach_application_and_host(tmp_path, monkeypatch):
    from bokeh.application import Application

    observed = []
    original = {}

    class CustomServe(Serve):
        def customize_applications(self, args, applications):
            original.update(applications)
            result = super().customize_applications(args, applications)
            result.clear()
            result["/custom"] = Application()
            return result

        def customize_kwargs(self, args, server_kwargs):
            result = super().customize_kwargs(args, server_kwargs)
            result.update(prefix="/customized", port=0, address="127.0.0.1", ws_max_size=12345,
                          stats_log_frequency_milliseconds=123)
            return result

    monkeypatch.setattr("bokeh.server.host.serve", lambda application, **kwargs: observed.append((application, kwargs)))
    configuration = argparse.ArgumentParser()
    command = CustomServe(configuration)
    command.invoke(configuration.parse_args([]))
    [(application, host)] = observed
    assert set(original) == {"/"}
    assert application.core.app_paths == {"/custom"}
    assert application.core.prefix == "/customized"
    assert application.core._stats_log_frequency_milliseconds == 123
    assert host["port"] == 0
    assert host["address"] == "127.0.0.1"
    assert host["ws_max_size"] == 12345
