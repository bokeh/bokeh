#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Simplify linking to versioned BokehJS CDN urls.

This module provides a Sphinx role that can be used to easily link to various
BokehJS releases:

``:bokehjs-link:`` : BokehJS file

Examples
--------

The following code:

.. code-block:: rest

    The current version of BokehJS widgets and tables can be
    downloaded at: 
    * :bokehjs-link:`bokeh-widgets`
    * :bokehjs-link:`bokeh-tables`

yields the output:

The current version of BokehJS widgets and tables can be
downloaded at: 
* :bokehjs-link:`bokeh-widgets`
* :bokehjs-link:`bokeh-tables`

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from docutils import nodes
from docutils.parsers.rst.roles import set_classes

# Bokeh imports
from .util import get_sphinx_resources

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokehjs_link',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


def bokehjs_link(name, rawtext, text, lineno, inliner, options=None, content=None):
    ''' Download link to versioned BokehJS CDN url.

    Returns 2 part tuple containing list of nodes to insert into the
    document and a list of system messages.  Both are allowed to be
    empty.

    '''
    resources = get_sphinx_resources(include_bokehjs_api=True)

    js_files = resources.js_files

    if text == 'bokeh':
        url = js_files[0]
    elif text == 'bokeh-widgets':
        url = js_files[1]
    elif text == 'bokeh-tables':
        url = js_files[2]
    elif text == 'bokeh-gl':
        url = js_files[3]
    elif text == 'bokeh-api':
        url = js_files[4]

    options = options or {}
    set_classes(options)
    node = nodes.reference(rawtext, url, refuri=url, **options)
    return [node], []

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_role('bokehjs-link', bokehjs_link)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
