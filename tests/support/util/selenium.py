#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any, Sequence

# External imports
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

if TYPE_CHECKING:
    from selenium.webdriver.common.keys import _KeySeq
    from selenium.webdriver.remote.webdriver import WebDriver
    from selenium.webdriver.remote.webelement import WebElement

# Bokeh imports
from bokeh.models import Button

if TYPE_CHECKING:
    from bokeh.model import Model
    from bokeh.models.callbacks import Callback
    from bokeh.models.plots import Plot
    from bokeh.models.widgets import Slider
    from bokeh.models.widgets.tables import DataTable

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
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

MATCHES_SCRIPT = """
    function* descend(el, sel, parent) {
        if (el.matches(sel)) {
            yield parent ? el.parentElement : el
        }
        if (el.shadowRoot) {
            for (const child of el.shadowRoot.children) {
                yield* descend(child, sel, parent)
            }
        }
        for (const child of el.children) {
            yield* descend(child, sel, parent)
        }
    }

    const selector = arguments[0]
    const root = arguments[1] ?? document.documentElement
    const parent = arguments[2] ?? false

    return [...descend(root, selector, parent)]
"""

def find_matching_elements(driver: WebDriver, selector: str, *, root: WebElement | None = None, parent: bool = False) -> list[WebElement]:
    return driver.execute_script(MATCHES_SCRIPT, selector, root, parent)

def find_matching_element(driver: WebDriver, selector: str, *, root: WebElement | None = None, parent: bool = False) -> WebElement:
    elements = find_matching_elements(driver, selector, root=root, parent=parent)
    n = len(elements)
    if n == 0:
        raise ValueError("not found")
    else:
        return elements[0]
    #elif n == 1:
    #    return elements[0]
    #else:
    #    raise ValueError("multiple elements found")

FIND_VIEW_SCRIPT = """
    function* find(views, id, fn) {
        for (const view of views) {
            if (view.model.id == id) {
                yield* fn(view)
            } else if ("child_views" in view) {
                yield* find(view.child_views, id, fn)
            } else if ("tool_views" in view) {
                yield* find(view.tool_views.values(), id, fn)
            } else if ("renderer_views" in view) {
                yield* find(view.renderer_views.values(), id, fn)
            }
        }
    }

    function head(iter) {
        for (const item of iter) {
            return item
        }
        return undefined
    }

    function views() {
        return Object.values(Bokeh.index)
    }
"""

def get_events_el(driver: WebDriver, model: Plot) -> WebElement:
    script = FIND_VIEW_SCRIPT + """
    const id = arguments[0]
    function* fn(view) {
        yield view.canvas_view.events_el
    }
    return head(find(views(), id, fn)) ?? null
    """
    el = driver.execute_script(script, model.id)
    if el is not None:
        return el
    else:
        raise RuntimeError(f"can't resolve a view for {model}")

def get_toolbar_el(driver: WebDriver, model: Plot) -> WebElement:
    script = FIND_VIEW_SCRIPT + """
    const id = arguments[0]
    const {ToolbarPanelView} = Bokeh.require("models/annotations/toolbar_panel")
    function* fn(view) {
        for (const rv of view.renderer_views.values()) {
            if (rv instanceof ToolbarPanelView) {
                yield rv._toolbar_view.el
                break
            }
        }
    }
    return head(find(views(), id, fn)) ?? null
    """
    el = driver.execute_script(script, model.id)
    if el is not None:
        return el
    else:
        raise RuntimeError(f"can't resolve a view for {model}")


FIND_SCRIPT = """
    const id = arguments[0]
    const selector = arguments[1]

    function* find(views) {
        for (const view of views) {
            if (view.model.id == id) {
                if (selector != null) {
                    const el = view.shadow_el ?? view.el
                    yield [...el.querySelectorAll(selector)]
                } else
                    yield [view.el]
            } else if ("child_views" in view) {
                yield* find(view.child_views)
            } else if ("tool_views" in view) {
                yield* find(view.tool_views.values())
            } else if ("renderer_views" in view) {
                yield* find(view.renderer_views.values())
            }
        }
    }
"""

def find_elements_for(driver: WebDriver, model: Model, selector: str | None = None) -> list[WebElement]:
    script = FIND_SCRIPT + """
    for (const els of find(Object.values(Bokeh.index))) {
        return els
    }
    return null
    """
    return driver.execute_script(script, model.id, selector)

def find_element_for(driver: WebDriver, model: Model, selector: str | None = None) -> WebElement:
    script = FIND_SCRIPT + """
    for (const els of find(Object.values(Bokeh.index))) {
        return els[0] ?? null
    }
    return null
    """
    el = driver.execute_script(script, model.id, selector)
    if el is not None:
        return el
    else:
        raise ValueError("not found")

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
    const elt = Object.values(Bokeh.index)[0].canvas_view.events_el;
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
        self.obj = Button(label=label)
        self.obj.js_on_event('button_click', callback)

    def click(self, driver: WebDriver) -> None:
        button = find_element_for(driver, self.obj, ".bk-btn")
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

def enter_text_in_cell(driver: WebDriver, table: DataTable, row: int, col: int, text: str) -> None:
    actions = ActionChains(driver)
    cell = get_table_cell(driver, table, row, col)
    actions.move_to_element(cell)
    actions.double_click() # start editing a cell
    actions.perform()

    actions = ActionChains(driver)
    cell = get_table_cell(driver, table, row, col)
    try:
        input = find_matching_element(driver, "input", root=cell)
    except ValueError:
        return # table.editable == False
    actions.move_to_element(input)
    actions.click()        # XXX: perhaps sleep() would also work; not required when interacting manually
    actions.double_click() # select all text and overwrite it in the next step
    actions.send_keys(text + Keys.ENTER)
    actions.perform()

def escape_cell(driver: WebDriver, table: DataTable, row: int, col: int) -> None:
    cell = get_table_cell(driver, table, row, col)
    try:
        input = find_matching_element(driver, "input", root=cell)
    except ValueError:
        return

    actions = ActionChains(driver)
    actions.move_to_element(input)
    actions.send_keys(Keys.ESCAPE)
    actions.perform()

def enter_text_in_cell_with_click_enter(driver: WebDriver, table: DataTable, row: int, col: int, text: str) -> None:
    actions = ActionChains(driver)
    cell = get_table_cell(driver, table, row, col)
    actions.move_to_element(cell)
    actions.click()
    actions.send_keys(Keys.ENTER + text + Keys.ENTER)
    actions.perform()

def enter_text_with_click_enter(driver: WebDriver, cell: WebElement, text: str) -> None:
    actions = ActionChains(driver)
    actions.move_to_element(cell)
    actions.click()
    actions.send_keys(Keys.ENTER + text + Keys.ENTER)
    actions.perform()

def copy_table_rows(driver: WebDriver, table: DataTable, rows: Sequence[int]) -> None:
    actions = ActionChains(driver)
    row = get_table_row(driver, table, rows[0])
    actions.move_to_element(row)
    actions.click()
    actions.key_down(Keys.SHIFT)
    for r in rows[1:]:
        row = get_table_row(driver, table, r)
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

def get_table_column_cells(driver: WebDriver, table: DataTable, col: int) -> list[str]:
    result = []
    rows = find_elements_for(driver, table, ".slick-row")
    for row in rows:
        elt = row.find_element(By.CSS_SELECTOR, '.slick-cell.l%d.r%d' % (col, col))
        result.append(elt.text)
    return result

def get_table_row(driver: WebDriver, table: DataTable, row: int) -> WebElement:
    return find_element_for(driver, table, f".slick-row:nth-child({row})")

def get_table_selected_rows(driver: WebDriver, table: DataTable) -> set[int]:
    result = set()
    rows = find_elements_for(driver, table, ".slick-row")
    for i, row in enumerate(rows):
        elt = row.find_element(By.CSS_SELECTOR, '.slick-cell.l1.r1')
        if 'selected' in elt.get_attribute('class'):
            result.add(i)
    return result

def get_table_cell(driver: WebDriver, table: DataTable, row: int, col: int) -> WebElement:
    return find_element_for(driver, table, f".slick-row:nth-child({row}) .r{col}")

def get_table_header(driver: WebDriver, table: DataTable, col: int) -> WebElement:
    return find_element_for(driver, table, f".slick-header-columns .slick-header-column:nth-child({col})")

def sort_table_column(driver: WebDriver, table: DataTable, col: int, double: bool = False) -> None:
    elt = find_element_for(driver, table, f".slick-header-columns .slick-header-column:nth-child({col})")
    elt.click()
    if double: elt.click()

def shift_click(driver: WebDriver, element: WebElement) -> None:
    actions = ActionChains(driver)
    actions.key_down(Keys.SHIFT)
    actions.click(element)
    actions.key_up(Keys.SHIFT)
    actions.perform()

def drag_slider(driver: WebDriver, slider: Slider, distance: float, release: bool = True) -> None:
    handle = find_element_for(driver, slider, ".noUi-handle")
    actions = ActionChains(driver)
    actions.move_to_element(handle)
    actions.click_and_hold()
    actions.move_by_offset(distance, 0)
    if release:
        actions.release()
    actions.perform()

def drag_range_slider(driver: WebDriver, slider: Slider, location: str, distance: float) -> None:
    handle = find_element_for(driver, slider, f".noUi-handle-{location}")
    actions = ActionChains(driver)
    actions.move_to_element(handle)
    actions.click_and_hold()
    actions.move_by_offset(distance, 0)
    actions.release()
    actions.perform()

def get_slider_title_text(driver: WebDriver, slider: Slider) -> str:
    return find_element_for(driver, slider, "div.bk-input-group > div.bk-slider-title").text

def get_slider_title_value(driver: WebDriver, slider: Slider) -> str:
    return find_element_for(driver, slider, "div.bk-input-group > div > span.bk-slider-value").text

def get_slider_bar_color(driver: WebDriver, slider: Slider) -> str:
    bar_el = find_element_for(driver, slider, ".noUi-connect")
    return bar_el.value_of_css_property("background-color")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
