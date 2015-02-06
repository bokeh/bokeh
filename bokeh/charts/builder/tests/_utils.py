""" Helpers for testing builders

"""
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


#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def create_chart(klass, values, compute_values=True, **kws):
    """ Create a new chart klass instance with values and the extra kws keyword
    parameters.

    Args:
        klass (class): chart class to be created
        values (iterable): chart data series
        compute_values (bool): if == True underlying chart attributes (like data,
                ranges, source, etc..) are computed by calling _setup_show,
                _prepare_show and _show_teardown methods.
        **kws (refer to klass arguments specification details)

    Return:
        _chart: klass chart instance
    """
    _chart = klass(
        values, title="title", xlabel="xlabel", ylabel="ylabel",
        legend="top_left", xscale="linear", yscale="linear",
        width=800, height=600, tools=True,
        filename=False, server=False, notebook=False,
        **kws
    )

    return _chart
