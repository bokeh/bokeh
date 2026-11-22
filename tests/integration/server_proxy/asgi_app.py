#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

from shared import modify_document

from bokeh.server.asgi import BokehASGI

application = BokehASGI({"/myapp": modify_document}, prefix="/services/bokeh")
