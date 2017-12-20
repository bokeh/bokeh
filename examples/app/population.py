from math import pi

from bokeh.io import curdoc
from bokeh.layouts import column, row, widgetbox
from bokeh.models import ColumnDataSource, CustomJSTransform, FuncTickFormatter, Select
from bokeh.plotting import figure
from bokeh.sampledata.population import data as df
from bokeh.transform import factor_cmap, transform

years = [str(x) for x in sorted(df.Year.unique())]
locations = sorted(df.Location.unique())
groups = list(df.AgeGrp.unique())

# pyramid plot of age groups by gender

ages = ColumnDataSource(data=dict(AgeGrp=[], Sex=[], Value=[]))

gender_transform = CustomJSTransform(args=dict(source=ages), func="", v_func="""
    var val = new Float64Array(xs.length)
    for (var i = 0; i < xs.length; i++) {
        if (source.data['Sex'][i] == 'Male') { val[i] = -xs[i] }
        else { val[i] = xs[i] }
    }
    return val
""")

pyramid = figure(plot_width=600, plot_height=500, toolbar_location=None, y_range=groups,
                 title="Population Breakdown by Age Group and Gender",
                 x_axis_label="Population (Millions)",y_axis_label="Age Group")
pyramid.hbar(y="AgeGrp", height=1, right=transform('Value', gender_transform),
             source=ages, legend="Sex", line_color="white",
             fill_color=factor_cmap('Sex', palette=["#3B8686", "#CFF09E"], factors=["Male", "Female"]))

pyramid.ygrid.grid_line_color = None
pyramid.xaxis[0].formatter = FuncTickFormatter(code="""
    return (Math.abs(tick) / 1e6) + " M"
""")

# line plot of known and predicted population

known = ColumnDataSource(data=dict(x=[], y=[]))
predicted = ColumnDataSource(data=dict(x=[], y=[]))

population = figure(plot_width=600, plot_height=180, toolbar_location=None,
                    title="Total Population by Year",
                    x_axis_label="Year",y_axis_label="Population")
population.line("x", "y", color="violet", line_width=2, source=known, legend="known")
population.line("x", "y", color="violet", line_width=2, line_dash="dashed", source=predicted, legend="predicted")

population.xaxis.major_label_orientation = pi/4
population.xgrid.grid_line_color = None
population.legend.orientation = "horizontal"
population.legend.location = "bottom_center"
population.yaxis.minor_tick_line_color = None
population.yaxis[0].formatter = FuncTickFormatter(code="""
    return (Math.abs(tick) / 1e9) + " B"
""")

# Controls and callbacks

year = Select(title="Year:", value="2010", options=years)
location = Select(title="Location:", value="World", options=locations)

def update():
    age =  df[(df.Location == location.value) & (df.Year == int(year.value))]
    ages.data = ColumnDataSource.from_df(age)

    pop = df[df.Location == location.value].groupby(df.Year).Value.sum()
    new_known = pop[pop.index <= 2010]
    new_predicted = pop[pop.index >= 2010]
    known.data = dict(x=new_known.index.map(str), y=new_known.values)
    predicted.data = dict(x=new_predicted.index.map(str), y=new_predicted.values)

year.on_change('value', lambda attr, old, new: update())
location.on_change('value', lambda attr, old, new: update())

update()

controls = widgetbox(year, location, width=600)
curdoc().add_root(row(column(pyramid, population), controls))
