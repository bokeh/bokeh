#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import argparse
import contextlib
import os.path
import re
import socket
import subprocess
import sys
import time
from os.path import join, split
from queue import Empty, Queue
from threading import Thread

# External imports
import requests
import requests_unixsocket
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.env import envset
from bokeh.command.subcommand import Argument
from bokeh.resources import DEFAULT_SERVER_PORT

# Module under test
import bokeh.command.subcommands.serve as bcss  # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

HERE = os.path.abspath(os.path.dirname(__file__))
APPS = os.path.join(HERE, 'apps', '*.py')

PORT_PAT = re.compile(r'Bokeh app running at: http://localhost:(\d+)')

# http://eyalarubas.com/python-subproc-nonblock.html
class NBSR:
    def __init__(self, stream) -> None:
        '''
        stream: the stream to read from.
                Usually a process' stdout or stderr.
        '''

        self._s = stream
        self._q = Queue()

        def _populateQueue(stream, queue):
            '''
            Collect lines from 'stream' and put them in 'queue'.
            '''

            while True:
                line = stream.readline()
                if line:
                    queue.put(line)
                else:
                    break

        self._t = Thread(target = _populateQueue,
                args = (self._s, self._q))
        self._t.daemon = True
        self._t.start() #start collecting lines from the stream

    def readline(self, timeout = None):
        try:
            return self._q.get(block = timeout is not None,
                    timeout = timeout)
        except Empty:
            return None

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class TestServe:
    def test_create(self) -> None:
        from bokeh.command.subcommand import Subcommand
        obj = bcss.Serve(parser=argparse.ArgumentParser())
        assert isinstance(obj, Subcommand)

    def test_default_customize_applications_is_identity(self):
        obj = bcss.Serve(parser=argparse.ArgumentParser())
        apps = {}
        result = obj.customize_applications(argparse.Namespace(), apps)
        assert result == apps
        assert result is not apps

    def test_default_customize_kwargs_is_identity(self):
        obj = bcss.Serve(parser=argparse.ArgumentParser())
        kws = {}
        result = obj.customize_kwargs(argparse.Namespace(), kws)
        assert result == kws
        assert result is not kws

def test_loglevels() -> None:
    assert bcss.LOGLEVELS == ('trace', 'debug', 'info', 'warning', 'error', 'critical')

def test_name() -> None:
    assert bcss.Serve.name == "serve"

def test_help() -> None:
    assert bcss.Serve.help == "Run a Bokeh server hosting one or more applications"

def test_args() -> None:
    from bokeh.util.string import nice_join

    assert bcss.Serve.args == (
        ('--port', Argument(
            metavar = 'PORT',
            type    = int,
            help    = "Port to listen on",
            default = DEFAULT_SERVER_PORT
        )),

        ('--address', Argument(
            metavar = 'ADDRESS',
            type    = str,
            help    = "Address to listen on",
            default = None,
        )),

        ('--unix-socket', Argument(
            metavar = 'UNIX-SOCKET',
            type    = str,
            help    = "Unix socket to bind. Network options such as port, address, ssl options are incompatible with unix socket",
            default = None,
        )),

        ('--log-level', Argument(
            metavar = 'LOG-LEVEL',
            action  = 'store',
            default = None,
            choices = bcss.LOGLEVELS + ("None", ),
            help    = f"One of: {nice_join(bcss.LOGLEVELS)}",
        )),

        ('--log-format', Argument(
            metavar ='LOG-FORMAT',
            action  = 'store',
            default = bcss.DEFAULT_LOG_FORMAT,
            help    = f"A standard Python logging format string (default: {bcss.DEFAULT_LOG_FORMAT!r})".replace("%", "%%"),
        )),

        ('--log-file', Argument(
            metavar ='LOG-FILE',
            action  = 'store',
            default = None,
            help    = "A filename to write logs to, or None to write to the standard stream (default: None)",
        )),

        ('--use-config', Argument(
            metavar = 'CONFIG',
            type    = str,
            help    = "Use a YAML config file for settings",
            default = None,
        )),

        ('files', Argument(
            metavar = 'DIRECTORY-OR-SCRIPT',
            nargs   = '*',
            help    = "The app directories or scripts to serve (serve empty document if not specified)",
            default = None,
        )),

        ('--args', Argument(
            metavar = 'COMMAND-LINE-ARGS',
            nargs   = argparse.REMAINDER,
            help    = "Command line arguments remaining to passed on to the application handler. "
                      "NOTE: if this argument precedes DIRECTORY-OR-SCRIPT then some other argument, e.g. "
                      "--show, must be placed before the directory or script. ",
        )),

        ('--dev', Argument(
            metavar ='FILES-TO-WATCH',
            action  ='store',
            default = None,
            type    = str,
            nargs   = '*',
            help    = "Enable live reloading during app development. "
                      "By default it watches all *.py *.html *.css *.yaml files "
                      "in the app directory tree. Additional files can be passed "
                      "as arguments. "
                      "NOTE: if this argument precedes DIRECTORY-OR-SCRIPT then some other argument, e.g "
                      "--show, must be placed before the directory or script. "
                      "NOTE: This setting only works with a single app. "
                      "It also restricts the number of processes to 1. "
                      "NOTE FOR WINDOWS USERS : this option must be invoked using "
                      "'python -m bokeh'. If not Tornado will fail to restart the "
                      "server",
        )),

        ('--show', Argument(
            action = 'store_true',
            help   = "Open server app(s) in a browser",
        )),

        ('--allow-websocket-origin', Argument(
            metavar = 'HOST[:PORT]',
            action  = 'append',
            type    = str,
            help    = "Public hostnames which may connect to the Bokeh websocket "
                      "With unix socket, the websocket origin restrictions should be enforced by the proxy.",
        )),

        ('--prefix', Argument(
            metavar = 'PREFIX',
            type    = str,
            help    = "URL prefix for Bokeh server URLs",
            default = None,
        )),

        ('--ico-path', Argument(
            metavar = "ICO_PATH",
            type    = str,
            help    = "Path to a .ico file to use as the favicon.ico, or 'none' to "
                      "disable favicon.ico support. If unset, a default Bokeh .ico "
                      "file will be used",
            default = None,
        )),

        ('--keep-alive', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to send a keep-alive ping to clients, 0 to disable.",
            default = None,
        )),

        ('--check-unused-sessions', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to check for unused sessions",
            default = None,
        )),

        ('--unused-session-lifetime', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How long unused sessions last",
            default = None,
        )),

        ('--stats-log-frequency', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to log stats",
            default = None,
        )),

        ('--mem-log-frequency', Argument(
            metavar = 'MILLISECONDS',
            type    = int,
            help    = "How often to log memory usage information",
            default = None,
        )),

        ('--use-xheaders', Argument(
            action = 'store_true',
            help   = "Prefer X-headers for IP/protocol information",
        )),

        ('--ssl-certfile', Argument(
            metavar = 'CERTFILE',
            action  = 'store',
            default = None,
            help    = 'Absolute path to a certificate file for SSL termination',
        )),

        ('--ssl-keyfile', Argument(
            metavar = 'KEYFILE',
            action  = 'store',
            default = None,
            help    = 'Absolute path to a private key file for SSL termination',
        )),

        ('--session-ids', Argument(
            metavar = 'MODE',
            action  = 'store',
            default = None,
            choices = bcss.SESSION_ID_MODES,
            help    = f"One of: {nice_join(bcss.SESSION_ID_MODES)}",
        )),

        ('--auth-module', Argument(
            metavar = 'AUTH_MODULE',
            action  = 'store',
            default = None,
            help    = 'Absolute path to a Python module that implements auth hooks',
        )),

        ('--enable-xsrf-cookies', Argument(
            action  = 'store_true',
            default = False,
            help    = 'Whether to enable Tornado support for XSRF cookies. All '
                      'PUT, POST, or DELETE handlers must be properly instrumented '
                      'when this setting is enabled.'
        )),

        ('--exclude-headers', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request headers to exclude from the session '
                      'context (by default all headers are included).'
        )),

        ('--exclude-cookies', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request cookies to exclude from the session '
                      'context (by default all cookies are included).'
        )),

        ('--include-headers', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request headers to make available in the session '
                      'context (by default all headers are included).'
        )),

        ('--include-cookies', Argument(
            action  = 'store',
            default = None,
            nargs='+',
            help    = 'A list of request cookies to make available in the session '
                      'context (by default all cookies are included).'
        )),

        ('--cookie-secret', Argument(
            metavar = 'COOKIE_SECRET',
            action  = 'store',
            default = None,
            help    = 'Configure to enable getting/setting secure cookies',
        )),

        ('--index', Argument(
            metavar = 'INDEX',
            action  = 'store',
            default = None,
            help    = 'Path to a template to use for the site index',
        )),

        ('--disable-index', Argument(
            action = 'store_true',
            help   = 'Do not use the default index on the root path',
        )),

        ('--disable-index-redirect', Argument(
            action = 'store_true',
            help   = 'Do not redirect to running app from root path',
        )),

        ('--num-procs', Argument(
             metavar = 'N',
             action  = 'store',
             help    = "Number of worker processes for an app. Using "
                       "0 will autodetect number of cores (defaults to 1)",
             default = 1,
             type    =int,
         )),

        ('--session-token-expiration', Argument(
            metavar = 'N',
            action  = 'store',
            help    = "Duration in seconds that a new session token "
                      "is valid for session creation. After the expiry "
                      "time has elapsed, the token will not be able "
                      "create a new session (defaults to  seconds).",
            default = 300,
            type    = int,
        )),

         ('--websocket-max-message-size', Argument(
            metavar = 'BYTES',
            action  = 'store',
            help    = "Set the Tornado websocket_max_message_size value "
                      "(default: 20MB)",
            default = 20*1024*1024,
            type    = int,
        )),

        ('--websocket-compression-level', Argument(
            metavar = 'LEVEL',
            action  = 'store',
            help    = "Set the Tornado WebSocket compression_level",
            default = None,
            type    = int,
        )),

        ('--websocket-compression-mem-level', Argument(
            metavar = 'LEVEL',
            action  = 'store',
            help    = "Set the Tornado WebSocket compression mem_level",
            default = None,
            type    = int,
        )),

        ('--glob', Argument(
            action='store_true',
            help='Process all filename arguments as globs',
        )),
    )

@contextlib.contextmanager
def run_bokeh_serve(args):
    cmd = [sys.executable, "-m", "bokeh", "serve"] + args
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=False)
    nbsr = NBSR(p.stdout)
    try:
        yield p, nbsr
    except Exception as e:
        p.terminate()
        p.wait()
        print("An error occurred: %s", e)
        try:
            out = p.stdout.read().decode()
            print("\n---- subprocess stdout follows ----\n")
            print(out)
        except Exception:
            pass
        raise
    else:
        p.terminate()
        p.wait()

def assert_pattern(nbsr, pat):
    m = None
    for i in range(20):
        o = nbsr.readline(0.5)
        if not o:
            continue
        m = pat.search(o.decode())
        if m is not None:
            break
    if m is None:
        pytest.fail("Did not find pattern in process output")

def check_port(nbsr):
    m = None
    for i in range(20):
        o = nbsr.readline(0.5)
        if not o:
            continue
        m = PORT_PAT.search(o.decode())
        if m is not None:
            break
    if m is None:
        pytest.fail("Did not find port in process output")
    return int(m.group(1))

def check_error(args):
    cmd = [sys.executable, "-m", "bokeh", "serve"] + args
    try:
        subprocess.check_output(cmd, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        assert e.returncode == 1
        out = e.output.decode()
    else:
        pytest.fail(f"command {cmd} unexpected successful")
    return out

@pytest.mark.skipif(sys.platform != "win32", reason="Unix sockets not available on windows")
def test_unix_socket_on_windows() -> None:
    unix_socket = "test.sock"
    out = check_error(["--unix-socket", unix_socket]).strip()
    expected = "ERROR: Unix sockets are not supported on windows."
    assert expected in out

def test_unix_socket_with_port() -> None:
    unix_socket = "test.sock"
    out = check_error(["--unix-socket", unix_socket, "--port", "5000"]).strip()
    expected = "--port arg is not supported with a unix socket"
    assert expected == out

def test_unix_socket_with_invalid_args() -> None:
    invalid_args = ['address', 'allow-websocket-origin', 'ssl-certfile', 'ssl-keyfile']
    for arg in invalid_args:
        unix_socket = "test.sock"
        out = check_error(["--unix-socket", unix_socket, f"--{arg}", "value"]).strip()
        expected = "['address', 'allow_websocket_origin', 'ssl_certfile', 'ssl_keyfile', 'port'] args are not supported with a unix socket"
        assert expected == out

@flaky(max_runs=10)
@pytest.mark.skipif(sys.platform == "win32", reason="Unix sockets not available on windows")
def test_unix_socket() -> None:
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    file_name = "test.socket"

    if os.path.exists(file_name):
        os.remove(file_name)

    sock.bind(file_name)
    with run_bokeh_serve(["--unix-socket", file_name, "--glob", APPS]) as (p, nbsr):
        # The server is not ready is binds to the unix socket
        # very quickly, having some sleep helps
        with requests_unixsocket.monkeypatch():
            for t in range(1, 11):
                time.sleep(1)
                try:
                    r = requests.get(f"http+unix://{file_name.replace('/', '%2F')}/line_on_off")
                    assert r.status_code == 200
                    break
                except:
                    if t == 10:
                        assert False
                    pass
    os.remove(file_name)

def test_host_not_available() -> None:
    host = "8.8.8.8"
    out = check_error(["--address", host])
    expected = f"Cannot start Bokeh server, address {host!r} not available"
    assert expected in out

def test_port_not_available() -> None:
    sock = socket.socket()
    try:
        sock.bind(('0.0.0.0', 0))
        port = sock.getsockname()[1]
        out = check_error(["--port", str(port)])
        expected = f"Cannot start Bokeh server, port {port} is already in use"
        assert expected in out
    finally:
        sock.close()

def test_no_glob_by_default_on_filename_if_wildcard_in_quotes() -> None:
    out = check_error([APPS])
    expected = "ERROR: Path for Bokeh server application does not exist:"
    assert expected in out
    assert '*' in out

def test_glob_flag_on_filename_if_wildcard_in_quotes() -> None:
    pat = re.compile(r'Bokeh app running at: http://localhost:(\d+)/line_on_off')
    with run_bokeh_serve(["--port", "0", "--glob", APPS]) as (p, nbsr):
        port = check_port(nbsr)
        assert port > 0
        assert_pattern(nbsr, pat)
        r = requests.get(f"http://localhost:{port}/apply_theme")
        assert r.status_code == 200

def test_actual_port_printed_out() -> None:
    with run_bokeh_serve(["--port", "0"]) as (p, nbsr):
        port = check_port(nbsr)
        assert port > 0
        r = requests.get(f"http://localhost:{port}/")
        assert r.status_code == 200

def test_websocket_max_message_size_printed_out() -> None:
    pat = re.compile(r'Torndado websocket_max_message_size set to 12345')
    with run_bokeh_serve(["--websocket-max-message-size", "12345"]) as (p, nbsr):
        assert_pattern(nbsr, pat)

class TestXSRF:

    def test_printed_option(self) -> None:
        pat = re.compile(r'XSRF cookie protection enabled')
        with run_bokeh_serve(["--enable-xsrf-cookies"]) as (p, nbsr):
            assert_pattern(nbsr, pat)

    def test_printed_envar(self) -> None:
        pat = re.compile(r'XSRF cookie protection enabled')
        with envset(BOKEH_XSRF_COOKIES="yes"):
            with run_bokeh_serve(["--enable-xsrf-cookies"]) as (p, nbsr):
                assert_pattern(nbsr, pat)

def test_auth_module_printed() -> None:
    pat = re.compile(r'User authentication hooks provided \(no default user\)')
    with run_bokeh_serve(["--auth-module", join(split(__file__)[0], "_dummy_auth.py")]) as (p, nbsr):
        assert_pattern(nbsr, pat)

class TestIco:
    def test_default(self) -> None:
        with run_bokeh_serve(["--port", "0", "--glob", APPS]) as (p, nbsr):
            port = check_port(nbsr)
            assert port > 0
            r = requests.get(f"http://localhost:{port}/favicon.ico")
            assert r.status_code == 200
            assert r.headers["content-type"] == "image/x-icon"

    def test_explicit_option(self) -> None:
        with run_bokeh_serve(["--port", "0", "--ico-path", join(HERE, "favicon-dev.ico"), "--glob", APPS]) as (p, nbsr):
            port = check_port(nbsr)
            assert port > 0
            r = requests.get(f"http://localhost:{port}/favicon.ico")
            assert r.status_code == 200
            assert r.headers["content-type"] == "image/x-icon"
            assert r.content == open(join(HERE, "favicon-dev.ico"), "rb").read()

    def test_explicit_envvar(self) -> None:
        with envset(BOKEH_ICO_PATH=join(HERE, "favicon-dev.ico")):
            with run_bokeh_serve(["--port", "0", "--glob", APPS]) as (p, nbsr):
                port = check_port(nbsr)
                assert port > 0
                r = requests.get(f"http://localhost:{port}/favicon.ico")
                assert r.status_code == 200
                assert r.headers["content-type"] == "image/x-icon"
                assert r.content == open( join(HERE, "favicon-dev.ico"), "rb").read()

    def test_none_option(self) -> None:
        with run_bokeh_serve(["--port", "0", "--ico-path", "none", "--glob", APPS]) as (p, nbsr):
            port = check_port(nbsr)
            assert port > 0
            r = requests.get(f"http://localhost:{port}/favicon.ico")
            assert r.status_code == 404

    def test_none_envvar(self) -> None:
        with envset(BOKEH_ICO_PATH="none"):
            with run_bokeh_serve(["--port", "0", "--glob", APPS]) as (p, nbsr):
                port = check_port(nbsr)
                assert port > 0
                r = requests.get(f"http://localhost:{port}/favicon.ico")
                assert r.status_code == 404



#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
