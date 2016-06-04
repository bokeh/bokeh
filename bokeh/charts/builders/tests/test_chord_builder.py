""" This is the Bokeh charts testing interface for the Chord Diagram

"""

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from bokeh.charts.builders.chord_builder import ChordBuilder

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def test_colors(test_data):
    builder = ChordBuilder(test_data.pd_data, origin='col1', destination='col2')
    builder.create()
    colors = builder.connection_data.data['colors']
    assert colors[0] != colors[1]
