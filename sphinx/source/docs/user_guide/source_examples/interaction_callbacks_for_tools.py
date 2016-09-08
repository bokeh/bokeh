from bokeh.models import CustomJS, ColumnDataSource, BoxSelectTool, Range1d, Rect
from bokeh.plotting import figure, output_file, show

output_file("boxselecttool_callback.html")

source = ColumnDataSource(data=dict(x=[], y=[], width=[], height=[]))

callback = CustomJS(args=dict(source=source), code="""
        // get data source from Callback args
        var data = source.data;

        /// get BoxSelectTool dimensions from cb_data parameter of Callback
        var geometry = cb_data['geometry'];

        /// calculate Rect attributes
        var width = geometry['x1'] - geometry['x0'];
        var height = geometry['y1'] - geometry['y0'];
        var x = geometry['x0'] + width/2;
        var y = geometry['y0'] + height/2;

        /// update data source with new Rect attributes
        data['x'].push(x);
        data['y'].push(y);
        data['width'].push(width);
        data['height'].push(height);

        // trigger update of data source
        source.trigger('change');
    """)

box_select = BoxSelectTool(callback=callback)

p = figure(plot_width=400,
           plot_height=400,
           tools=[box_select],
           title="Select Below",
           x_range=Range1d(start=0.0, end=1.0),
           y_range=Range1d(start=0.0, end=1.0))

rect = Rect(x='x',
            y='y',
            width='width',
            height='height',
            fill_alpha=0.3,
            fill_color='#009933')

p.add_glyph(source, rect, selection_glyph=rect, nonselection_glyph=rect)
show(p)
