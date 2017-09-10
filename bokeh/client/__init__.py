''' Provides client API for connecting to a Bokeh server from a Python
process.

The primary uses for the ``bokeh.client`` are:

* Implementing testing infrastructure around Bokeh applications
* Creating and customizing specific sessions of a Bokeh application
  running *in a Bokeh Server*, before passing them to a viewer.

While it is also possible to run Bokeh application code "outside" a
Bokeh server using ``bokeh.client``, this practice is **HIGHLY DISCOURCED**.


'''
from __future__ import absolute_import

from .session import ClientSession, pull_session, push_session, show_session, DEFAULT_SESSION_ID
