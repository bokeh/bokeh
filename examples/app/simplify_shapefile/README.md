### Interactive Polygon Simplification using Bokeh Server and GeoPandas

The following example uses GeoPandas to simplify a shapefile.

The amount of simplification is determined by the user through use of a slider component.

Once the desired amount of simplification is achieved, the user can save the geometry to a new shapefile.

####Note:

- Simplification uses the [Ramer-Douglas-Peucker](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm) algorithm available through [GeoPandas](http://geopandas.org) which does not preserve shared boundaries between independent polygon features.

- Output shapefile will be written to directory which contains input shapefile with a `_simplified.shp` suffix.
