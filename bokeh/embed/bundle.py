#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import dirname, exists, join
from typing import Optional, Sequence, Union

# Bokeh imports
from ..document.document import Document
from ..model import Model
from ..resources import Resources
from ..settings import settings
from ..util.compiler import bundle_models

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

collect_artifacts(Model.all_models())

def collect_artifacts(objects: Optional[Union[Sequence[Type[Model]], Sequence[Union[Model, Document]]]]) -> List[Artifact]:
    for model in models:


def bundle_for_objs_and_resources(objs: Optional[Sequence[Union[Model, Document]]], resources: Optional[Resources]):
    ''' Generate rendered CSS and JS resources suitable for the given
    collection of Bokeh objects

    Args:
        objs (seq[Model or Document]) :

        resources (Resources)

    Returns:
        Bundle

    '''
    # Any env vars will overide a local default passed in
    resources = settings.resources(default=resources)
    if isinstance(resources, str):
        resources = Resources(mode=resources)

    from copy import deepcopy

    # XXX: force all components on server and in notebook, because we don't know in advance what will be used
    use_widgets = _use_widgets(objs) if objs else True
    use_tables  = _use_tables(objs)  if objs else True
    use_gl      = _use_gl(objs)      if objs else True

    js_files = []
    js_raw = []
    css_files = []
    css_raw = []

    if resources:
        resources = deepcopy(resources)
        if not use_widgets and "bokeh-widgets" in resources.js_components:
            resources.js_components.remove("bokeh-widgets")
        if not use_tables and "bokeh-tables" in resources.js_components:
            resources.js_components.remove("bokeh-tables")
        if not use_gl and "bokeh-gl" in resources.js_components:
            resources.js_components.remove("bokeh-gl")

        js_files.extend(resources.js_files)
        js_raw.extend(resources.js_raw)

        css_files.extend(resources.css_files)
        css_raw.extend(resources.css_raw)

    js_raw.extend(_bundle_extensions(objs, resources))

    models = [ obj.__class__ for obj in _all_objs(objs) ] if objs else None
    ext = bundle_models(models)
    if ext is not None:
        js_raw.append(ext)

    return Bundle.of(js_files, js_raw, css_files, css_raw)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _query_extensions(objs, query):
    names = set()

    for obj in _all_objs(objs):
        if hasattr(obj, "__implementation__"):
            continue
        name = obj.__view_module__.split(".")[0]
        if name == "bokeh":
            continue
        if name in names:
            continue
        names.add(name)

        for model in Model.all_models():
            if model.__module__.startswith(name):
                if query(model):
                    return True

    return False

def _bundle_extensions(objs, resources):
    names = set()
    extensions = []

    for obj in _all_objs(objs) if objs is not None else Model.all_models():
        if hasattr(obj, "__implementation__"):
            continue
        name = obj.__view_module__.split(".")[0]
        if name == "bokeh":
            continue
        if name in names:
            continue
        names.add(name)
        module = __import__(name)
        ext = ".min.js" if resources is None or resources.minified else ".js"
        artifact = join(dirname(module.__file__), "dist", name + ext)
        if exists(artifact):
            bundle = Resources._inline(artifact)
            extensions.append(bundle)

    return extensions

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
    return _any(objs, lambda obj: isinstance(obj, TableWidget)) or _ext_use_tables(objs)

def _use_widgets(objs):
    ''' Whether a collection of Bokeh objects contains a any Widget

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.widgets import Widget
    return _any(objs, lambda obj: isinstance(obj, Widget)) or _ext_use_widgets(objs)

def _ext_use_tables(objs):
    from ..models.widgets import TableWidget
    return _query_extensions(objs, lambda cls: issubclass(cls, TableWidget))

def _ext_use_widgets(objs):
    from ..models.widgets import Widget
    return _query_extensions(objs, lambda cls: issubclass(cls, Widget))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
