import plt = Bokeh.Plotting;

console.log(`Bokeh ${Bokeh.version}`);
Bokeh.set_log_level("debug");


function make_plot(title:string, source:Bokeh.ColumnDataSource) {
    
    // Create plot
    const xr = new Bokeh.DataRange1d({});
    const yr = new Bokeh.DataRange1d({});
    const plot = new plt.Figure({
        tools: "pan,wheel_zoom,save,reset",        
        x_range: xr,
        y_range: yr,         
        title: title,
        plot_width: 400,
        plot_height: 400,
        background_fill_color: "#eeeeff",
    });
    
    // Add axis and grid
    const xaxis = new Bokeh.DatetimeAxis({axis_line_color: null, axis_label: 'time'});
    const yaxis = new Bokeh.LinearAxis({axis_line_color: null, axis_label: 'price'});
    plot.add_layout(xaxis, "below");
    plot.add_layout(yaxis, "left");
    plot.add_layout(new Bokeh.Grid({ticker: xaxis.ticker, dimension: 0}));
    plot.add_layout(new Bokeh.Grid({ticker: yaxis.ticker, dimension: 1}));
    
    // Add a line for each entry in the source
    const colors = ['#aa0000','#00aa00', '#0000aa', '#aaaa00', '#aa00aa', '#00aaaa'];
    let i = -1;
    for (let key in source.data) {
        if (key != 't') {
            i += 1;
            let line = new Bokeh.Line({x:{field:'t'}, y:{field:key}, legend: key, 
                                       line_color: colors[i%6], line_width: 2});
            plot.add_glyph(line, source);
        }
    }
    
    // Add tools - not needed if we use Figure
    //plot.add_tools(new Bokeh.PanTool(), new Bokeh.WheelZoomTool(), new Bokeh.ResetTool(), new Bokeh.PreviewSaveTool());
    
    // Tweaks to work around bootstrap problems 
    xr.renderers = plot.renderers;
    yr.renderers = plot.renderers;
    
    return plot;
}

// Create source
const source = new Bokeh.ColumnDataSource({data: {  t: [1000,2000,3000,4000,5000,6000,7000,8000], 
                                                  foo: [1,4,3,5,2,3,2,4],
                                                  bar: [4,5,7,6,8,6,7,4],
                                                 spam: [2,1,2,1,3,1,2,3]} });

// Make source update on an interval
let t = 8;
const period = 0.5;  // seconds
function new_data() {
    t += period;
    let d:Bokeh.Data = {'t': [t*1000], 
                      'foo': [Math.sin(t*0.3+0) * 2 + Math.random() + 3],
                      'bar': [Math.sin(t*0.5+1) * 2 + Math.random() + 3],
                     'spam': [Math.sin(t*0.7+2) * 2 + Math.random() + 3]}
    source.stream(d, 50);
}
setInterval(new_data, period*1000);

// Create plot and attach to DOM
const plot = make_plot('Simple stocks demo', source);
const div = document.getElementById("plot");
plt.show(plot, div);
