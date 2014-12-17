### Bokeh examples

This directory contains several examples that show how to use Bokeh to build plots, widgets and apps, and how to embed them directly in a website. The directory also includes the plot examples displayed in the [Bokeh gallery](http://bokeh.pydata.org/docs/gallery.html) on the official site. 

The examples are organized in six different folders explained below. We recommend that newcomers start with `plotting` and `charts` then move through `glyphs`, `compat`, `app` and `embed` to learn how to build apps with Bokeh and its low-level plotting interface.


#### [`plotting`](https://github.com/bokeh/bokeh/tree/master/examples/plotting)
This directory contains example using the high level plotting interface, and is the interface most users should want to start with.
There are three subdirectories illustrating output in three different modes:

* `file` - Examples that output static HTML files
* `notebook` - Examples that output inline within IPython notebooks
* `server` - Examples that send their output to the Bokeh server. These examples require the Bokeh server to be running (to do so, execute 'bokeh-server' from the command line)

#### [`charts`](https://github.com/bokeh/bokeh/tree/master/examples/charts)
This directory includes examples that use the high level interface of Bokeh, e.g. for easily building histograms, 

#### [`glyphs`](https://github.com/bokeh/bokeh/tree/master/examples/glyphs)
This directory contains examples that use the low-level interface and examples that mirror the `bokehjs` browser library interface. 

#### [`compat`](https://github.com/bokeh/bokeh/tree/master/examples/compat)
This directory contains examples of plots that allow the user to invoke methods of other plotting packages  (e.g. `matplotlib`, `seaborn` and `ggplots`) through Bokeh.

#### [`embed`](https://github.com/bokeh/bokeh/tree/master/examples/embed)
This directory includes examples that show how to embed Bokeh plots in an full site as objects within an HTML document.

## Notes

* Windows has received the least amount of attention and support for Windows is being improved for the next 0.2 release.

* All tools must be selected in the toolbar before they are active. Some common tools:
 - zoom: this is a scroll wheel zoom
 - pan: left click drag to pan
 - resize left click drag to resize

