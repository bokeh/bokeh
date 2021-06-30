#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide tools for executing Selenium tests.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    TYPE_CHECKING,
    Any,
    List,
    Sequence,
    Set,
)

# External imports
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait

if TYPE_CHECKING:
    from selenium.webdriver.common.keys import _KeySeq
    from selenium.webdriver.remote.webdriver import WebDriver
    from selenium.webdriver.remote.webelement import WebElement

# Bokeh imports
from bokeh.models import Button
from bokeh.util.serialization import make_id

if TYPE_CHECKING:
    from bokeh.models.callbacks import Callback

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'alt_click',
    'ButtonWrapper',
    'copy_table_rows',
    'COUNT',
    'drag_range_slider',
    'drag_slider',
    'element_to_finish_resizing',
    'element_to_start_resizing',
    'enter_text_in_cell',
    'enter_text_in_cell_with_click_enter',
    'enter_text_in_element',
    'get_page_element',
    'get_slider_bar_color',
    'get_slider_title_text',
    'get_slider_title_value',
    'get_table_cell',
    'get_table_column_cells',
    'get_table_header',
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

def COUNT(key: str) -> str:
    return 'Bokeh._testing.count(%r);' % key

INIT = 'Bokeh._testing.init();'

def RECORD(key: str, value: Any, *, final: bool = True) -> str:
    if final:
        return 'Bokeh._testing.record(%r, %s);' % (key, value)
    else:
        return 'Bokeh._testing.record0(%r, %s);' % (key, value)

RESULTS = 'return Bokeh._testing.results'

def SCROLL(amt: float) -> str:
    return """
    const elt = document.getElementsByClassName("bk-canvas-events")[0];
    const event = new WheelEvent('wheel', { deltaY: %f, clientX: 100, clientY: 100} );
    elt.dispatchEvent(event);
    """ % amt

def alt_click(driver: WebDriver, element: WebElement) -> None:
    actions = ActionChains(driver)
    actions.key_down(Keys.META)
    actions.click(element)
    actions.key_up(Keys.META)
    actions.perform()


class ButtonWrapper:
    def __init__(self, label: str, callback: Callback) -> None:
        self.ref = "button-" + make_id()
        self.obj = Button(label=label, css_classes=[self.ref])
        self.obj.js_on_event('button_click', callback)

    def click(self, driver: WebDriver) -> None:
        button = driver.find_element_by_css_selector(".%s .bk-btn" % self.ref)
        button.click()

class element_to_start_resizing:
    ''' An expectation for checking if an element has started resizing
    '''

    def __init__(self, element: WebElement) -> None:
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver: WebDriver) -> bool:
        current_width = self.element.size['width']
        if self.previous_width != current_width:
            return True
        else:
            self.previous_width = current_width
            return False

class element_to_finish_resizing:
    ''' An expectation for checking if an element has finished resizing

    '''

    def __init__(self, element: WebElement) -> None:
        self.element = element
        self.previous_width = self.element.size['width']

    def __call__(self, driver: WebDriver) -> bool:
        current_width = self.element.size['width']
        if self.previous_width == current_width:
            return True
        else:
            self.previous_width = current_width
            return False

def select_element_and_press_key(driver: WebDriver, element: WebElement, key: _KeySeq, press_number: int = 1) -> None:
    actions = ActionChains(driver)
    actions.move_to_element(element)
    actions.click()
    for _ in range(press_number):
        actions = ActionChains(driver)
        actions.send_keys_to_element(element, key)
        actions.perform()

def hover_element(driver: WebDriver, element: WebElement) -> None:
    hover = ActionChains(driver).move_to_element(element)
    hover.perform()

def enter_text_in_element(driver: WebDriver, element: WebElement, text: str,
        click: int = 1, enter: bool = True, mod: _KeySeq | None = None) -> None:
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

def enter_text_in_cell(driver: WebDriver, cell: WebElement, text: str) -> None:
    actions = ActionChains(driver)
    actions.move_to_element(cell)
    actions.double_click() # start editing a cell
    actions.click()        # XXX: perhaps sleep() would also work; not required when interacting manually
    actions.double_click() # select all text and overwrite it in the next step
    actions.send_keys(text + Keys.ENTER)
    actions.perform()

def enter_text_in_cell_with_click_enter(driver: WebDriver, cell: WebElement, text: str) -> None:
    actions = ActionChains(driver)
    actions.move_to_element(cell)
    actions.click()
    actions.send_keys(Keys.ENTER + text + Keys.ENTER)
    actions.perform()

def copy_table_rows(driver: WebDriver, rows: Sequence[int]) -> None:
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

def paste_values(driver: WebDriver, el: WebElement | None = None) -> None:
    actions = ActionChains(driver)
    if el:
        actions.move_to_element(el)
    actions.key_down(Keys.SHIFT)
    actions.send_keys(Keys.INSERT)
    actions.key_up(Keys.SHIFT)
    # actions.send_keys(Keys.CONTROL, 'v')
    actions.perform()

def get_table_column_cells(driver: WebDriver, col: int) -> List[str]:
    result = []
    grid = driver.find_element_by_css_selector('.grid-canvas')
    rows = grid.find_elements_by_css_selector(".slick-row")
    for row in rows:
        elt = row.find_element_by_css_selector('.slick-cell.l%d.r%d' % (col, col))
        result.append(elt.text)
    return result

def get_table_row(driver: WebDriver, row: int) -> WebElement:
    return driver.find_element_by_css_selector('.grid-canvas .slick-row:nth-child(%d)' % row)

def get_table_selected_rows(driver: WebDriver) -> Set[int]:
    result = set()
    grid = driver.find_element_by_css_selector('.grid-canvas')
    rows = grid.find_elements_by_css_selector(".slick-row")
    for i, row in enumerate(rows):
        elt = row.find_element_by_css_selector('.slick-cell.l1.r1')
        if 'selected' in elt.get_attribute('class'):
            result.add(i)
    return result

def get_table_cell(driver: WebDriver, row: int, col: int) -> WebElement:
    return driver.find_element_by_css_selector('.grid-canvas .slick-row:nth-child(%d) .r%d' % (row, col))

def get_table_header(driver: WebDriver, col: int) -> WebElement:
    return driver.find_element_by_css_selector('.slick-header-columns .slick-header-column:nth-child(%d)' % col)

def get_page_element(driver: WebDriver, element_selector: str) -> WebElement:
    return driver.find_element_by_css_selector(element_selector)

def shift_click(driver: WebDriver, element: WebElement) -> None:
    actions = ActionChains(driver)
    actions.key_down(Keys.SHIFT)
    actions.click(element)
    actions.key_up(Keys.SHIFT)
    actions.perform()

def sort_table_column(driver: WebDriver, col: int, double: bool = False) -> None:
    elt = driver.find_element_by_css_selector('.slick-header-columns .slick-header-column:nth-child(%d)' % col)
    elt.click()
    if double: elt.click()

def wait_for_canvas_resize(canvas: WebElement, test_driver: WebDriver) -> None:
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

def drag_slider(driver: WebDriver, css_class: str, distance: float, release: bool = True) -> None:
    el = driver.find_element_by_css_selector(css_class)
    handle = el.find_element_by_css_selector('.noUi-handle')
    actions = ActionChains(driver)
    actions.move_to_element(handle)
    actions.click_and_hold()
    actions.move_by_offset(distance, 0)
    if release:
        actions.release()
    actions.perform()

def drag_range_slider(driver: WebDriver, css_class: str, location: str, distance: float) -> None:
    el = driver.find_element_by_css_selector(css_class)
    handle = el.find_element_by_css_selector('.noUi-handle-' + location)
    actions = ActionChains(driver)
    actions.move_to_element(handle)
    actions.click_and_hold()
    actions.move_by_offset(distance, 0)
    actions.release()
    actions.perform()

def get_slider_title_text(driver: WebDriver, css_class: str) -> str:
    el = driver.find_element_by_css_selector(css_class)
    return el.find_element_by_css_selector('div.bk-input-group > div.bk-slider-title').text

def get_slider_title_value(driver: WebDriver, css_class: str) -> str:
    el = driver.find_element_by_css_selector(css_class)
    return el.find_element_by_css_selector('div.bk-input-group > div > span.bk-slider-value').text

def get_slider_bar_color(driver: WebDriver, css_class: str) -> str:
    el = driver.find_element_by_css_selector(css_class)
    bar = el.find_element_by_css_selector('.noUi-connect')
    return bar.value_of_css_property('background-color')

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
