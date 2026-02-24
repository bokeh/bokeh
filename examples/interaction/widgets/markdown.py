from bokeh.io import show
from bokeh.models import Markdown

md = Markdown(text="""**Bold text** with some *italic text* and `inline code`.""")
show(md)
