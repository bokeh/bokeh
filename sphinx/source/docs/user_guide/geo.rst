.. _userguide_geo:

Mapping Geo Data
================

Bokeh has started adding support for working with Geographical data. There are
a number of powerful features already available, but we still have more to add.
Please tell use your use cases through the `mailing list`_ or on `github`_ so that we
can continue to build out these features to meet your needs.

.. _userguide_geo_tile_provider_maps:

Tile Provider Maps
------------------

Bokeh plots can also consume XYZ tile services which use the Web Mercator projection.
The module :ref:`bokeh.tile_providers` contains several pre-configured tile sources with
appropriate attribution which can be added to a plot using the
:func:`~bokeh.models.plots.Plot.add_tile` method.

.. bokeh-plot:: docs/user_guide/examples/geo_tile_source.py
    :source-position: below

Notice also that passing ``x_axis_type="mercator"`` and ``y_axis_type="mercator"``
to ``figure`` generate axes with latitude and longitute labels, instead of raw Web
Mercator coordinates.

.. _userguide_geo_google_maps:

Google Maps
-----------

Bokeh can also plot glyphs over a Google Map using the :func:`~bokeh.plotting.gmap.gmap`
function. You must pass this function `Google API Key`_ in order for it to work, as
well as any :class:`~bokeh.models.map_plots.GMapOptions` to configure the Google Map
underlay.

.. bokeh-plot:: docs/user_guide/examples/geo_gmap.py
    :source-position: below

.. note::
    Google has its own terms of service for using Google Maps API and any use
    of Bokeh with Google Maps must be within Google's Terms of Service

.. _userguide_geo_geojson_data:

GeoJSON Data
------------

`GeoJSON`_ is a popular open standard for representing geographical features
with JSON. It describes points, lines and polygons (called Patches in Bokeh) as a
collection of features. Each feature can also have a set of properties.

Bokeh's ``GeoJSONDataSource`` can be used almost seamlessly in place of Bokeh's
``ColumnDataSource``. For example:

.. bokeh-plot:: docs/user_guide/examples/geo_geojson_source.py
    :source-position: above

.. warning::
    It is important to note that behind the scenes, Bokeh converts the
    GeoJSON coordinates into columns called `x` and `y` or `xs` and `ys`)
    (depending on whether the features are Points, Lines, MultiLines, Polygons
    or MultiPolygons). *Properties with clashing names will be overridden when
    the GeoJSON is converted, and should be avoided*.

.. _GeoJSON: http://geojson.org
.. _github: https://github.com/bokeh/bokeh
.. _Google API Key: https://developers.google.com/maps/documentation/javascript/get-api-key
.. _mailing list: https://groups.google.com/a/anaconda.com/forum/#!forum/bokeh
