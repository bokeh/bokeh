from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import ColumnDataSource, DataTable, TableColumn
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

@pytest.mark.screenshot
def test_data_table_preselection_python(output_file_url, selenium, screenshot):

    data = dict(x = list(range(10)))
    selected = { '0d': {'glyph': None, 'indices': []},
             '1d': {'indices': [1, 2]},
             '2d': {'indices': {}}}
    source = ColumnDataSource(data=data, selected=selected)

    columns = [TableColumn(field="x", title="X")]

    data_table = DataTable(source=source, columns=columns)

    # Save the table and start the test
    save(data_table)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    screenshot.assert_is_valid()
