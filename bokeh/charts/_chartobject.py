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

from ._charts import Chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class ChartObject(object):
    """This is the ChartObject class, a prototype class to inherit each type of
    different new chart.

    It provided useful general methods to be used by the inherited chart clases
    such as:
        * chained methods
        * dinamically chart cration attributes, ie. `self.chart`
        * composition to easily use Chart clase methods
    """
    def __init__(self, title, xlabel, ylabel, legend,
                 xscale, yscale, width, height,
                 tools, filename, server, notebook):
        """
        Args:
            title (str): the title of your plot.
            xlabel (str): the x-axis label of your plot.
            ylabel (str): the y-axis label of your plot.
            legend (str, bool): the legend of your plot. The legend content is
                inferred from incoming input.It can be `top_left`,
                `top_right`, `bottom_left`, `bottom_right`.
                It is `top_right` is you set it as True.
            xscale (str): the x-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
            yscale (str): the y-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
            width (int): the width of your plot in pixels.
            height (int): the height of you plot in pixels.
            tools (bool): to enable or disable the tools in your plot.
            filename (str, bool): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                "untitled" as a filename.
            server (str, bool): the name of your plot in the server.
                If you pass True to this argument, it will use "untitled"
                as the name in the server.
            notebook (bool):if you want to output (or not) your plot into the
                IPython notebook.

        Notes:
            These Args are assigned to private attributes that will be used
            by default at the time of chart instantiation, except in the case
            we call any of the chained methods available, in that case the
            value used with the chained method will overwrite the default one.
        """
        self.__title = title
        self.__xlabel = xlabel
        self.__ylabel = ylabel
        self.__legend = legend
        self.__xscale = xscale
        self.__yscale = yscale
        self.__width = width
        self.__height = height
        self.__tools = tools
        self.__filename = filename
        self.__server = server
        self.__notebook = notebook

    def title(self, title):
        "title (str): the title of your plot."
        self._title = title
        return self

    def xlabel(self, xlabel):
        "xlabel (str): the x-axis label of your plot."
        self._xlabel = xlabel
        return self

    def ylabel(self, ylabel):
        "ylabel (str): the y-axis label of your plot."
        self._ylabel = ylabel
        return self

    def legend(self, legend):
        """legend (str, bool): the legend of your plot.

        The legend content is inferred from incoming input.
        It can be `top_left`, `top_right`, `bottom_left`, `bottom_right`.
        It is `top_right` is you set it as True.
        """
        self._legend = legend
        return self

    def xscale(self, xscale):
        "xscale (str): the x-axis scale of your plot."
        self._xscale = xscale
        return self

    def yscale(self, yscale):
        "yscale (str): the y-axis scale of your plot."
        self._yscale = yscale
        return self

    def width(self, width):
        "width (int): the width of your plot in pixels."
        self._width = width
        return self

    def height(self, height):
        "height (int): the height of you plot in pixels."
        self._height = height
        return self

    def tools(self, tools=True):
        """tools (bool): to enable or disable the tools in your plot.

        It defaults to True if you use the method without any parameter.
        """
        self._tools = tools
        return self

    def filename(self, filename):
        """filename (str, bool): the name of the file where your plot.
        will be written.

        If you pass True to this argument, it will use "untitled" as a filename.
        """
        self._filename = filename
        return self

    def server(self, server):
        """server (str, bool): the name of your plot in the server.

        If you pass True to this argument, it will use "untitled"
        as the name in the server.
        """
        self._server = server
        return self

    def notebook(self, notebook=True):
        """notebook (bool):if you want to output (or not) your plot into the
        IPython notebook.

        It defaults to True if you use the method without any parameter.
        """
        self._notebook = notebook
        return self

    # TODO: make more chain methods

    def check_attr(self):
        """This method check if any of the underscore attributes exists,
        so, it checks if any of the chained method were used. If they were
        not used, it assign the params content by default.
        """
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_xlabel'):
            self._xlabel = self.__xlabel
        if not hasattr(self, '_ylabel'):
            self._ylabel = self.__ylabel
        if not hasattr(self, '_legend'):
            self._legend = self.__legend
        if not hasattr(self, '_xscale'):
            self._xscale = self.__xscale
        if not hasattr(self, '_yscale'):
            self._yscale = self.__yscale
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

    def create_chart(self):
        """We dinamically create a new chart object containing
        our specific chart customized with our parameters we have
        passed in at the instantiation step or through the chained
        methods.
        """
        self.chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self._xscale, self._yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)

    def start_plot(self):
        "Wrapper to call the `chart.start_plot` method."
        self.chart.start_plot()

    def get_data(self):
        """Method to get the data and make specific calculations.
        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def get_source(self):
        """Method to push the data into the ColumnDataSource and
        build the proper ranges.
        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def add_data_plot(self):
        """Wrapper to call the `chart.add_data_plot` method.
        It internally pass source and ranges as parameters of the
        `chart.add_data_plot` method.
        """
        self.chart.add_data_plot(self.source, self.xdr, self.ydr)

    def draw(self):
        """Method to draw the glyphs into the plot.
        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def end_plot(self):
        """Wrapper to call the `chart.end_plot` method.
        It internally pass groups as parameters of the
        `chart.end_plot` method.
        """
        self.chart.end_plot(self.groups)

    def show_chart(self):
        "Wrapper to call the `chart.show` method."
        self.chart.show()

    # Some helper methods
    def _chunker(self, l, n):
        "Yield successive n-sized chunks from l."
        for i in range(0, len(l), n):
            yield l[i:i + n]

    def _set_colors(self, chunk):
        "Build the proper color list just cycling in a defined palette"
        colors = []

        pal = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]
        import itertools
        g = itertools.cycle(pal)
        for i in range(len(chunk)):
            colors.append(next(g))

        return colors