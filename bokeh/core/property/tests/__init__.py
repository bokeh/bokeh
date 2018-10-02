#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from bokeh.core.has_props import HasProps
from bokeh.core.properties import Dict, Int, List, String
from bokeh.model import Model

class _TestHasProps(HasProps):
    x = Int(12)
    y = String("hello")
    z = List(Int, [1, 2, 3])
    zz = Dict(String, Int)
    s = String(None)

class _TestModel(HasProps):
    x = Int(12)
    y = String("hello")
    z = List(Int, [1, 2, 3])
    zz = Dict(String, Int)
    s = String(None)

class _TestModel2(HasProps):
    x = Int(12)
    y = String("hello")
    z = List(Int, [1, 2, 3])
    zz = Dict(String, Int)
    s = String(None)
