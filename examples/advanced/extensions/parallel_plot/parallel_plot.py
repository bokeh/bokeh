import numpy as np

from bokeh.layouts import column
from bokeh.models import (BasicTickFormatter, ColumnDataSource,
                          CustomJSTickFormatter, Div, FixedTicker,
                          LinearAxis, LinearColorMapper, MultiLine, Range1d)
from bokeh.plotting import figure
from bokeh.sampledata.autompg import autompg_clean as df

from parallel_reset import ParallelResetTool
from parallel_selection_tool import ParallelSelectionTool


def parallel_plot(df, color=None, palette=None):
    """From a dataframe create a parallel coordinate plot
    """
    npts = df.shape[0]
    ndims = len(df.columns)

    if color is None:
        color = np.ones(npts)
    if palette is None:
        palette = ['#ff0000']

    cmap = LinearColorMapper(high=color.min(),
                             low=color.max(),
                             palette=palette)

    data_source = ColumnDataSource(dict(
        xs=np.arange(ndims)[None, :].repeat(npts, axis=0).tolist(),
        ys=np.array((df-df.min())/(df.max()-df.min())).tolist(),
        color=color))

    p = figure(x_range=(-1, ndims),
               y_range=(0, 1),
               width=1000,
               tools="pan, box_zoom")

    # Create x axis ticks from columns contained in dataframe
    fixed_x_ticks = FixedTicker(
        ticks=np.arange(ndims), minor_ticks=[])
    formatter_x_ticks = CustomJSTickFormatter(
        code="return columns[index]", args={"columns": df.columns})
    p.xaxis.ticker = fixed_x_ticks
    p.xaxis.formatter = formatter_x_ticks

    p.yaxis.visible = False
    p.y_range.start = 0
    p.y_range.end = 1
    p.y_range.bounds = (-0.1, 1.1) # add a little padding around y axis
    p.xgrid.visible = False
    p.ygrid.visible = False

    # Create extra y axis for each dataframe column
    tickformatter = BasicTickFormatter(precision=1)
    for index, col in enumerate(df.columns):
        start = df[col].min()
        end = df[col].max()
        bound_min = start + abs(end-start) * (p.y_range.bounds[0] - p.y_range.start)
        bound_max = end + abs(end-start) * (p.y_range.bounds[1] - p.y_range.end)
        p.extra_y_ranges.update(
            {col: Range1d(start=bound_min, end=bound_max, bounds=(bound_min, bound_max))})

        fixedticks = FixedTicker(
            ticks=np.linspace(start, end, 8), minor_ticks=[])

        p.add_layout(LinearAxis(fixed_location=index, y_range_name=col,
                                ticker=fixedticks, formatter=tickformatter), 'right')

    # create the data renderer ( MultiLine )
    # specify selected and non selected style
    non_selected_line_style = dict(line_color='grey', line_width=0.1, line_alpha=0.5)

    selected_line_style = dict(line_color={'field': 'color', 'transform': cmap}, line_width=1)

    parallel_renderer = p.multi_line(
        xs="xs", ys="ys", source=data_source, **non_selected_line_style)

    # Specify selection style
    selected_lines = MultiLine(**selected_line_style)

    # Specify non selection style
    nonselected_lines = MultiLine(**non_selected_line_style)

    parallel_renderer.selection_glyph = selected_lines
    parallel_renderer.nonselection_glyph = nonselected_lines
    p.y_range.start = p.y_range.bounds[0]
    p.y_range.end = p.y_range.bounds[1]

    rect_source = ColumnDataSource({
        'x': [], 'y': [], 'width': [], 'height': [],
    })

    # add rectangle selections
    selection_renderer = p.rect(x='x', y='y', width='width', height='height',
                                source=rect_source,
                                fill_alpha=0.7, fill_color='#009933')
    selection_tool = ParallelSelectionTool(
        renderer_select=selection_renderer, renderer_data=parallel_renderer,
        box_width=10)
    # custom resets (reset only axes not selections)
    reset_axes = ParallelResetTool()

    # add tools and activate selection ones
    p.add_tools(selection_tool, reset_axes)
    p.toolbar.active_drag = selection_tool
    return p

if __name__ == '__main__':
    from bokeh.io import show
    from bokeh.palettes import Viridis256
    del df['origin']
    del df['mfr']
    del df['name']
    p = parallel_plot(df=df, color=df[df.columns[0]], palette=Viridis256)
    div = Div(text="Select up and down column grid lines to define filters. Double click a filter to reset it.")
    show(column(div, p))
