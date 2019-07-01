#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import argparse
import contextlib
import re
import socket
import subprocess
import sys
from time import sleep

# External imports
import requests
import six

# Bokeh imports
import bokeh.command.subcommands.serve as scserve

from bokeh.resources import DEFAULT_SERVER_PORT

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

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

        ('--log-file', dict(
            metavar ='LOG-FILE',
            action  = 'store',
            default = None,
            help    = "A filename to write logs to, or None to write to the standard stream (default: None)",
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
            help="Command line arguments remaining to passed on to the application handler. "
                 "NOTE: if this argument precedes DIRECTORY-OR-SCRIPT then some other argument, e.g "
                 "--show, must be placed before the directory or script. ",
        )),

        ('--dev', dict(
            metavar ='FILES-TO-WATCH',
            action  ='store',
            default = None,
            type    = str,
            nargs   = '*',
            help    = "Enable live reloading during app development. "
                      "By default it watches all *.py *.html *.css *.yaml files "
                      "in the app directory tree. Additional files can be passed "
                      "as arguments."
                      "NOTE: if this argument precedes DIRECTORY-OR-SCRIPT then some other argument, e.g "
                      "--show, must be placed before the directory or script. "
                      "NOTE: This setting only works with a single app. "
                      "It also restricts the number of processes to 1. "
                      "NOTE FOR WINDOWS USERS : this option must be invoked using "
                      "'python -m bokeh'. If not Tornado will fail to restart the "
                      "server",
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

        ('--mem-log-frequency', dict(
            metavar='MILLISECONDS',
            type=int,
            help="How often to log memory usage information",
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

        ('--index', dict(
            metavar='INDEX',
            action  = 'store',
            default = None,
            help    = 'Path to a template to use for the site index',
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
             help="Number of worker processes for an app. Using "
                  "0 will autodetect number of cores (defaults to 1)",
             default=1,
             type=int,
         )),

         ('--websocket-max-message-size', dict(
            metavar='BYTES',
            action='store',
            help="Set the Tornado websocket_max_message_size value (defaults "
                 "to 20MB) NOTE: This setting has effect ONLY for Tornado>=4.5",
            default=20*1024*1024,
            type=int,
        )),
    )


@contextlib.contextmanager
def run_bokeh_serve(args):
    cmd = [sys.executable, "-m", "bokeh", "serve"] + args
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        yield p
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

def test_host_not_available():
    host = str("8.8.8.8") # str cast is for Python 2.7 testing
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

@pytest.mark.skipif(six.PY2, reason="Travis bug causes bad file descriptor")
def test_actual_port_printed_out():
    from fcntl import fcntl, F_GETFL, F_SETFL
    from os import O_NONBLOCK, read
    pat = re.compile(r'Bokeh app running at: http://localhost:(\d+)')
    m = None
    with run_bokeh_serve(["--port", "0"]) as p:
        flags = fcntl(p.stdout, F_GETFL)
        fcntl(p.stdout, F_SETFL, flags | O_NONBLOCK)
        sleep(2)
        o = read(p.stdout.fileno(), 100*1024)
        m = pat.search(o.decode())
        if m is None:
            pytest.fail("no matching log line in process output")
        port = int(m.group(1))
        assert port > 0
        r = requests.get("http://localhost:%d/" % (port,))
        assert r.status_code == 200

@pytest.mark.skipif(six.PY2, reason="Travis bug causes bad file descriptor")
def test_websocket_max_message_size_printed_out():
    pat = re.compile(r'Torndado websocket_max_message_size set to 12345')
    with run_bokeh_serve(["--websocket-max-message-size", "12345"]) as p:
        sleep(2)
    o, e = p.communicate()
    m = pat.search(o.decode())
    if m is None:
        pytest.fail("no matching log line in process output")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
