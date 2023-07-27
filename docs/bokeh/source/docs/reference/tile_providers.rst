.. _bokeh.tile_providers:

bokeh.tile_providers
====================

Pre-configured tile sources for common third party tile services.

.. autofunction:: bokeh.tile_providers.get_provider

The available built-in tile providers are listed in the ``Vendors`` enum:

.. bokeh-enum:: Vendors
    :module: bokeh.tile_providers
    :noindex:

.. warning::
    The built-in Vendors are deprecated as of Bokeh 3.0.0 and will be removed in a future
    release. You can pass the same strings to ``add_tile`` directly.

Any of these values may be be passed to the ``get_provider`` function in order
to obtain a tile provider to use with a Bokeh plot. Representative samples of
each tile provider are shown below.

CARTODBPOSITRON
---------------

Tile Source for CartoDB Tile Service

.. raw:: html

    <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331.png" />

CARTODBPOSITRON_RETINA
----------------------

Tile Source for CartoDB Tile Service (tiles at 'retina' resolution)

.. raw:: html

    <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331@2x.png" />

ESRI_IMAGERY
------------

Tile Source for ESRI public tiles.

.. raw:: html

    <img src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/6331/2627.jpg" />

OSM
---

Tile Source for Open Street Maps.

.. raw:: html

    <img src="https://c.tile.openstreetmap.org/14/2627/6331.png" />

STAMEN_TERRAIN
--------------

Tile Source for Stamen Terrain Service

.. raw:: html

    <img src="https://stamen-tiles.a.ssl.fastly.net/terrain/14/2627/6331.png" />

STAMEN_TERRAIN_RETINA
---------------------

Tile Source for Stamen Terrain Service (tiles at 'retina' resolution)

.. raw:: html

    <img src="https://stamen-tiles.a.ssl.fastly.net/terrain/14/2627/6331@2x.png" />

STAMEN_TONER
------------

Tile Source for Stamen Toner Service

.. raw:: html

    <img src="https://stamen-tiles.a.ssl.fastly.net/toner/14/2627/6331.png" />

STAMEN_TONER_BACKGROUND
-----------------------

Tile Source for Stamen Toner Background Service which does not include labels

.. raw:: html

    <img src="https://stamen-tiles.a.ssl.fastly.net/toner-background/14/2627/6331.png" />

STAMEN_TONER_LABELS
-------------------

Tile Source for Stamen Toner Service which includes only labels

.. raw:: html

    <img src="https://stamen-tiles.a.ssl.fastly.net/toner-labels/14/2627/6331.png" />
