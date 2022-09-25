from bokeh.io import save
from bokeh.models.dom import Div, Styles
from bokeh.plotting import figure

p0 = figure(width=200, height=200)
p1 = figure(width=200, height=200)
p2 = figure(width=200, height=200)
p3 = figure(width=200, height=200)

p0.rect(x=0, y=0, width=1, height=1, fill_color="red")
p1.rect(x=0, y=0, width=1, height=1, fill_color="green")
p2.rect(x=0, y=0, width=1, height=1, fill_color="blue")
p3.rect(x=0, y=0, width=1, height=1, fill_color="yellow")

style = Styles(
    width="800px",
    height="600px",
    display="grid",
    grid_template_columns="auto auto",
    gap="10px",
    resize="both",
    overflow="scroll",
)
grid = Div(style=style)

box = lambda p: Div(style=Styles(border="black 1px dashed"), children=[p])
grid.children = [box(p0), box(p1), box(p2), box(p3)]

save(grid)
