#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
logger = logging.getLogger(__name__)

from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

from .doc import curdoc ; curdoc

from .export import export_png ; export_png
from .export import export_svgs ; export_svgs

from .notebook import install_notebook_hook ; install_notebook_hook
from .notebook import push_notebook ; push_notebook

from .output import output_file ; output_file
from .output import output_notebook ; output_notebook
from .output import reset_output ; reset_output

from .saving import save ; save

from .showing import show ; show

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

from .notebook import install_jupyter_hooks
install_jupyter_hooks()
del install_jupyter_hooks
