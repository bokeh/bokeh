from bokeh.colors import RGB
from bokeh.io import save
from bokeh.models import (ColumnDataSource, DataTable, HTMLTemplateFormatter,
                          NumberFormatter, StringFormatter, TableColumn)
from bokeh.sampledata.periodic_table import elements


def get_text_color(hex_color):
    """Get a text color with high contrast v.s. the background color."""
    return '#000000' if RGB.from_hex_string(hex_color).luminance > 0.4 else '#ffffff'

elements['name_lower'] = elements['name'].str.lower()
elements['text_color'] = elements['CPK'].apply(get_text_color)

source = ColumnDataSource(elements)

html_image_template = """
<a href="http://images-of-elements.com/<%= value %>.php" target="_blank">
  <img src="http://images-of-elements.com/<%= value %>.jpg" style="width:40px;height:40px;border:0">
</a>
"""

columns = [
    TableColumn(field='atomic number', title='Atomic Number',
                formatter=NumberFormatter(text_align="right")),
    TableColumn(field='symbol', title='Symbol',
                formatter=StringFormatter(text_align="center")),
    TableColumn(field='name', title='Name',
                formatter=StringFormatter(background_color="CPK", text_color="text_color")),
    TableColumn(field='name_lower', title='Image',
                formatter=HTMLTemplateFormatter(template=html_image_template)),
]
data_table = DataTable(source=source, columns=columns, editable=False, row_height=45)

save(data_table)
