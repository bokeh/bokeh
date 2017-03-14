# Exploding Pivot Charts

## Intro
This bokeh app creates pivot charts from data, similar to Excel's pivot
chart functionality, but with the additional ability to explode into
multiple pivot charts.

The code was developed starting from Bokeh/examples/app/crossfilter.

The code is data-agnostic, so any other properly formatted data can
be used in place of the default CSV (see Data Source below).

## Setting Up From Scratch (if you don't already have Bokeh)
Easiest way is to get Anaconda for python 2.7 or 3.5 at:
https://www.continuum.io/downloads

You can check if Anaconda automatically installed bokeh by going to
command line and simply entering:
```
bokeh
```
If you get a message that says
```
ERROR: Must specify subcommand...
```
you already have Bokeh. If not, here are the Bokeh installation instructions:
http://bokeh.pydata.org/en/latest/docs/installation.html. The easiest way,
from the command line:
```
conda install bokeh
```

## Running
From command line:
```
bokeh serve --show /path/to/this/app/
```
This will launch a browser window with the viewer. To see
a plot, you'll have to select the columns to use for x-axis and y-axis, which are two of the widgets
on the left-hand side of the screen. Plots will automatically update as most values are changed, with the
exception of Filters (see below). For select boxes, this means that making a new selection will trigger plot updates. For
text boxes, after an entry is changed, you must press either Enter or defocus on the field to trigger the plot update.

Here is the full list of widgets:
* Data Source (required): Enter a path to a properly formatted csv file. Make sure
that there are column headers for each column in the csv file and no row labels.
* X-axis (required): Select a column to use as x-axis
* Group X By: Select a column to group the x-axis (if both x-axis and grouping columns are discrete).
* Y-axis (required): Select a column to use as y-axis
* Y-axis aggregation: You may aggregate y-axis data (for each series) if it is numeric. "Sum" is currently the only option,
and is on by default.
* Series: Pick a column to split the data into separate, color-coded series. If Chart Type (see Plot Adjustments
below) is Area or Bar, series will automatically be stacked. If Chart Type is Line or Dot, the series will not be stacked.
* Series Legend: Click on this to see the color and name of each series
* Explode By: Select a discrete column to split into multiple charts. The charts' titles will correspond to the
exploded column values.
* Group Exploded Charts By: Select a discrete column to group exploded charts. Play around with plot sizes (see below)
and/or resize your browser screen to make a nice 2d array of charts.
* Filters: Each column can be used to filter data with checkboxes. After selecting Filters, you must press
the Update Filters button to apply the filters
* Update Filters: This is used for updating the charts once filters have been changed
* Plot Adjustments: Make additional modifications to the chart type, size, x-axis/y-axis limits and scale, etc.
* Download csv: This will download the data you are viewing (after applying filters, aggregation, etc.) into
a csv file in the downloads/ folder
* Export config to URL: Clicking this will take the widget configurations and dump them into the URL address bar. You can use this URL
to automatically set the widgets as they were when exported. While the bokeh server is running, try copying & pasting the URL into a
new window/tab to prove that it works.

## Resources
This tool uses bokeh, built on python:
http://bokeh.pydata.org/en/latest/.
The site has good documentation in the User Guide and Reference.

There is also an active google group for issues:
https://groups.google.com/a/continuum.io/forum/#!forum/bokeh

And of course, python has good documentation too:
https://docs.python.org/2.7/tutorial/
https://docs.python.org/3.5/tutorial/
