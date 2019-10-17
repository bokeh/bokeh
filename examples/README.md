# Bokeh Examples

## Examples in this repository

This directory contains many examples of different ways to use Bokeh. As Bokeh has been evolving
fast, it is important that you **ensure that the version of an example you're looking at matches
the version of Bokeh you are running**.

### [`app`](app/)

This directory contains examples of Bokeh Apps, which are simple and easy to create web applications for data visualization or exploration.

### [`embed`](embed/)

This directory includes examples that show how to embed Bokeh plots and widget in HTML documents.

### [`howto`](howto/)

The examples in this directory are mini-tutorials that demonstrate and explain
some  particular aspect of Bokeh capability (such as [linking and
brushing](http://www.infovis-wiki.net/index.php?title=Linking_and_Brushing)),
or walk through a particular example in additional detail.

### [`models`](models/)

This directory contains examples that use the lowest-level
[`bokeh.models`](https://docs.bokeh.org/en/latest/docs/reference/models.html)
interface. For more information about Bokeh models see [the concepts section of
the user_guide](https://docs.bokeh.org/en/latest/docs/user_guide/concepts.html)

### [`plotting`](plotting/)

This directory contains example using the
[`bokeh.plotting`](https://docs.bokeh.org/en/latest/docs/user_guide/plotting.html)
interface. There are three subdirectories illustrating output in three
different modes:

* `file` examples that output to static HTML files

* `notebook` examples that display inline in [Jupyter](http://jupyter.org) notebooks

* `server` examples that send output to a Bokeh server, using the python client library for the server

### [`webgl`](webgl/)

This directory contains examples that demonstrate the various glyphs that have
support for WebGL rendering. Most of these examples have a testing purpose, e.g.
to compare the appearance of the WebGL glyph with its regular appearance, or to
test another aspect of WebGL (e.g. blending of transparent glyphs).


## Other sources for examples

* There are many examples in the [Bokeh Gallery](https://docs.bokeh.org/en/latest/docs/gallery.html) on main documentation site https://docs.bokeh.org.

* The [Bokeh User's Guide](https://docs.bokeh.org/en/latest/docs/user_guide.html) has many plots with corresponding code samples throughout.

* Many examples of Bokeh being used with the [Jupyter](http://jupyter.org) notebook, including a set or tutorial notebooks, are collected in the [`bokeh-notebooks`](https://github.com/bokeh/bokeh-notebooks) repository. Live versions of these notebooks [can be run online on MyBinder](https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb). These notebooks are also available statically rendered on the [Bokeh NBViewer page](http://nbviewer.jupyter.org/github/bokeh/bokeh-notebooks/blob/master/index.ipynb).
