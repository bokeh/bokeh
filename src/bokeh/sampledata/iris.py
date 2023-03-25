#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide `Fisher's Iris dataset`_.

License: `CC0`_

Sourced from: https://www.kaggle.com/datasets/arshid/iris-flower-dataset

This module contains one pandas Dataframe: ``flowers``.

.. note::
    This sampledata is maintained for historical compatibility. Please consider
    `alternatives to Iris`_ such as :ref:`sampledata_penguins`.

.. rubric:: ``flowers``

:bokeh-dataframe:`bokeh.sampledata.iris.flowers`

.. bokeh-sampledata-xref:: iris

.. _Fisher's Iris dataset: https://en.wikipedia.org/wiki/Iris_flower_data_se
.. _alternatives to Iris: https://www.meganstodel.com/posts/no-to-iris/

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..util.sampledata import package_csv

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'flowers',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

flowers = package_csv('iris', 'iris.csv')
