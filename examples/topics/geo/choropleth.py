'''This example shows an unemployment map by county of the United States of America in 2009.
It demonstrates drawing shapes using polygonal data, as well as using color scales to indicate different integer ranges

.. bokeh-example-metadata::
    :sampledata: us_counties, us_states, unemployment
    :apis: bokeh.plotting.figure.polygons, bokeh.palettes.Viridis6, bokeh.plotting.show
    :refs: :ref:`ug_basic_areas_patches`
    :keywords: colormap, shapes, vector, polygon
'''

from bokeh.palettes import Viridis6
from bokeh.plotting import figure, show
from bokeh.sampledata.unemployment import by_fips
from bokeh.sampledata.us_counties import records as county_records
from bokeh.sampledata.us_states import records as state_records

EXCLUDED = ("AK", "HI", "PR", "GU", "VI", "MP", "AS")

counties = [
    county | {
        "color": Viridis6[int(by_fips[county["fips"]]/6)] if county["fips"] in by_fips else "black",
    }
    for county in county_records()
    if county["state"] not in EXCLUDED
]
states = [state for state in state_records() if state["code"] not in EXCLUDED]

p = figure(title="US Unemployment 2009",
           x_axis_location=None, y_axis_location=None,
           width=1000, height=600)
p.grid.grid_line_color = None

p.polygons(counties, fill_color="color", fill_alpha=0.7,
           line_color="white", line_width=0.5)

p.polygons(states, fill_alpha=0.0,
           line_color="#884444", line_width=2, line_alpha=0.3)

show(p)
