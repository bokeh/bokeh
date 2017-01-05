.. _userguide_geo:

Mapping Geo Data
================

Bokeh has started adding support for working with Geographical data. There are
a number of powerful features already available, but we still have more to add.
Please tell use your use cases through the `mailing list`_ or on `github`_ so that we
can continue to build out these features to meet your needs.


GeoJSON Datasource
------------------

`GeoJSON`_ is a popular open standard for representing geographical features
with JSON. It describes points, lines and polygons (called Patches in Bokeh) as a
collection of features. Each feature can also have a set of properties.

Bokeh's ``GeoJSONDataSource`` can be used almost seamlessly in place of Bokeh's
``ColumnDataSource``. For example:

.. bokeh-plot::
    :source-position: above

    from bokeh.io import output_file, show
    from bokeh.models import GeoJSONDataSource
    from bokeh.plotting import figure
    from bokeh.sampledata.sample_geojson import geojson

    geo_source = GeoJSONDataSource(geojson=geojson)

    p = figure()
    p.circle(x='x', y='y', alpha=0.9, source=geo_source)
    output_file("geojson.html")
    show(p)


The important thing to know is that behind the scenes, Bokeh converts the
GeoJSON coordinates into columns called `x` and `y` (`z` where appropriate)
or `xs` and `ys` depending on whether the features are Points, Lines,
MultiLines, Polygons or MultiPolygons. Properties with clashing names will be
overridden when the GeoJSON is converted, so the following code would not
behave as expected.

.. warning::
    If your GeoJSON properties contain a property `x` and you want to use this
    to set the size of your circles, and you do this:

    **Antipattern** this will not work.

    ``p.circle(size='x', alpha=0.9, source=geo_source)``

    You will not get the plot you expect because this is equivalent to

    ``p.circle(x='x', y='y', size='x', alpha=0.9, source=geo_source)``

    and the x value from your properties will be overridden with the longitude
    values from your geometry coordinates.



Google Maps support
-------------------

With the GMapPlot, you can plot any bokeh glyphs over a Google Map.

.. bokeh-plot::
    :source-position: below

    from bokeh.io import output_file, show
    from bokeh.models import (
      GMapPlot, GMapOptions, ColumnDataSource, Circle, DataRange1d, PanTool, WheelZoomTool, BoxSelectTool
    )

    map_options = GMapOptions(lat=30.29, lng=-97.73, map_type="roadmap", zoom=11)

    plot = GMapPlot(
        x_range=DataRange1d(), y_range=DataRange1d(), map_options=map_options
    )
    plot.title.text = "Austin"

    # For GMaps to function, Google requires you obtain and enable an API key:
    #
    #     https://developers.google.com/maps/documentation/javascript/get-api-key
    #
    # Replace the value below with your personal API key:
    plot.api_key = "GOOGLE_API_KEY"

    source = ColumnDataSource(
        data=dict(
            lat=[30.29, 30.20, 30.29],
            lon=[-97.70, -97.74, -97.78],
        )
    )

    circle = Circle(x="lon", y="lat", size=15, fill_color="blue", fill_alpha=0.8, line_color=None)
    plot.add_glyph(source, circle)

    plot.add_tools(PanTool(), WheelZoomTool(), BoxSelectTool())
    output_file("gmap_plot.html")
    show(plot)

.. warning::
    There is an `open issue`_ documenting points appearing to be ~10px off from
    their intended location.

    Google has its own terms of service for using Google Maps API and any use
    of Bokeh with Google Maps must be within Google's Terms of Service


.. _mailing list: https://groups.google.com/a/continuum.io/forum/#!forum/bokeh
.. _github: https://github.com/bokeh/bokeh
.. _GeoJSON: http://geojson.org
.. _open issue: https://github.com/bokeh/bokeh/issues/2964

Tile Providers
------------------
Bokeh plots can also consume XYZ tile services which use the Web Mercator projection. The module ``bokeh.tile_providers`` contains several pre-configured tile sources with appropriate attribution which can be added to a plot using the `.add_tile()` method.

.. bokeh-plot::
    :source-position: below

    from bokeh.io import output_file, show
    from bokeh.plotting import figure
    from bokeh.tile_providers import STAMEN_TONER

    bound = 20000000 # meters
    fig = figure(tools='pan, wheel_zoom', x_range=(-bound, bound), y_range=(-bound, bound))
    fig.axis.visible = False
    fig.add_tile(STAMEN_TONER)
    output_file("stamen_toner_plot.html")
    show(fig)
