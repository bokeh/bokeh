#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a customizable Bokeh Server Tornadocore application.

The architecture of Bokeh is such that high-level "model objects"
(representing things like plots, ranges, axes, glyphs, etc.) are created
in Python, and then converted to a JSON format that is consumed by the
client library, BokehJS. (See :ref:`userguide_concepts` for a more detailed
discussion.) By itself, this flexible and decoupled design offers advantages,
for instance it is easy to have other languages (R, Scala, Lua, ...) drive
the exact same Bokeh plots and visualizations in the browser.

However, if it were possible to keep the "model objects" in python and in
the browser in sync with one another, then more additional and powerful
possibilities immediately open up:

* respond to UI and tool events generated in a browser with computations or
  queries using the full power of python
* automatically push server-side updates to the UI (i.e. widgets or plots in a browser)
* use periodic, timeout, and asynchronous callbacks to drive streaming updates

**This capability to synchronize between python and the browser is the main
purpose of the Bokeh Server.**

'''
