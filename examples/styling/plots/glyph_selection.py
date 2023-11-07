from bokeh.plotting import figure, show

plot = figure(width=400, height=400, tools="tap", title="Select a circle")
renderer = plot.scatter(
    x=[1, 2, 3, 4, 5],
    y=[2, 5, 8, 2, 7],
    size=50,

    # set visual properties for selected glyphs
    selection_color="firebrick",

    # set visual properties for non-selected glyphs
    nonselection_fill_alpha=0.2,
    nonselection_fill_color="blue",
    nonselection_line_color="firebrick",
    nonselection_line_alpha=1.0,
)

show(plot)
