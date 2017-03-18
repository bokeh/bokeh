# Bokeh Examples

## Examples in this repository

This directory contains many examples of different ways to use Bokeh. As Bokeh has been evolving
fast, it is important that you **ensure that the version of an example you're looking at matches
the version of Bokeh you are running**.

### [`app`](app/)

This directory contains examples of Bokeh Apps, which are simple and easy to create web applications for data visualization or exploration.

### [`charts`](charts/)

This directory includes examples that use the high level
[`bokeh.charts`](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html)
interface of Bokeh. This interface can be for easily building high-level
statistical or scientific charts such as
[histograms](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#histograms),
[bar charts](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#bar-charts) or
[box plots](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#box-plots).

### [`compat`](compat/)

This directory contains examples of plots that use Bokeh's [compatibility
layer](http://bokeh.pydata.org/en/latest/docs/user_guide/compat.html) to allow
users to create Bokeh plots using other plotting libraries such as
[matplotlib](http://matplotlib.org) and
[seaborn](http://stanford.edu/~mwaskom/software/seaborn/).

### [`embed`](embed/)

This directory includes examples that show how to embed Bokeh plots and widget in HTML documents.

### [`howto`](howto/)

The examples in this directory are mini-tutorials that demonstrate and explain
some  particular aspect of Bokeh capability (such as [linking and
brushing](http://www.infovis-wiki.net/index.php?title=Linking_and_Brushing)),
or walk through a particular example in additional detail.

### [`models`](models/)

This directory contains examples that use the lowest-level
[`bokeh.models`](http://bokeh.pydata.org/en/latest/docs/reference/models.html)
interface. For more understanding of the bokeh.models interface see [the
concepts section of the
user_guide](http://bokeh.pydata.org/en/latest/docs/user_guide/concepts.html#bokeh-models)

### [`plotting`](plotting/)

This directory contains example using the
[`bokeh.plotting`](http://bokeh.pydata.org/en/latest/docs/user_guide/plotting.html)
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

* There are many examples in the [Bokeh Gallery](http://bokeh.pydata.org/en/latest/docs/gallery.html) on main documentation site http://bokeh.pydata.org.

* The [Bokeh User's Guide](http://bokeh.pydata.org/en/latest/docs/user_guide.html) has many plots with corresponding code samples throughout.

* Many examples of Bokeh being used with the [Jupyter](http://jupyter.org) notebook, including a set or tutorial notebooks, are collected in the [`bokeh-notebooks`](https://github.com/bokeh/bokeh-notebooks) repository. These notebooks are available statically rendered on the [Bokeh NBViewer page](http://nbviewer.jupyter.org/github/bokeh/bokeh-notebooks/blob/master/index.ipynb).

* Larger examples, e.g. integrations with web application frameworks such as [Flask](http://flask.pocoo.org) or [Django](https://www.djangoproject.com), are collected in the [`bokeh-demos`](https://github.com/bokeh/bokeh-demos) repository.
