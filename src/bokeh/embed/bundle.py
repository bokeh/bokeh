#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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

# Standard library imports
from typing import (
    Iterator,
    Sequence,
)

# Bokeh imports
from ..core.has_props import HasProps
from ..core.templates import CSS_RESOURCES, JS_RESOURCES
from ..document.document import Document
from ..resources import Hashes, Resources
from ..util.compiler import bundle_models
from .resources import (
    URL,
    _all_objs,
    _bundle_extensions,
    _use_gl,
    _use_mathjax,
    _use_tables,
    _use_widgets,
    extension_dirs,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Bundle',
    'bundle_for_objs_and_resources',
    'extension_dirs',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Artifact:
    pass

class ScriptRef(Artifact):
    def __init__(self, url: str, type: str | None = None) -> None:
        self.url = URL(url)
        self.type = type


class Script(Artifact):
    def __init__(self, content: str, type: str | None = None) -> None:
        self.content = content
        self.type = type


class StyleRef(Artifact):
    def __init__(self, url: str) -> None:
        self.url = URL(url)


class Style(Artifact):
    def __init__(self, content: str) -> None:
        self.content = content


class Bundle:

    js_files: list[URL]
    js_raw: list[str]
    css_files: list[URL]
    css_raw: list[str]
    hashes: Hashes

    def __init__(self, js_files: list[URL] = [], js_raw: list[str] = [],
            css_files: list[URL] = [], css_raw: list[str] = [], hashes: Hashes = {}):
        self.js_files = js_files[:]
        self.js_raw = js_raw[:]
        self.css_files = css_files[:]
        self.css_raw = css_raw[:]
        self.hashes = {**hashes}

    def __iter__(self) -> Iterator[str]:
        yield self._render_js()
        yield self._render_css()

    def _render_js(self) -> str:
        return JS_RESOURCES.render(js_files=self.js_files, js_raw=self.js_raw, hashes=self.hashes)

    def _render_css(self) -> str:
        return CSS_RESOURCES.render(css_files=self.css_files, css_raw=self.css_raw)

    def scripts(self, tag: bool = True) -> str:
        if tag:
            return JS_RESOURCES.render(js_raw=self.js_raw, js_files=[])
        else:
            return "\n".join(self.js_raw)

    @property
    def js_urls(self) -> list[URL]:
        return self.js_files

    @property
    def css_urls(self) -> list[URL]:
        return self.css_files

    def add(self, artifact: Artifact) -> None:
        if isinstance(artifact, ScriptRef):
            self.js_files.append(artifact.url)
        elif isinstance(artifact, Script):
            self.js_raw.append(artifact.content)
        elif isinstance(artifact, StyleRef):
            self.css_files.append(artifact.url)
        elif isinstance(artifact, Style):
            self.css_raw.append(artifact.content)

    def clone(self) -> Bundle:
        return Bundle(self.js_files, self.js_raw, self.css_files, self.css_raw, self.hashes)

def bundle_for_objs_and_resources(objs: Sequence[HasProps | Document] | None, resources: Resources | None) -> Bundle:
    ''' Generate rendered CSS and JS resources suitable for the given
    collection of Bokeh objects

    Args:
        objs (seq[HasProps or Document]) :

        resources (Resources)

    Returns:
        Bundle

    '''
    if objs is not None:
        all_objs    = _all_objs(objs)
        use_widgets = _use_widgets(all_objs)
        use_tables  = _use_tables(all_objs)
        use_gl      = _use_gl(all_objs)
        use_mathjax = _use_mathjax(all_objs)
    else:
        # XXX: force all components on server and in notebook, because we don't know in advance what will be used
        all_objs    = None
        use_widgets = True
        use_tables  = True
        use_gl      = True
        use_mathjax = True

    js_files: list[URL] = []
    js_raw: list[str] = []
    css_files: list[URL] = []
    css_raw: list[str] = []

    if resources is not None:
        components = list(resources.components)
        if not use_widgets: components.remove("bokeh-widgets")
        if not use_tables:  components.remove("bokeh-tables")
        if not use_gl:      components.remove("bokeh-gl")
        if not use_mathjax: components.remove("bokeh-mathjax")

        resources = resources.clone(components=components)

        js_files.extend(map(URL, resources.js_files))
        js_raw.extend(resources.js_raw)

        css_files.extend(map(URL, resources.css_files))
        css_raw.extend(resources.css_raw)

        extensions = _bundle_extensions(all_objs if objs else None, resources)
        mode = resources.mode
        if mode == "inline":
            js_raw.extend([ Resources._inline(bundle.artifact_path) for bundle in extensions ])
        elif mode == "server":
            js_files.extend([ bundle.server_url for bundle in extensions ])
        elif mode == "cdn":
            for bundle in extensions:
                if bundle.cdn_url is not None:
                    js_files.append(bundle.cdn_url)
                else:
                    js_raw.append(Resources._inline(bundle.artifact_path))
        else:
            js_files.extend([ URL(str(bundle.artifact_path)) for bundle in extensions ])

    models = [ obj.__class__ for obj in all_objs ] if all_objs else None
    ext = bundle_models(models)
    if ext is not None:
        js_raw.append(ext)

    return Bundle(js_files, js_raw, css_files, css_raw, resources.hashes if resources else {})
