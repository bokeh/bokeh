''' Provide a base class for all Bokeh widget models.

In addition to different kinds of plots, various kinds of UI controls (e.g.
sliders, buttons, inputs, etc.) can be included in Bokeh documents. These
widgets can be used in conjunction with ``CustomJS`` callbacks that execute
in the browser,  or with python callbacks that execute on a Bokeh server.

'''
from __future__ import absolute_import

from ...core.has_props import abstract

from ..layouts import LayoutDOM

@abstract
class Widget(LayoutDOM):
    ''' A base class for all interactive widget types.

    '''
