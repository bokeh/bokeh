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

CARTO requires a `CARTO Basemaps API key <https://carto.com/basemaps/apikey/>`_.
Set the ``CARTO_API_KEY`` environment variable to your key before running the
example, or replace the placeholder with your own key. The example copies
an xyzservices provider and adds the key to its tile URL, preserving attribution
and support for retina tiles. Other providers may also require credentials;
consult the provider's documentation.

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
The Google API Key will be stored in the Bokeh Document JSON. Set the
``GOOGLE_API_KEY`` environment variable before running the example, or replace
the placeholder with your own key.

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

.. _ug_topics_geo_projections:

World Projections
-----------------

The `Cartopy`_ project offers the opportunity to display geographical information based on
world projections. In Bokeh it is possible to display these projections. The example below
uses 4 different projections and shows the coastlines of the world.

.. bokeh-plot:: __REPO__/examples/topics/geo/cartopy_projections.py
    :source-position: below

The coastlines used in the example above are one feature offered by `Cartopy`_. In the example
below further features are added to a projection.
The ocean, the land, borders and province borders as well as rivers and lakes are added
to a map of Europe. The `scale` argument can be used to draw more precise information for a feature.

.. bokeh-plot:: __REPO__/examples/topics/geo/europe.py
    :source-position: below

The states feature can be used to add information of states/provinces of a country to a map. In the
default resolution only the states of the USA are available. This feature is used to draw a colored
map of the USA in the example below.

.. bokeh-plot:: __REPO__/examples/topics/geo/us_states.py
    :source-position: below

The three examples above demonstrate how to draw world maps using plain Bokeh. The `Geoviews`_ project
also offers the opportunity to generate similar results using Bokeh as a backend. `Geoviews`_ provides
a higher level API and some additional user friendly options.

.. _Cartopy: https://cartopy.readthedocs.io
.. _GeoJSON: http://geojson.org
.. _Geoviews: https://geoviews.org/
.. _github: https://github.com/bokeh/bokeh
.. _Google API Key: https://developers.google.com/maps/documentation/javascript/get-api-key
.. _Discourse: https://discourse.bokeh.org
.. _xyzservices: https://xyzservices.readthedocs.org

Updating geometry records
-------------------------

``GeometryDataSource.replace()`` replaces geometry records and their attribute
columns together. It accepts the same GeoJSON and ``__geo_interface__`` inputs as
the constructor. ``stream()`` appends features, with an optional ``rollover``
limit. Existing attribute fields must be supplied for each new feature. Fields
introduced by a stream are backfilled with nulls for earlier features.

``patch()`` changes attributes, complete geometries, or individual vertices.
Integer indices identify features. Vertex paths start with a feature index,
followed by the coordinate path within that feature. LineString paths are
``(feature, vertex)``. Polygon paths are
``(feature, ring, vertex)`` and MultiPolygon paths are
``(feature, part, ring, vertex)``. A final slice replaces or appends vertices
within one ring. Part and ring boundaries and extra coordinate dimensions are
retained. When changing a closed ring, update both its first and last positions
if they must remain equal.

The :mod:`bokeh.geometry` module provides typed GeoJSON mappings and convenience
constructors for each geometry type. The constructors return ordinary
dictionaries and preserve the supplied coordinates. They do not validate
topology or close rings.

In this example, each LineString is a delivery route. Its attributes give the
destination and estimated travel time in minutes:

.. code-block:: python

    from bokeh.geometry import line_string
    from bokeh.models import GeometryDataSource

    source = GeometryDataSource(
        geometries=[line_string([[0, 0], [1, 0], [1, 1]])],
        data={"destination": ["Library"], "minutes": [8]},
    )

    # Move route 0's second point from [1, 0] to [2, 0] and update its travel time.
    source.patch({"geometry": [((0, 1), [2, 0])], "minutes": [(0, 10)]})

    # Add a second route, with its own destination and travel time.
    source.stream({
        "geometries": [line_string([[0, 0], [0, 2], [2, 2]])],
        "data": {"destination": ["Market"], "minutes": [12]},
    }, rollover=10)

    # Reroute the Market delivery around a road closure and update its travel time.
    source.patch({
        "geometry": [(1, line_string([[0, 0], [0, 3], [2, 3], [2, 2]]))],
        "minutes": [(1, 14)],
    })

    # source.geometries == [
    #     {"type": "LineString", "coordinates": [[0, 0], [2, 0], [1, 1]]},
    #     {"type": "LineString", "coordinates": [[0, 0], [0, 3], [2, 3], [2, 2]]},
    # ]
    # source.data == {"destination": ["Library", "Market"], "minutes": [10, 14]}

BokehJS provides the same constructors through ``Bokeh.geometry``, for example
``Bokeh.geometry.line_string([[0, 0], [1, 1]])``.
Helper results can be passed directly to ``stream()`` for sources without
attribute columns, or used as complete geometry values in ``patch()``.
Vertex patches take coordinate sequences instead.

Invalid update batches leave records unchanged and emit no change events.
Writable Python attribute columns and list-based vertices are patched in place.
Read-only columns and shaped geometry coordinates can require materialization.
Incremental ``stream()`` and ``patch()`` callbacks receive
:data:`~bokeh.util.callback_manager.OldValueUnavailable` as ``old`` and the current
source values as ``new``. Document holds defer these callbacks without retaining
per-update snapshots. Complete replacements retain their ordinary ``old`` and
``new`` values. Server applications synchronize all three operations through
the document protocol, including updates made in JavaScript.

Python callback policies such as ``Throttle`` and ``Debounce`` apply to browser
property assignments and do not delay record updates. A record update made in
JavaScript synchronizes any earlier queued assignments to ``geometries`` or
``data`` first.
