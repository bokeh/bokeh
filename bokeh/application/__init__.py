''' Define the Bokeh application class.

A *Bokeh Application* is a lightweight factory for creating Bokeh Documents.
For example, whenever a new client connects to a Bokeh Server, the server uses
the ``Application`` to generate a unique new document, to service  the client
session. The application performs this task by invoking the ``modify_document``
method of any ``Handler`` objects that it is configured with.

'''

from __future__ import absolute_import

from .application import Application
