from bokeh.models import LayoutDOM, Column, Row

class CustomColumn(Column):

    __implementation__ = "custom_col.coffee"

class CustomRow(Row):

    __implementation__ = "custom_row.coffee"
