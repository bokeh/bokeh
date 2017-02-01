from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DataTable,
    IntEditor,
    TableColumn,
)
from selenium.webdriver.common.action_chains import ActionChains
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration


def test_editable_changes_data(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert

    source = ColumnDataSource({'values': [1, 2]})
    source.callback = CustomJS(code='alert(cb_obj.data.values)')
    column = TableColumn(field='values', title='values', editor=IntEditor())
    data_table = DataTable(source=source, columns=[column], editable=True, width=600)

    # Save the plot and start the test
    save(data_table)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Resize the page so that the table displays correctly
    selenium.set_window_size(width=800, height=800)

    # Click row_1 (which triggers first alert)
    row_1_cell = selenium.find_element_by_css_selector('.grid-canvas .bk-slick-row:first-child .r1')
    row_1_cell.click()
    alert = selenium.switch_to_alert()
    assert alert.text == '1,2'
    alert.dismiss()

    # Now double click, enter the text 33
    actions = ActionChains(selenium)
    actions.move_to_element(row_1_cell)
    actions.double_click()
    actions.send_keys(u"33\ue007")  # After the backslash is ENTER key
    actions.perform()

    # Click row_2 (which triggers alert again so we can inspect the data)
    row_2_cell = selenium.find_element_by_css_selector('.grid-canvas .bk-slick-row:nth-child(2) .r1')
    row_2_cell.click()
    alert = selenium.switch_to_alert()
    assert alert.text == '33,2'
