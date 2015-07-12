#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

from matplotlib.collections import LineCollection, PolyCollection

from .mplexporter.exporter import Exporter

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class BokehExporter(Exporter):

    def draw_collection(self, ax, collection,
                        force_pathtrans=None,
                        force_offsettrans=None):

        if isinstance(collection, LineCollection):
            self.renderer.make_line_collection(collection)
        elif isinstance(collection, PolyCollection):
            self.renderer.make_poly_collection(collection)
        else:
            pass
            #super(BokehExporter, self).draw_collection(ax, collection, force_pathtrans, force_offsettrans)

    # def draw_patch(self, ax, patch, force_trans=None):
    #     markerstyle = utils.get_marker_style(patch)
    #     if (markerstyle['marker'] in ['None', 'none', None]
    #             or markerstyle['markerpath'][0].size == 0):
    #         markerstyle = None


