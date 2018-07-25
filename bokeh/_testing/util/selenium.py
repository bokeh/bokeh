#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for executing Selenium tests.

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

# External imports
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

INIT = 'Bokeh._testing.init();'

def RECORD(key, value):
    return 'Bokeh._testing.record(%r, %s);' % (key, value)

RESULTS = 'return Bokeh._testing.results'

def SCROLL(amt):
    return """
    var elt = document.getElementsByClassName("bk-canvas-events")[0];
    var event = new WheelEvent('wheel', { deltaY: %f, clientX: 100, clientY: 100} );
    elt.dispatchEvent(event);
    """ % amt

class element_to_start_resizing(object):
    ''' An expectation for checking if an element has started resizing
    '''
    def __init__(self, element):
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver):
        current_width = self.element.size['width']
        if self.previous_width != current_width:
            return True
        else:
            self.previous_width = current_width
            return False

class element_to_finish_resizing(object):
    ''' An expectation for checking if an element has finished resizing

    '''
    def __init__(self, element):
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver):
        current_width = self.element.size['width']
        if self.previous_width == current_width:
            return True
        else:
            self.previous_width = current_width
            return False

def wait_for_canvas_resize(canvas, test_driver):
    '''

    '''
    try:
        wait = WebDriverWait(test_driver, 1)
        wait.until(element_to_start_resizing(canvas))
        wait.until(element_to_finish_resizing(canvas))
    except TimeoutException:
        # Resize may or may not happen instantaneously,
        # Put the waits in to give some time, but allow test to
        # try and process.
        pass

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
