from bokeh.io import show
from bokeh.models import HelpButton, Tooltip
from bokeh.models.dom import HTML

help_button = HelpButton(tooltip=Tooltip(content=HTML("""
This is a tooltip with additional information.<br />
It can use <b>HTML tags</b> like <a href="https://bokeh.org">links</a>!
"""), position="right"))

show(help_button)
