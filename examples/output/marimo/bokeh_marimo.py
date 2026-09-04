import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    # Temporary for the Bokeh 4.0 proof of concept: marimo's released Bokeh
    # formatter still calls APIs removed in Bokeh 4.0. This disables only that
    # formatter so marimo can use Bokeh's AnyWidget representation instead.
    from marimo._output.formatters.formatters import THIRD_PARTY_FACTORIES

    THIRD_PARTY_FACTORIES["bokeh"].register = lambda: None
    return


@app.cell
def _():
    import marimo as mo
    from bokeh.io import show
    from bokeh.models import HoverTool
    from bokeh.plotting import figure
    from bokeh.settings import settings

    # A development wheel has no matching public CDN release yet.
    settings.resources.set_value("inline")
    return HoverTool, figure, mo, show


@app.cell
def _(mo):
    value = mo.ui.slider(1, 10, value=4, label="Live point count")
    value
    return (value,)


@app.cell
def _(HoverTool, figure):
    plot = figure(width=650, height=320, title="Connected AnyWidget view")
    full_data = {
        "x": list(range(1, 11)),
        "y": [2, 5, 3, 7, 6, 8, 4, 9, 5, 7],
    }
    source = plot.scatter(
        x=full_data["x"],
        y=full_data["y"],
        size=14,
        color="#1f77b4",
    ).data_source
    source.name = "marimo-live-source"
    hover = HoverTool(tooltips=[("x", "@x"), ("y", "@y")])
    plot.add_tools(hover)
    return full_data, plot, source


@app.cell
def _(plot, show):
    handle = show(plot)
    return (handle,)


@app.cell
def _(full_data, handle, plot, source, value):
    count = value.value
    with handle:
        source.data = {key: values[:count] for key, values in full_data.items()}
        plot.title.text = f"Connected AnyWidget view — {count} points"
    return


@app.cell
def _(figure):
    snapshot = figure(width=650, height=260, title="Automatic static final expression")
    snapshot.line([1, 2, 3, 4, 5], [2, 5, 3, 7, 6], line_width=3, color="#ff7f0e")
    snapshot
    return


if __name__ == "__main__":
    app.run()
