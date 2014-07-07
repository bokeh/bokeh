"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the ChartObject class used aa a minimal prototype to build more each
chart type available. It also provides the mechanisms to support chained
methods.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class ChartObject(object):

    def __init__(self, title, xlabel, ylabel, legend,
                 xscale, yscale, width, height,
                 tools, filename, server, notebook):
        self.__title = title
        self.__xlabel = xlabel
        self.__ylabel = ylabel
        self.__legend = legend
        self.xscale = xscale
        self.yscale = yscale
        self.__width = width
        self.__height = height
        self.__tools = tools
        self.__filename = filename
        self.__server = server
        self.__notebook = notebook

    def title(self, title):
        self._title = title
        return self

    def xlabel(self, xlabel):
        self._xlabel = xlabel
        return self

    def ylabel(self, ylabel):
        self._ylabel = ylabel
        return self

    def legend(self, legend):
        self._legend = legend
        return self

    def width(self, width):
        self._width = width
        return self

    def height(self, height):
        self._height = height
        return self

    def tools(self, tools=True):
        self._tools = tools
        return self

    def filename(self, filename):
        self._filename = filename
        return self

    def server(self, server):
        self._server = server
        return self

    def notebook(self, notebook=True):
        self._notebook = notebook
        return self

    # TODO: make more chain methods

    def check_attr(self):
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_xlabel'):
            self._xlabel = self.__xlabel
        if not hasattr(self, '_ylabel'):
            self._ylabel = self.__ylabel
        if not hasattr(self, '_legend'):
            self._legend = self.__legend
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height
        if not hasattr(self, '_tools'):
            self._tools = self.__tools
        if not hasattr(self, '_filename'):
            self._filename = self.__filename
        if not hasattr(self, '_server'):
            self._server = self.__server
        if not hasattr(self, '_notebook'):
            self._notebook = self.__notebook

    def draw(self):
        pass
