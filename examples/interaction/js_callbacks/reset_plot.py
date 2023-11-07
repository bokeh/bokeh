from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Button, CustomJS, Div
from bokeh.plotting import figure

div = Div(text="Pan or zoom the plot, then click on <b>Reset plot</b> button.")

p = figure(width=400, height=400, active_scroll="wheel_zoom")
p.scatter(
    x=[1, 2, 3, 4, 5],
    y=[2, 5, 8, 2, 7],
    color=["navy", "orange", "olive", "firebrick", "gold"],
    size=20,
)

reset = Button(label="Reset plot")
reset.js_on_click(CustomJS(args=dict(plot=p), code="""
export default ({plot}, _button, _data, {index}) => {
    console.log(`Resetting ${plot}`)
    const plot_view = index.get_one(plot)
    plot_view.reset()
}
"""))

show(column(div, reset, p))
