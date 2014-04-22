# -*- coding: utf-8 -*-
from mplexporter.exporter import Exporter
from mplexporter.renderers import Renderer

from .plotting import line, show, hold, output_file


class BokehRenderer(Renderer):
    def __init__(self):
        self._figure = [hold()]

    def open_figure(self, fig, props):
        self.figwidth = int(props['figwidth'] * props['dpi'])
        self.figheight = int(props['figheight'] * props['dpi'])

    def draw_line(self, data, coordinates, style, label, mplobj=None):
        x = data[:, 0]
        y = data[:, 1]

        line_color = style['color']
        line_width = style['linewidth']
        line_alpha = style['alpha']

        plot = line(x,
                    y,
                    line_color=line_color,
                    line_width=line_width,
                    line_alpha=line_alpha)

        self._figure.append(plot)


def to_bokeh(fig, filename):
    """Convert a matplotlib figure to a bokeh object"""
    output_file(filename, resources="relative")
    renderer = BokehRenderer()
    exporter = Exporter(renderer)
    exporter.run(fig)
    renderer._figure
    show()
