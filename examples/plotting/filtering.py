''' A map representation of unemployment rate in US using the `US_States Dataset`_.
This example demonstrates using IndexFilter, ColorMapper and HoverTool with
basic plot elements such as patches. When hovering over the points,
the state and its umemployment rate is shown.

.. bokeh-example-metadata::
    :sampledata: US_States
    :apis: bokeh.models.IndexFilter, bokeh.models.HoverTool, bokeh.models.LinearColorMapper
    :refs: :ref:`ug_basic_areas_patches`, :ref:`ug_basic_data_filtering_index`
    :keywords: hover tool, indexfilter, filtering, US

.. _US_States Dataset: https://docs.bokeh.org/en/latest/docs/reference/sampledata.html#module-bokeh.sampledata.us_states
'''
from bokeh.core.properties import field
from bokeh.models import ColorBar, HoverTool, IndexFilter, LinearColorMapper
from bokeh.palettes import Viridis11
from bokeh.plotting import figure, show
from bokeh.sampledata.us_states import data as states

january_2021 = dict(
    AL= 4.0, AK= 7.1, AZ= 6.1, AR= 4.9, CA= 8.8, CO= 6.2, CT= 7.3, DE= 5.7, DC= 6.9, FL= 6.0,
    GA= 4.8, HI= 8.3, ID= 4.0, IL= 7.1, IN= 4.5, IA= 4.4, KS= 3.8, KY= 4.8, LA= 6.5, ME= 5.2,
    MD= 5.9, MA= 7.1, MI= 6.4, MN= 4.2, MS= 6.6, MO= 5.0, MT= 3.8, NE= 2.7, NV=10.2, NH= 4.2,
    NJ= 7.3, NM= 7.4, NY= 8.6, NC= 5.5, ND= 4.7, OH= 6.0, OK= 5.0, OR= 6.4, PA= 7.5, RI= 6.3,
    SC= 4.6, SD= 3.3, TN= 5.2, TX= 6.7, UT= 3.3, VT= 3.9, VA= 4.8, WA= 6.3, WV= 5.9, WI= 4.5,
    WY= 5.1,
)

state_xs = [states[code]["lons"] for code in states]
state_ys = [states[code]["lats"] for code in states]

p = figure(
    title="US unemployment January 2021 (by state)",
    width=1000, height=600,
    x_axis_location=None, y_axis_location=None,
    tools="pan,wheel_zoom,reset",
)
p.grid.grid_line_color = None

color_mapper = LinearColorMapper(palette=Viridis11)
r = p.patches(
    state_xs, state_ys,
    line_color="white", hover_line_color="black",
    fill_color=field("rate", color_mapper),
)

r.data_source.data["code"] = [ code for code in states ]
r.data_source.data["rate"] = [ january_2021[code] for code in states ]

HI_i = list(states.keys()).index("HI")
AK_i = list(states.keys()).index("AK")

filter = ~IndexFilter(indices=[HI_i, AK_i])
r.view.filter &= filter

p.add_tools(HoverTool(
    tooltips=[("state", "@code"), ("rate", "@rate{0.0}%")],
    renderers=[r],
))

p.add_layout(ColorBar(
    color_mapper=color_mapper,
    location="bottom_right", orientation="vertical", height=200,
), "center")

show(p)
