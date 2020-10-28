.. _userguide_geo:

Mapping geo data
================

Bokeh has started adding support for working with geographical data. There are
a number of powerful features already available. Tell us your use cases through `Discourse`_ or on `GitHub`_ so that we can continue to extend these features to meet your needs.

.. _userguide_geo_tile_provider_maps:

Tile provider maps
------------------

Bokeh plots can consume XYZ tile services which use the Web Mercator projection.
The module :ref:`bokeh.tile_providers` contains several pre-configured tile sources with
appropriate attribution. To add these to a plot use the method 
:func:`~bokeh.models.plots.Plot.add_tile`.

.. bokeh-plot:: docs/user_guide/examples/geo_tile_source.py
    :source-position: below

Notice that passing ``x_axis_type="mercator"`` and ``y_axis_type="mercator"``
to ``figure`` generates axes with latitude and longitude labels, instead of raw Web
Mercator coordinates.

.. _userguide_geo_google_maps:

Google Maps
-----------

To plot glyphs over a Google Map use the function :func:`~bokeh.plotting.gmap`.
For the function to work you must pass it a `Google API Key`_ and configure the Google Map underlay :class:`~bokeh.models.map_plots.GMapOptions`.
The Google API Key will be stored in the Bokeh Document JSON.

.. bokeh-plot:: docs/user_guide/examples/geo_gmap.py
    :source-position: below

.. note::
    Any use of Bokeh with Google Maps must be within Google's Terms of Service.

Google Maps exerts explicit control over aspect ratios at all
times, which imposes some limitations on ``GMapPlot``:

* Only ``Range1d`` ranges are supported. Attempting to use other range types
  will result in an error.

* Usage of ``BoxZoomTool`` is incompatible with ``GMapPlot`` and adding one will have no effect.

.. _userguide_geo_geojson_data:

GeoJSON data
------------

`GeoJSON`_ is a popular open standard for representing geographical features
with JSON. It describes points, lines, and polygons (called Patches in Bokeh) as a
collection of features. Each feature can also have a set of properties.

Bokeh's ``GeoJSONDataSource`` can be used almost seamlessly in place of Bokeh's
``ColumnDataSource``. For example:

.. bokeh-plot:: docs/user_guide/examples/geo_geojson_source.py
    :source-position: above

.. warning::
    Bokeh converts the GeoJSON coordinates into columns called
    ``x`` and ``y`` or ``xs`` and ``ys`` (depending on whether the features are Points,
    Lines, MultiLines, Polygons, or MultiPolygons). *Properties with clashing names
    will be overridden when the GeoJSON is converted and should be avoided*.

.. _GeoJSON: http://geojson.org
.. _github: https://github.com/bokeh/bokeh
.. _Google API Key: https://developers.google.com/maps/documentation/javascript/get-api-key
.. _Discourse: https://discourse.bokeh.org
