#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Thoroughly document Bokeh settings.

The ``bokeh-model`` directive will automatically document all the attributes
(including Bokeh PrioritizedSettings) of an object.

This directive takes the name of a module attribute

.. code-block:: rest

    .. bokeh-settings:: settings
        :module: bokeh.settings

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import importlib

# External imports
from docutils.parsers.rst.directives import unchanged

from sphinx.errors import SphinxError

# Bokeh imports
from ..settings import PrioritizedSetting
from .bokeh_directive import BokehDirective, py_sig_re
from .templates import SETTINGS_DETAIL

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BokehSettingsDirective',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class BokehSettingsDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 1
    option_spec = {
        'module': unchanged
    }

    def run(self):
        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError("Unable to parse signature for bokeh-model: %r" % sig)
        name_prefix, obj_name, arglist, retann = m.groups()

        module_name = self.options['module']

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError("Unable to generate reference docs for %s, couldn't import module '%s'" % (obj_name, module_name))

        obj = getattr(module, obj_name, None)
        if obj is None:
            raise SphinxError("Unable to generate reference docs for %s, no model '%s' in %s" % (obj_name, obj_name, module_name))

        settings = [x.__dict__ for x in obj.__class__.__dict__.values() if isinstance(x, PrioritizedSetting)]

        rst_text = SETTINGS_DETAIL.render(
            name=obj_name,
            module_name=module_name,
            settings=settings
        )

        return self._parse(rst_text, "<bokeh-settings>")

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_directive_to_domain('py', 'bokeh-settings', BokehSettingsDirective)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
