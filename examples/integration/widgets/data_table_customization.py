from bokeh.io import save
from bokeh.models import (ColumnDataSource, DataTable, HTMLTemplateFormatter,
                          NumberFormatter, StringFormatter, TableColumn)
from bokeh.sampledata.periodic_table import elements

def get_text_color(hex_color):
    """Get text color with high contrast v.s. the background color."""
    r, g, b = int(hex_color[1:3], 16), int(hex_color[3:5], 16), int(hex_color[5:7], 16)
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return '#000000' if luminance > 0.5 else '#ffffff'

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
