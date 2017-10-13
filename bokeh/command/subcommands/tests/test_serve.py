from __future__ import absolute_import, print_function

import argparse
import contextlib
import re
import socket
import subprocess
import sys

import pytest
import requests

import bokeh.command.subcommands.serve as scserve

from bokeh.resources import DEFAULT_SERVER_PORT



def test_create():
    import argparse
    from bokeh.command.subcommand import Subcommand

    obj = scserve.Serve(parser=argparse.ArgumentParser())
    assert isinstance(obj, Subcommand)

def test_loglevels():
    assert scserve.LOGLEVELS == ('trace', 'debug', 'info', 'warning', 'error', 'critical')

def test_name():
    assert scserve.Serve.name == "serve"

def test_help():
    assert scserve.Serve.help == "Run a Bokeh server hosting one or more applications"

def test_args():
    from bokeh.util.string import nice_join

    assert scserve.Serve.args == (
        ('--port', dict(
            metavar = 'PORT',
            type    = int,
            help    = "Port to listen on",
            default = DEFAULT_SERVER_PORT
        )),

        ('--address', dict(
            metavar = 'ADDRESS',
            type    = str,
            help    = "Address to listen on",
            default = None,
        )),

        ('--log-level', dict(
            metavar = 'LOG-LEVEL',
            action  = 'store',
            default = 'info',
            choices = scserve.LOGLEVELS,
            help    = "One of: %s" % nice_join(scserve.LOGLEVELS),
        )),

        ('--log-format', dict(
            metavar ='LOG-FORMAT',
            action  = 'store',
            default = scserve.DEFAULT_LOG_FORMAT,
            help    = "A standard Python logging format string (default: %r)" % scserve.DEFAULT_LOG_FORMAT.replace("%", "%%"),
        )),

        ('files', dict(
            metavar='DIRECTORY-OR-SCRIPT',
            nargs='*',
            help="The app directories or scripts to serve (serve empty document if not specified)",
            default=None,
        )),

        ('--args', dict(
            metavar='COMMAND-LINE-ARGS',
            nargs=argparse.REMAINDER,
            help="Any command line arguments remaining are passed on to the application handler",
        )),

        ('--show', dict(
            action='store_true',
            help="Open server app(s) in a browser",
        )),

        ('--allow-websocket-origin', dict(
            metavar='HOST[:PORT]',
            action='append',
            type=str,
            help="Public hostnames which may connect to the Bokeh websocket",
        )),

        ('--host', dict(
            metavar='HOST[:PORT]',
            action='append',
            type=str,
            help="*** DEPRECATED ***",
        )),

        ('--prefix', dict(
            metavar='PREFIX',
            type=str,
            help="URL prefix for Bokeh server URLs",
            default=None,
        )),

        ('--keep-alive', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to send a keep-alive ping to clients, 0 to disable.",
            default=None,
        )),

        ('--check-unused-sessions', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to check for unused sessions",
            default=None,
        )),

        ('--unused-session-lifetime', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How long unused sessions last",
            default=None,
        )),

        ('--stats-log-frequency', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to log stats",
            default=None,
        )),

        ('--use-xheaders', dict(
            action='store_true',
            help="Prefer X-headers for IP/protocol information",
        )),

        ('--session-ids', dict(
            metavar='MODE',
            action  = 'store',
            default = None,
            choices = scserve.SESSION_ID_MODES,
            help    = "One of: %s" % nice_join(scserve.SESSION_ID_MODES),
        )),

        ('--disable-index', dict(
            action = 'store_true',
            help    = 'Do not use the default index on the root path',
        )),

        ('--disable-index-redirect', dict(
            action = 'store_true',
            help    = 'Do not redirect to running app from root path',
        )),

        ('--num-procs', dict(
             metavar='N',
             action='store',
             help="Number of worker processes for an app. Default to one. Using "
                  "0 will autodetect number of cores",
             default=1,
             type=int,
         )),
    )


@contextlib.contextmanager
def run_bokeh_serve(args):
    cmd = [sys.executable, "-m", "bokeh", "serve"] + args
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        yield p
    except Exception:
        p.terminate()
        p.wait()
        print("---- An error occurred, subprocess stdout follows ----")
        print(p.stdout.read().decode())
        raise
    else:
        p.terminate()
        p.wait()

def check_error(args):
    cmd = [sys.executable, "-m", "bokeh", "serve"] + args
    try:
        subprocess.check_output(cmd, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        assert e.returncode == 1
        out = e.output.decode()
    else:
        pytest.fail("command %s unexpected successful" % (cmd,))
    return out

def test__fixup_deprecated_host_args():
    from argparse import Namespace

    args = Namespace(host=None, allow_websocket_origin=None)
    scserve._fixup_deprecated_host_args(args)
    assert args.allow_websocket_origin == None

    args = Namespace(host=[], allow_websocket_origin=None)
    scserve._fixup_deprecated_host_args(args)
    assert args.allow_websocket_origin == None

    args = Namespace(host=[], allow_websocket_origin=[])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set([])

    args = Namespace(host=['*'], allow_websocket_origin=[])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*'])

    args = Namespace(host=['*'], allow_websocket_origin=['*'])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*'])

    args = Namespace(host=['*'], allow_websocket_origin=['*', 'foo'])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*', 'foo'])

    args = Namespace(host=[], allow_websocket_origin=['*'])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*'])

    args = Namespace(host=[], allow_websocket_origin=['*', 'foo'])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*', 'foo'])

    args = Namespace(host=None, allow_websocket_origin=['*'])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*'])

    args = Namespace(host=None, allow_websocket_origin=['*', 'foo'])
    scserve._fixup_deprecated_host_args(args)
    assert set(args.allow_websocket_origin) == set(['*', 'foo'])

def test_host_not_available():
    host = "8.8.8.8"
    out = check_error(["--address", host])
    expected = "Cannot start Bokeh server, address %r not available" % host
    assert expected in out

def test_port_not_available():
    sock = socket.socket()
    try:
        sock.bind(('0.0.0.0', 0))
        port = sock.getsockname()[1]
        out = check_error(["--port", str(port)])
        expected = "Cannot start Bokeh server, port %d is already in use" % port
        assert expected in out
    finally:
        sock.close()

def test_actual_port_printed_out():
    with run_bokeh_serve(["--port", "0"]) as p:
        pat = re.compile(r'Bokeh app running at: http://localhost:(\d+)')
        while True:
            line = p.stdout.readline()
            print("child stdout>", line)
            m = pat.search(line.decode())
            if m is not None:
                break
        else:
            pytest.fail("no matching log line in process output")
        port = int(m.group(1))
        assert port > 0
        r = requests.get("http://localhost:%d/" % (port,))
        assert r.status_code == 200
