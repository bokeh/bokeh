# Bokeh WebGL examples

This directory contains examples that demonstrate the various glyphs that have
support for WebGL rendering. Most of these examples have a testing purpose, e.g.
to compare the appearance of the WebGL glyph with its regular appearance, or to
test another aspect of WebGL (e.g. blending of transparent glyphs).


### Examples meant for testing

* line_compare.py - to compare regular and webgl lines (stipling, joins, caps)
* marker_compare.py - to compare regular and webgl markers
* line10k.py - uses the webgl line glyph to plot a relatively large dataset
* scatter10k.py - uses the webgl circle glyph and selections
* iris_blend.py - to test color names and blending of semi-transparent glyphs


### Other WebGL examples in this directory

* clustering.py - a clustering example based on scikit-learn that produces
  a large amount of points (calculation takes a while)
