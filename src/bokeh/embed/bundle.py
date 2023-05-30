#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
import hashlib
import json
from dataclasses import dataclass
from os.path import (
    abspath,
    basename,
    dirname,
    exists,
    join,
    normpath,
)
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Callable,
    Iterator,
    Sequence,
    TypedDict,
)

# Bokeh imports
from ..core.templates import CSS_RESOURCES, JS_RESOURCES
from ..document.document import Document
from ..model import Model
from ..resources import Resources
from ..settings import settings
from ..util.compiler import bundle_models
from .util import contains_tex_string, is_tex_string

if TYPE_CHECKING:
    from typing_extensions import NotRequired

    from ..resources import Hashes

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Bundle',
    'bundle_for_objs_and_resources',
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
    def __init__(self, url: str, type: str = "text/javascript") -> None:
        self.url = url
        self.type = type


class Script(Artifact):
    def __init__(self, content: str, type: str = "text/javascript") -> None:
        self.content = content
        self.type = type


class StyleRef(Artifact):
    def __init__(self, url: str) -> None:
        self.url = url


class Style(Artifact):
    def __init__(self, content: str) -> None:
        self.content = content


class Bundle:

    js_files: list[str]
    js_raw: list[str]
    css_files: list[str]
    css_raw: list[str]
    hashes: Hashes

    def __init__(self, js_files: list[str] = [], js_raw: list[str] = [],
            css_files: list[str] = [], css_raw: list[str] = [], hashes: Hashes = {}):
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
    def js_urls(self) -> list[str]:
        return self.js_files

    @property
    def css_urls(self) -> list[str]:
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

def bundle_for_objs_and_resources(objs: Sequence[Model | Document] | None, resources: Resources | None) -> Bundle:
    ''' Generate rendered CSS and JS resources suitable for the given
    collection of Bokeh objects

    Args:
        objs (seq[Model or Document]) :

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

    js_files: list[str] = []
    js_raw: list[str] = []
    css_files: list[str] = []
    css_raw: list[str] = []

    if resources is not None:
        components = list(resources.components)
        if not use_widgets: components.remove("bokeh-widgets")
        if not use_tables:  components.remove("bokeh-tables")
        if not use_gl:      components.remove("bokeh-gl")
        if not use_mathjax: components.remove("bokeh-mathjax")

        resources = resources.clone(components=components)

        js_files.extend(resources.js_files)
        js_raw.extend(resources.js_raw)

        css_files.extend(resources.css_files)
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
            js_files.extend([ bundle.artifact_path for bundle in extensions ])

    models = [ obj.__class__ for obj in all_objs ] if all_objs else None
    ext = bundle_models(models)
    if ext is not None:
        js_raw.append(ext)

    return Bundle(js_files, js_raw, css_files, css_raw, resources.hashes if resources else {})

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _query_extensions(all_objs: set[Model], query: Callable[[type[Model]], bool]) -> bool:
    names: set[str] = set()

    for obj in all_objs:
        if hasattr(obj, "__implementation__"):
            continue
        name = obj.__view_module__.split(".")[0]
        if name == "bokeh":
            continue
        if name in names:
            continue
        names.add(name)

        for model in Model.model_class_reverse_map.values():
            if model.__module__.startswith(name):
                if query(model):
                    return True

    return False

_default_cdn_host = "https://unpkg.com"

@dataclass(frozen=True)
class ExtensionEmbed:
    artifact_path: str
    server_url: str
    cdn_url: str | None = None

class Pkg(TypedDict):
    name: NotRequired[str]
    version: NotRequired[str]
    module: NotRequired[str]
    main: NotRequired[str]

extension_dirs: dict[str, Path] = {}

def _bundle_extensions(objs: set[Model] | None, resources: Resources) -> list[ExtensionEmbed]:
    names: set[str] = set()
    bundles: list[ExtensionEmbed] = []

    extensions = [".min.js", ".js"] if resources.minified else [".js"]

    all_objs = objs if objs is not None else Model.model_class_reverse_map.values()

    for obj in all_objs:
        if hasattr(obj, "__implementation__"):
            continue
        name = obj.__view_module__.split(".")[0]
        if name == "bokeh":
            continue
        if name in names:
            continue
        names.add(name)
        module = __import__(name)
        this_file = abspath(module.__file__)
        base_dir = dirname(this_file)
        dist_dir = join(base_dir, "dist")

        ext_path = join(base_dir, "bokeh.ext.json")
        if not exists(ext_path):
            continue

        server_prefix = f"{resources.root_url}static/extensions"
        package_path = join(base_dir, "package.json")

        pkg: Pkg | None = None
        if exists(package_path):
            with open(package_path) as io:
                try:
                    pkg = json.load(io)
                except json.decoder.JSONDecodeError:
                    pass

        artifact_path: str
        server_url: str
        cdn_url: str | None = None

        if pkg is not None:
            pkg_name: str | None = pkg.get("name", None)
            if pkg_name is None:
                raise ValueError("invalid package.json; missing package name")
            pkg_version = pkg.get("version", "latest")
            pkg_main = pkg.get("module", pkg.get("main", None))
            if pkg_main is not None:
                cdn_url = f"{_default_cdn_host}/{pkg_name}@{pkg_version}/{pkg_main}"
            else:
                pkg_main = join(dist_dir, f"{name}.js")
            artifact_path = join(base_dir, normpath(pkg_main))
            artifacts_dir = dirname(artifact_path)
            artifact_name = basename(artifact_path)
            server_path = f"{name}/{artifact_name}"
            if not settings.dev:
                sha = hashlib.sha256()
                sha.update(pkg_version.encode())
                vstring = sha.hexdigest()
                server_path = f"{server_path}?v={vstring}"
        else:
            for ext in extensions:
                artifact_path = join(dist_dir, f"{name}{ext}")
                artifacts_dir = dist_dir
                server_path = f"{name}/{name}{ext}"
                if exists(artifact_path):
                    break
            else:
                raise ValueError(f"can't resolve artifact path for '{name}' extension")

        extension_dirs[name] = Path(artifacts_dir)
        server_url = f"{server_prefix}/{server_path}"
        embed = ExtensionEmbed(artifact_path, server_url, cdn_url)
        bundles.append(embed)

    return bundles

def _all_objs(objs: Sequence[Model | Document]) -> set[Model]:
    all_objs: set[Model] = set()

    for obj in objs:
        if isinstance(obj, Document):
            for root in obj.roots:
                all_objs |= root.references()
        else:
            all_objs |= obj.references()

    return all_objs

def _any(objs: set[Model], query: Callable[[Model], bool]) -> bool:
    ''' Whether any of a collection of objects satisfies a given query predicate

    Args:
        objs (set[Model]) :

        query (callable)

    Returns:
        True, if ``query(obj)`` is True for some object in ``objs``, else False

    '''

    return any(query(x) for x in objs)

def _use_tables(all_objs: set[Model]) -> bool:
    ''' Whether a collection of Bokeh objects contains a TableWidget

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.widgets import TableWidget
    return _any(all_objs, lambda obj: isinstance(obj, TableWidget)) or _ext_use_tables(all_objs)

def _use_widgets(all_objs: set[Model]) -> bool:
    ''' Whether a collection of Bokeh objects contains a any Widget

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.widgets import Widget
    return _any(all_objs, lambda obj: isinstance(obj, Widget)) or _ext_use_widgets(all_objs)

def _model_requires_mathjax(model: Model) -> bool:
    """Whether a model requires MathJax to be loaded
    Args:
        model (Model): Model to check
    Returns:
        bool: True if MathJax required, False if not
    """
    from ..models.annotations import TextAnnotation
    from ..models.axes import Axis
    from ..models.widgets.markups import Div, Paragraph
    from ..models.widgets.sliders import AbstractSlider

    if isinstance(model, TextAnnotation):
        if isinstance(model.text, str) and is_tex_string(model.text):
            return True

    if isinstance(model, AbstractSlider):
        if isinstance(model.title, str) and is_tex_string(model.title):
            return True

    if isinstance(model, Axis):
        if isinstance(model.axis_label, str) and is_tex_string(model.axis_label):
            return True

        for val in model.major_label_overrides.values():
            if isinstance(val, str) and is_tex_string(val):
                return True

    if isinstance(model, Div) and not model.disable_math and not model.render_as_text:
        if contains_tex_string(model.text):
            return True

    if isinstance(model, Paragraph) and not model.disable_math:
        if contains_tex_string(model.text):
            return True

    return False

def _use_mathjax(all_objs: set[Model]) -> bool:
    ''' Whether a collection of Bokeh objects contains a model requesting MathJax
    Args:
        objs (seq[Model or Document]) :
    Returns:
        bool
    '''
    from ..models.text import MathText

    return _any(all_objs, lambda obj: isinstance(obj, MathText) or _model_requires_mathjax(obj)) or _ext_use_mathjax(all_objs)

def _use_gl(all_objs: set[Model]) -> bool:
    ''' Whether a collection of Bokeh objects contains a plot requesting WebGL

    Args:
        objs (seq[Model or Document]) :

    Returns:
        bool

    '''
    from ..models.plots import Plot
    return _any(all_objs, lambda obj: isinstance(obj, Plot) and obj.output_backend == "webgl")

def _ext_use_tables(all_objs: set[Model]) -> bool:
    from ..models.widgets import TableWidget
    return _query_extensions(all_objs, lambda cls: issubclass(cls, TableWidget))

def _ext_use_widgets(all_objs: set[Model]) -> bool:
    from ..models.widgets import Widget
    return _query_extensions(all_objs, lambda cls: issubclass(cls, Widget))

def _ext_use_mathjax(all_objs: set[Model]) -> bool:
    from ..models.text import MathText
    return _query_extensions(all_objs, lambda cls: issubclass(cls, MathText))
#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
