# Record-oriented IndexedDataSource extension

This server app implements a custom `IndexedDataSource` backed by nested records
rather than a dictionary of columns. Ordinary glyphs, a `CDSView`, `GroupFilter`, hover
tooltips, and selection all consume its logical fields. Dotted field names such
as `position.x` are resolved by the source without flattening the records.

The slider replaces the `records` property in a Python server callback. This
uses the normal Bokeh document protocol, so the same model works in standalone
documents and server sessions. Each record also retains `position.z`, showing
how shaped or higher-dimensional values can remain in the source even when a 2D
glyph only consumes `position.x` and `position.y`.

To run the app from this directory's parent:

    bokeh serve --show record_data_source
