from bokeh.io import save
from bokeh.models import ColumnDataSource, NumberFormatter, StringFormatter
from bokeh.models.widgets import DataTable, TableColumn, HTMLTemplateFormatter

from bokeh.sampledata.periodic_table import elements

elements['name_lower'] = elements['name'].str.lower()
source = ColumnDataSource(elements)

html_font_template = '<font color="<%= CPK %>"><%= value %></font>'
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
                formatter=HTMLTemplateFormatter(template=html_font_template)),
    TableColumn(field='name_lower', title='Image',
                formatter=HTMLTemplateFormatter(template=html_image_template))
]
data_table = DataTable(source=source, columns=columns, editable=False, row_height=45)

save(data_table)
