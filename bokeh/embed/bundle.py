#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from warnings import warn

# External imports

# Bokeh imports
from ..document.document import Document
from ..resources import BaseResources
from ..util.compiler import bundle_models
from .wrappers import wrap_in_script_tag

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bundle_for_objs_and_resources',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def bundle_for_objs_and_resources(objs, resources):
    ''' Generate rendered CSS and JS resources suitable for the given
    collection of Bokeh objects

    Args:
        objs (seq[Model or Document]) :

        resources (BaseResources or tuple[BaseResources])

    Returns:
        tuple

    '''
    if isinstance(resources, BaseResources):
        js_resources = css_resources = resources
    elif isinstance(resources, tuple) and len(resources) == 2 and all(r is None or isinstance(r, BaseResources) for r in resources):
        js_resources, css_resources = resources

        if js_resources and not css_resources:
            warn('No Bokeh CSS Resources provided to template. If required you will need to provide them manually.')

        if css_resources and not js_resources:
            warn('No Bokeh JS Resources provided to template. If required you will need to provide them manually.')
    else:
        raise ValueError("expected Resources or a pair of optional Resources, got %r" % resources)

    from copy import deepcopy

    # XXX: force all components on server and in notebook, because we don't know in advance what will be used
    use_widgets = _use_widgets(objs) if objs else True
    use_tables  = _use_tables(objs)  if objs else True
    use_gl      = _use_gl(objs)      if objs else True

    if js_resources:
        js_resources = deepcopy(js_resources)
        if not use_widgets and "bokeh-widgets" in js_resources.js_components:
            js_resources.js_components.remove("bokeh-widgets")
        if not use_tables and "bokeh-tables" in js_resources.js_components:
            js_resources.js_components.remove("bokeh-tables")
        if not use_gl and "bokeh-gl" in js_resources.js_components:
            js_resources.js_components.remove("bokeh-gl")
        bokeh_js = js_resources.render_js()
    else:
        bokeh_js = None

    models = [ obj.__class__ for obj in _all_objs(objs) ] if objs else None
    custom_bundle = bundle_models(models)

    if custom_bundle is not None:
        custom_bundle = wrap_in_script_tag(custom_bundle)

        if bokeh_js is not None:
            bokeh_js += "\n" + custom_bundle
        else:
            bokeh_js = custom_bundle

    if css_resources:
        css_resources = deepcopy(css_resources)
        if not use_widgets and "bokeh-widgets" in css_resources.css_components:
            css_resources.css_components.remove("bokeh-widgets")
        if not use_tables and "bokeh-tables" in css_resources.css_components:
            css_resources.css_components.remove("bokeh-tables")
        bokeh_css = css_resources.render_css()
    else:
        bokeh_css = None

    return bokeh_js, bokeh_css

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _all_objs(objs):
    all_objs = set()

    for obj in objs:
        if isinstance(obj, Document):
            for root in obj.roots:
                all_objs |= root.references()
        else:
            all_objs |= obj.references()

    return all_objs

def _any(objs, query):
    ''' Whether any of a collection of objects satisfies a given query predicate

    Args:
        objs (seq[Model or Document]) :

        query (callable)

    Returns:
        True, if ``query(obj)`` is True for some object in ``objs``, else False

    '''
    for obj in objs:
        if isinstance(obj, Document):
            if _any(obj.roots, query):
                return True
        else:
            if any(query(ref) for ref in obj.references()):
                return True
    else:
        return False

def _use_gl(objs):
    ''' Whether a collection of Bokeh objects contains a plot requesting WebGL

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.plots import Plot
    return _any(objs, lambda obj: isinstance(obj, Plot) and obj.output_backend == "webgl")

def _use_tables(objs):
    ''' Whether a collection of Bokeh objects contains a TableWidget

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.widgets import TableWidget
    return _any(objs, lambda obj: isinstance(obj, TableWidget))

def _use_widgets(objs):
    ''' Whether a collection of Bokeh objects contains a any Widget

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.widgets import Widget
    return _any(objs, lambda obj: isinstance(obj, Widget))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
