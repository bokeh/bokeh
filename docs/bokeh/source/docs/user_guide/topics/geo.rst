.. _ug_topics_geo:

Geographical data
=================

Bokeh supports creating map-based visualizations and working with geographical data.

.. _ug_topics_geo_tile_provider_maps:

Tile provider maps
------------------

Bokeh is compatible with several XYZ tile services that use the Web Mercator projection.
Bokeh uses the `xyzservices`_ library to take care of the tile sources and their attributions.
To add these to a plot, use the method :func:`~bokeh.models.plots.Plot.add_tile`. You can pass
any name xyzservices may recognize. The ``retina`` keyword can control the resolution of tiles.

.. bokeh-plot:: __REPO__/examples/topics/geo/tile_source.py
    :source-position: below

If you pass ``retina=True``, Bokeh will attempt to use the tiles in the 2x higher resolution
than with default settings. However, this functionality needs to be supported by the tile provider.
Otherwise, the keyword is ignored. Alternatively, you can include ``'retina'`` as part of the tile
provider name string, e.g. ``'CartoDB Positron retina'``, which will work as ``retina=True``.

Notice that passing ``x_axis_type="mercator"`` and ``y_axis_type="mercator"``
to ``figure`` generates axes with latitude and longitude labels, instead of raw Web
Mercator coordinates.

Alternatively, you can use any :class:`xyzservices.TileProvider`, either pre-defined in
``xyzservices`` or a custom one.

.. bokeh-plot:: __REPO__/examples/topics/geo/tile_xyzservices.py
    :source-position: below

The available built-in tile providers are listed in the `xyzservices`_ documentation or
interactively as an ``xyzservices.providers`` module.

Representative samples of the most common tile providers are shown below.

CartoDB Positron
~~~~~~~~~~~~~~~~

Tile Source for CartoDB Tile Service

.. raw:: html

    <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331.png" />

Esri World Imagery
~~~~~~~~~~~~~~~~~~

Tile Source for ESRI public tiles.

.. raw:: html

    <img src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/6331/2627.jpg" />

OSM
~~~

Tile Source for Open Street Map Mapnik.

.. raw:: html

    <img src="https://c.tile.openstreetmap.org/14/2627/6331.png" />

.. _ug_topics_geo_google_maps:

Google Maps
-----------

To plot glyphs over a Google Map, use the function :func:`~bokeh.plotting.gmap`.
For the function to work, you must pass it a `Google API Key`_ and configure the Google Map underlay :class:`~bokeh.models.map_plots.GMapOptions`.
The Google API Key will be stored in the Bokeh Document JSON.

.. bokeh-plot:: __REPO__/examples/topics/geo/gmap.py
    :source-position: below

.. note::
    Any use of Bokeh with Google Maps must be within Google's Terms of Service.

Google Maps exerts explicit control over aspect ratios at all
times, which imposes some limitations on ``GMapPlot``:

* Only ``Range1d`` ranges are supported. Attempting to use other range types will result in an error.

* Usage of ``BoxZoomTool`` is incompatible with ``GMapPlot`` and adding one will have no effect.

.. _ug_topics_geo_geojson_data:

GeoJSON data
------------

`GeoJSON`_ is a popular open standard for representing geographical features
with JSON. It describes points, lines, and polygons (called Patches in Bokeh) as a
collection of features. Each feature can also have a set of properties.

Bokeh's ``GeoJSONDataSource`` can be used almost seamlessly in place of Bokeh's
``ColumnDataSource``. For example:

.. bokeh-plot:: __REPO__/examples/topics/geo/geojson_source.py
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
.. _xyzservices: https://xyzservices.readthedocs.org
