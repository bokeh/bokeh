### Interactive Polygon Simplification using Bokeh Server and GeoPandas

#### Prerequisites:
- This example requires [GeoPandas](http://geopandas.org). The simpliest way to install geopandas is through the `ioos` conda channel using:
`conda install -c ioos geopandas`

To verify GeoPandas has been installed, start an interactive python session and type `import geopandas` to confirm it imports without error. 

#### Usage:
- To run example:
`bokeh serve examples/app/simplify_shapefile`

- To simplify geometry, drag the slider at the top of the screen to the desired amount of simplification

####Notes:

- Simplification uses the [Ramer-Douglas-Peucker](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm) algorithm available through [GeoPandas](http://geopandas.org) which does not preserve shared boundaries between independent polygon features.
