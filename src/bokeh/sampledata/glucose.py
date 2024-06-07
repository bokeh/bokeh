#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from . import _create_sampledata_shim

__getattr__, __dir__, __doc__ = _create_sampledata_shim(__name__)
