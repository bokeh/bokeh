#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' The ``sampledata`` module can be used to download data sets used in Bokeh
examples.

The simplest way to download the data is to use the execute the command line
program:

.. code-block:: sh

    bokeh sampledata

Alternatively, the ``download`` function described below may be called
programmatically.

.. code-block:: python

    >>> import bokeh.sampledata
    >>> bokeh.sampledata.download()

By default, data is downloaded and stored to a directory ``$HOME/.bokeh/data``.
This directory will be created if it does not already exist.

Bokeh also looks for a YAML configuration file at ``$HOME/.bokeh/config``. The
YAML key ``sampledata_dir`` can be set to the absolute path of a directory where
the data should be stored. For example, add the following line to the
config file:

.. code-block:: sh

    sampledata_dir: /tmp/bokeh_data

This will cause the sample data to be stored in ``/tmp/bokeh_data``.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Import
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'download',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

from ..util.sampledata import download; download

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
