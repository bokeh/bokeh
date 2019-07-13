#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

# Bokeh imports
from bokeh.models import Button
from bokeh.util.serialization import make_id

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'alt_click',
    'ButtonWrapper',
    'copy_table_rows',
    'COUNT',
    'element_to_finish_resizing',
    'element_to_start_resizing',
    'enter_text_in_cell',
    'enter_text_in_cell_with_click_enter',
    'enter_text_in_element',
    'get_page_element',
    'get_table_cell',
    'get_table_column_cells',
    'get_table_row',
    'get_table_selected_rows',
    'hover_element',
    'INIT',
    'paste_values',
    'RECORD',
    'RESULTS',
    'SCROLL',
    'select_element_and_press_key',
    'shift_click',
    'sort_table_column',
    'wait_for_canvas_resize',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def COUNT(key):
    return 'Bokeh._testing.count(%r);' % key

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

def alt_click(driver, element):
    actions = ActionChains(driver)
    actions.key_down(Keys.META)
    actions.click(element)
    actions.key_up(Keys.META)
    actions.perform()

class ButtonWrapper(object):

    def __init__(self, label, callback):
        self.ref = "button-" + make_id()
        self.obj = Button(label=label, css_classes=[self.ref])
        self.obj.js_on_event('button_click', callback)

    def click(self, driver):
        button = driver.find_element_by_css_selector(".%s .bk-btn" % self.ref)
        button.click()

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

def select_element_and_press_key(driver, element, key, press_number=1):
    actions = ActionChains(driver)
    actions.send_keys_to_element(element, key * press_number)
    actions.perform()

def hover_element(driver, element):
    hover = ActionChains(driver).move_to_element(element)
    hover.perform()

def enter_text_in_element(driver, element, text, click=1, enter=True, mod=None):
    actions = ActionChains(driver)
    actions.move_to_element(element)
    if click == 1: actions.click()
    elif click == 2: actions.double_click()
    if enter:
        text += Keys.ENTER
    if mod:
        actions.key_down(mod)
    actions.send_keys(text)
    if mod:
        actions.key_up(mod)
    actions.perform()

def enter_text_in_cell(driver, cell, text):
    actions = ActionChains(driver)
    actions.move_to_element(cell)
    actions.double_click()
    actions.send_keys(text + Keys.ENTER)
    actions.perform()

def enter_text_in_cell_with_click_enter(driver, cell, text):
    actions = ActionChains(driver)
    actions.move_to_element(cell)
    actions.click()
    actions.send_keys(Keys.ENTER + text + Keys.ENTER)
    actions.perform()

def copy_table_rows(driver, rows):
    actions = ActionChains(driver)
    row = get_table_row(driver, rows[0])
    actions.move_to_element(row)
    actions.click()
    actions.key_down(Keys.SHIFT)
    for r in rows[1:]:
        row = get_table_row(driver, r)
        actions.move_to_element(row)
        actions.click()
    actions.key_up(Keys.SHIFT)
    actions.key_down(Keys.CONTROL)
    actions.send_keys(Keys.INSERT)
    actions.key_up(Keys.CONTROL)
    # actions.send_keys(Keys.CONTROL, 'c')
    actions.perform()

def paste_values(driver, el=None):
    actions = ActionChains(driver)
    if el:
        actions.move_to_element(el)
    actions.key_down(Keys.SHIFT)
    actions.send_keys(Keys.INSERT)
    actions.key_up(Keys.SHIFT)
    # actions.send_keys(Keys.CONTROL, 'v')
    actions.perform()

def get_table_column_cells(driver, col):
    result = []
    grid = driver.find_element_by_css_selector('.grid-canvas')
    rows = grid.find_elements_by_css_selector(".slick-row")
    for i, row in enumerate(rows):
        elt = row.find_element_by_css_selector('.slick-cell.l%d.r%d' % (col, col))
        result.append(elt.text)
    return result

def get_table_row(driver, row):
    return driver.find_element_by_css_selector('.grid-canvas .slick-row:nth-child(%d)' % row)

def get_table_selected_rows(driver):
    result = set()
    grid = driver.find_element_by_css_selector('.grid-canvas')
    rows = grid.find_elements_by_css_selector(".slick-row")
    for i, row in enumerate(rows):
        elt = row.find_element_by_css_selector('.slick-cell.l1.r1')
        if 'selected' in elt.get_attribute('class'):
            result.add(i)
    return result

def get_table_cell(driver, row, col):
    return driver.find_element_by_css_selector('.grid-canvas .slick-row:nth-child(%d) .r%d' % (row, col))

def get_page_element(driver, element_selector):
    return driver.find_element_by_css_selector(element_selector)

def shift_click(driver, element):
    actions = ActionChains(driver)
    actions.key_down(Keys.SHIFT)
    actions.click(element)
    actions.key_up(Keys.SHIFT)
    actions.perform()

def sort_table_column(driver, col, double=False):
    elt = driver.find_element_by_css_selector('.slick-header-columns .slick-header-column:nth-child(%d)' % col)
    elt.click()
    if double: elt.click()

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
