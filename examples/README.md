### Bokeh examples

This directory contains several examples that show how to use Bokeh to build plots, widgets and apps, and how to embed them directly in a website. The directory also includes the plot examples displayed in the [Bokeh gallery](http://bokeh.pydata.org/docs/gallery.html) on the official site. 

The examples are organized in the folders explained below. We recommend that newcomers start with `plotting` and `charts`, and then move through `glyphs`, `compat`, `app` and `embed` to learn how to build apps with Bokeh and its low-level plotting interface.

#### [`plotting`](https://github.com/bokeh/bokeh/tree/master/examples/plotting)
This directory contains example using the high level plotting interface. This is the interface that most users should want start with. There are three subdirectories illustrating output in three different modes:

* `file` - Examples that output static HTML files
* `notebook` - Examples that output inline within IPython notebooks
* `server` - Examples that send their output to the Bokeh server, so they require the server to be running (to do this, you can invoke  'bokeh-server' from the command line)

#### [`charts`](https://github.com/bokeh/bokeh/tree/master/examples/charts)
This directory includes examples that use the high level interface of Bokeh, e.g. for easily building [histograms](http://bokeh.pydata.org/docs/gallery/histograms_chart.html), [area charts](http://bokeh.pydata.org/docs/gallery/area_chart.html) or [donut plots](http://bokeh.pydata.org/docs/gallery/donut_chart.html).

#### [`glyphs`](https://github.com/bokeh/bokeh/tree/master/examples/glyphs)
This directory contains examples that use the low-level interface and examples that mirror the `bokehjs` browser library interface. 

#### [`compat`](https://github.com/bokeh/bokeh/tree/master/examples/compat)
This directory contains examples of plots that allow the user to invoke methods of other plotting packages  (e.g. `matplotlib`, `seaborn` and `ggplots`) through Bokeh.

#### [`embed`](https://github.com/bokeh/bokeh/tree/master/examples/embed)
This directory includes examples that show how to embed Bokeh plots in as DOM objects within an HTML document.

## Notes

* Windows has received the least amount of attention and support for Windows is being improved for the next 0.2 release.

* All tools must be selected in the toolbar before they are active. Some common tools:
 - zoom: this is a scroll wheel zoom
 - pan: left click drag to pan
 - resize left click drag to resize

