from bokeh.io import show
from bokeh.models import Div

div = Div(
    width=400, height=100, background="#fafafa",
    text=r"The Pythagorean identity is $$\sin^2(x) + \cos^2(x) = 1$$",
)

show(div)
