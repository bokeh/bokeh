from bokeh.io import show
from bokeh.models import Div

div = Div(
    text="Foo $$\cos(x)$$ <b>bar</b>",
    width=200,
    height=100,
    background="grey",
)

show(div)
