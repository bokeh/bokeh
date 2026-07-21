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
* scatter_blend.py - to test color names and blending of semi-transparent glyphs
* mixed_markers_streaming.py - mixed marker selection, patching, and streaming
* nested_evenodd_polygons.py - nested islands and disjoint polygon holes
* localized_multiline.py - bounded line accumulation and long-dash precision
* architectural_batching.py - queued composition and cross-renderer batching
* gpu_mapped_ranges.py - immutable data-coordinate buffers for fast range updates
* gpu_mapper_showcase.py - interactive precision-rebased linear and log GPU mappers


### Other WebGL examples in this directory

* clustering.py - a clustering example based on scikit-learn that produces
  a large amount of points (calculation takes a while)
