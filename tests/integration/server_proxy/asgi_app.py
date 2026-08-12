#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# External imports
from shared import modify_document

# Bokeh imports
from bokeh.server.asgi import BokehASGI

application = BokehASGI(modify_document)
