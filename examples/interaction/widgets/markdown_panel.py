from bokeh.io import show
from bokeh.models import MarkdownPanel

md = MarkdownPanel(text="""**Bold text** with some *italic text* and `inline code`.""")
show(md)
