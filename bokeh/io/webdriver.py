#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import atexit
import signal
import warnings
from os.path import devnull

# External imports

# Bokeh imports
from ..util.dependencies import import_required, detect_phantomjs

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'create_phantomjs_webdriver',
    'terminate_webdriver',
    'webdriver_control',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def create_phantomjs_webdriver():
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", ".*", UserWarning, "selenium.webdriver.phantomjs.webdriver")

        webdriver = import_required('selenium.webdriver',
                                    'To use bokeh.io image export functions you need selenium ' +
                                    '("conda install -c bokeh selenium" or "pip install selenium")')

        phantomjs_path = detect_phantomjs()
        return webdriver.PhantomJS(executable_path=phantomjs_path, service_log_path=devnull)

def terminate_webdriver(driver):
    if driver.name == "phantomjs":
        # https://github.com/seleniumhq/selenium/issues/767
        if driver.service.process:
            driver.service.process.send_signal(signal.SIGTERM)

    try:
        driver.quit()
    except (IOError, OSError): # IOError for Python 2.7
        pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _WebdriverState(object):
    '''

    '''

    def __init__(self, reuse=True, kind="phantomjs"):
        self.reuse = reuse
        self.kind = kind
        self.current = None

    def reset(self):
        if self.current is not None:
            terminate_webdriver(self.current)
            self.current = None

    def get(self):
        if not self.reuse or self.current is None:
            if self.current is not None:
                terminate_webdriver(self.current)
            self.current = self.create()
        return self.current

    def create(self):
        if self.kind == "phantomjs":
            return create_phantomjs_webdriver()
        raise ValueError("Unknown webdriver kind %r" % self.kind)

    @property
    def reuse(self):
        return self._reuse

    @reuse.setter
    def reuse(self, value):
        self._reuse = value

    @property
    def kind(self):
        return self._kind

    @kind.setter
    def kind(self, value):
        # TODO (bev) enum/value check when more are added
        self._kind = value

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------


webdriver_control = _WebdriverState()

atexit.register(lambda: webdriver_control.reset())
