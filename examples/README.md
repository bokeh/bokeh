# Bokeh Examples

## Examples in this repository

This directory contains many examples of different ways to use and embed Bokeh plots and applications.

NOTE: All of the links below are to the "master" branch of the repository, which always contains the newest and most updated code. For questions about specific versions of Bokeh, please take care to refer to the correct branch for your version!

### [`app`](https://github.com/bokeh/bokeh/tree/master/examples/app)

This directory contains examples of Bokeh Apps, which are simple and easy to create web applications for data visualization or exploration.

### [`charts`](https://github.com/bokeh/bokeh/tree/master/examples/compat)

This directory includes examples that use the high level [`bokeh.charts`](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html) interface of Bokeh. This interface can be for easily building high-level statistical or scientific charts such as 
[histograms](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#histograms), 
[bar charts](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#bar-charts) or 
[box plots](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#box-plots).

### [`compat`](https://github.com/bokeh/bokeh/tree/master/examples/compat)

This directory contains examples of plots that use Bokeh's [compatibility layer](http://bokeh.pydata.org/en/latest/docs/user_guide/compat.html) to allow users to create Bokeh plots using other plotting libraries such as [matplotlib](http://matplotlib.org), [seaborn](http://stanford.edu/~mwaskom/software/seaborn/), or [ggplot.py](http://ggplot.yhathq.com).

### [`embed`](https://github.com/bokeh/bokeh/tree/master/examples/embed)

This directory includes examples that show how to embed Bokeh plots in as DOM objects within an HTML document.

### [`glyphs`](https://github.com/bokeh/bokeh/tree/master/examples/glyphs)

This directory contains examples that use the lowest-level [`bokeh.models`](http://bokeh.pydata.org/en/latest/docs/user_guide/concepts.html#bokeh-models) interface. This interface mirrors the models found in the BokehJS browser library.

### [`interactions`](https://github.com/bokeh/bokeh/tree/master/examples/interactions)

The examples in this directory show off particular aspects of Bokeh user interaction, such as [linking and brushing](http://www.infovis-wiki.net/index.php?title=Linking_and_Brushing) or interactive hover annotations.

### [`plotting`](https://github.com/bokeh/bokeh/tree/master/examples/plotting)

This directory contains example using the [`bokeh.plotting`](http://bokeh.pydata.org/en/latest/docs/user_guide/plotting.html) interface. There are three subdirectories illustrating output in three different modes:

* `file` examples that output to static HTML files

* `notebook` examples that display inline in [Jupyter](http://jupyter.org) notebooks

* `server` examples that send output to a Bokeh server, using the python client library for the server 

## Other sources for examples

* There are many examples in the [Bokeh Gallery](http://bokeh.pydata.org/en/latest/docs/gallery.html) on main documentation site http://bokeh.pydata.org.

* The [Bokeh User's Guide](http://bokeh.pydata.org/en/latest/docs/user_guide.html) has many plots with corresponding code samples throughout.

* Many examples of Bokeh being used with the [Jupyter](http://jupyter.org) notebook, including a set or tutorial notebooks, are collected in the [`bokeh-notebooks`](https://github.com/bokeh/bokeh-notebooks) repository. These notebooks are available statically rendered on the [Bokeh NBViewer page](http://nbviewer.ipython.org/github/bokeh/bokeh-notebooks/blob/master/index.ipynb).

* Larger examples, e.g. integrations with web application frameworks such as [Flask](http://flask.pocoo.org) or [Django](https://www.djangoproject.com), are collected in the [`bokeh-demos`](https://github.com/bokeh/bokeh-demos) repository.




