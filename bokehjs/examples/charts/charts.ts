namespace Charts {
    import plt = Bokeh.Plotting;

    /*
    const data = [
        ['Task', 'Hours per Day'],
        [abc,     n],
    ]
    */

    const data = {
        labels: ['Work', 'Eat', 'Commute', 'Sport', 'Watch TV', 'Sleep'],
        values: [8, 2, 2, 4, 0, 8],
    }

    const p1 = Bokeh.Charts.pie(data, {inner_radius: 0.2})
    const p2 = Bokeh.Charts.pie(data, {inner_radius: 0.2, start_angle: Math.PI/2})
    const p3 = Bokeh.Charts.pie(data, {inner_radius: 0.2, start_angle: Math.PI/6, end_angle: 5*Math.PI/6})
    const p4 = Bokeh.Charts.pie(data, {inner_radius: 0.2, palette: "Oranges9", slice_labels: "percentages"})

    plt.show(Bokeh.GridPlot([[p1, p2, p3, p4]]))
}
