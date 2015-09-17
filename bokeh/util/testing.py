""" Functions to help with testing Bokeh and reporting issues.
"""
from __future__ import absolute_import, print_function
import mock
import threading
import time
import uuid
import unittest

import requests
from requests.exceptions import ConnectionError

from bokeh.server import start, configure
from bokeh.server.app import bokeh_app, app
from bokeh.server.models import user
from bokeh.server.settings import settings as server_settings


def skipIfPy3(message):
    """ unittest decoractor to skip a test for Python 3

    """
    from unittest import skipIf
    from .platform import is_py3
    return skipIf(is_py3(), message)


def skipIfPyPy(message):
    """ unittest decoractor to skip a test for PyPy

    """
    from unittest import skipIf
    from .platform import is_pypy
    return skipIf(is_pypy(), message)


def print_versions():
    """ Print the versions for Bokeh and the current Python and OS.

    Returns:
        None

    """
    import platform as pt
    from .. import __version__
    message = """
   Bokeh version: %s
  Python version: %s-%s
        Platform: %s
    """ % (__version__, pt.python_version(),
           pt.python_implementation(), pt.platform())
    print(message)


def runtests(args=None):

    """
    Run the Bokeh tests under the bokeh python directory using pytest.

    Does not run tests from bokehjs or examples.

    Args:
        args(list, optional): List of command line arguments accepted by py.test
        e.g. args=['-s', '-k charts'] prevents capture of standard
        out and only runs tests that match charts. For more py.test options see
        http://pytest.org/latest/usage.html#usage.

    Returns:
        int: pytest exitcode
    """

    import pytest
    import os

    try:
        import faulthandler
        faulthandler.enable()
    except ImportError:
        # We can live without in python 2.7
        pass

    # change to the bokeh python source directory, for test collection
    rootdir = os.path.join(os.path.dirname(__file__), os.pardir)
    os.chdir(rootdir)

    return pytest.main(args=args)


#----------------------------
# Bokeh server test utils
#----------------------------

def wait_flask():
    def helper():
        try:
            return requests.get('http://localhost:5006/bokeh/ping')
        except ConnectionError:
            return False
    return wait_until(helper)


def wait_until(func, timeout=1.0, interval=0.01):
    st = time.time()
    while True:
        if func():
            return True
        if (time.time() - st) > timeout:
            return False
        time.sleep(interval)


class BaseBokehServerTestCase(unittest.TestCase):

    options = {}


class MemoryBokehServerTestCase(BaseBokehServerTestCase):
    def setUp(self):
        # clear tornado ioloop instance
        server_settings.reset()
        server_settings.model_backend = {'type': 'memory'}
        for k, v in self.options.items():
            setattr(server_settings, k, v)
        bokeh_app.stdout = None
        bokeh_app.stderr = None
        self.serverthread = threading.Thread(target=start.start_simple_server)
        self.serverthread.start()
        wait_flask()
        # not great - but no good way to wait for zmq to come up
        time.sleep(0.1)
        make_default_user(bokeh_app)

    def tearDown(self):
        start.stop()
        self.serverthread.join()

BokehServerTestCase = MemoryBokehServerTestCase


def make_default_user(bokeh_app):
    bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])
    return bokehuser


class FlaskClientTestCase(BaseBokehServerTestCase):
    def setUp(self):
        server_settings.reset()
        for k, v in self.options.items():
            setattr(server_settings, k, v)
        server_settings.model_backend = {'type': 'memory'}
        configure.configure_flask()
        with mock.patch('bokeh.server.configure.logging'):
            configure.register_blueprint()
        #ugh..need better way to initialize this
        app.secret_key = server_settings.secret_key
        app.debug = True
        self.client = app.test_client()

    def tearDown(self):
        pass

#----------------------
# For testing charts
#----------------------

def create_chart(klass, values, compute_values=True, **kws):
    """ Create a new chart klass instance with values and the extra kws keyword
    parameters.

    Args:
        klass (class): chart class to be created
        values (iterable): chart data series
        compute_values (bool): if == True underlying chart attributes (like data,
                ranges, source, etc..) are computed by calling _setup_show,
                _prepare_show and _show_teardown methods.
        **kws (refer to klass arguments specification details)

    Return:
        _chart: klass chart instance
    """
    _chart = klass(
        values, title="title", xlabel="xlabel", ylabel="ylabel",
        legend="top_left", xscale="linear", yscale="linear",
        width=800, height=600, tools=True,
        filename=False, server=False, notebook=False,
        **kws
    )

    return _chart
