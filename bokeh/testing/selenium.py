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
import pytest

# External imports
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

# Bokeh imports
from bokeh.util.terminal import warn

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

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

def has_no_console_errors(selenium):
    ''' Helper function to detect console errors.

    '''
    logs = selenium.get_log('browser')
    severe_errors = [l for l in logs if l.get('level') == 'SEVERE']
    non_network_errors = [l for l in severe_errors if l.get('type') != 'network']
    if len(non_network_errors) == 0:
        return True
    else:
        pytest.fail('Console errors: %s' % non_network_errors)
    if len(non_network_errors) == 0 and len(severe_errors) != 0:
        warn("There were severe network errors (this may or may not have affected your test): %s" % severe_errors)
    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

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
