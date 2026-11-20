''' Plot radius and angle pairs on a native polar frame and a sector crossing zero.

.. bokeh-example-metadata::
    :title: Native polar scatter
    :keywords: polar, radius, angle, scatter, sector, pan, zoom
    :apis: bokeh.models.PolarMapping, bokeh.models.PolarAxis, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_polar`
    :gallery: Blue scatter markers on a circular polar grid with radial and angular labels.

'''
from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import ColumnDataSource, FixedTicker, PolarAxis, PolarMapping, Range1d
from bokeh.plotting import figure

source = ColumnDataSource(dict(
    radius=[2, 4, 6, 8, 5, 7, 3, 9],
    theta=[0, 45, 90, 135, 180, 225, 300, 350],
))

full = figure(
    title="Polar scatter",
    width=450, height=450,
    coordinate_system=PolarMapping(radial_range=Range1d(0, 10)),
)
full.scatter(radius="radius", angle="theta", source=source, size=12, color="navy", alpha=0.7)

sector = figure(
    title="Sector crossing zero",
    width=450, height=450,
    coordinate_system=PolarMapping(
        radial_range=Range1d(0, 10),
        angular_range=Range1d(300, 420),
    ),
)
sector.scatter(radius="radius", angle="theta", source=source, size=12, color="firebrick", alpha=0.7)

angular_axis = next(axis for axis in sector.select(PolarAxis) if isinstance(axis, PolarAxis) and axis.dimension == "angular")
angular_axis.ticker = FixedTicker(ticks=list(range(300, 421, 30)))

show(row(full, sector))
