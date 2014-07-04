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

    def __init__(self, title, xname, yname, legend,
                 xscale, yscale, width, height,
                 filename, server, notebook):
        self.__title = title
        self.__xname = xname
        self.__yname = yname
        self.__legend = legend
        self.xscale = xscale
        self.yscale = yscale
        self.__width = width
        self.__height = height
        self.__filename = filename
        self.__server = server
        self.__notebook = notebook

    def title(self, title):
        self._title = title
        return self

    def xname(self, xname):
        self._xname = xname
        return self

    def yname(self, yname):
        self._yname = yname
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
        if not hasattr(self, '_xname'):
            self._xname = self.__xname
        if not hasattr(self, '_yname'):
            self._yname = self.__yname
        if not hasattr(self, '_legend'):
            self._legend = self.__legend
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height
        if not hasattr(self, '_filename'):
            self._filename = self.__filename
        if not hasattr(self, '_server'):
            self._server = self.__server
        if not hasattr(self, '_notebook'):
            self._notebook = self.__notebook

    def draw(self):
        pass
