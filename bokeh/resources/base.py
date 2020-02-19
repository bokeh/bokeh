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
from abc import ABC, abstractmethod
from typing import Callable, Iterator, List, NamedTuple, Optional, Set, Tuple, Type, TypeVar, TYPE_CHECKING, Union
from typing_extensions import Literal

# Bokeh imports
from ..settings import settings
from ..util.functions import list_of
from .artifacts import Artifact
from .assets import Bundle, Asset, Script, ScriptLink, StyleLink

if TYPE_CHECKING:
    from ..model import Model

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

LogLevel = Literal["trace", "debug", "info", "warn", "error", "fatal"]
Kind = Literal["js", "css"]

class Message(NamedTuple):
    type: str
    text: str

class Urls(NamedTuple):
    urls: Callable[[List[str], Kind], List[str]]
    messages: List[Message] = []

Resource = Union[Asset, Artifact]
Resolver = Callable[[], Asset]

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class Resources(ABC):
    """ The Resources class encapsulates information relating to loading or
    embedding Bokeh Javascript and CSS.

    Args:

        version (str, optional) : what version of Bokeh JS and CSS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading Bokeh JS and CSS assets

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        js_raw : any raw JS that needs to be placed inside ``<script>`` tags
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        js_files : URLs of any JS files that need to be loaded by ``<script>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    """

    mode: str
    dev: bool = False

    _log_level: Optional[LogLevel]

    def __init__(self, *,
            dev: Optional[bool] = None,
            legacy: Optional[bool] = None,
            log_level: Optional[LogLevel] = None) -> None:
        self.legacy = settings.legacy(legacy)
        self.log_level = settings.log_level(log_level)

    @abstractmethod
    def __call__(self, *, dev: Optional[bool] = None, legacy: Optional[bool] = None) -> "Resources":
        pass

    def collect(self, objs: List[Union["Model", Type["Model"]]]) -> List[Resource]:
        from ..model import Model

        Resource = Union[Asset, Artifact]

        visited_types: Set[Type["Model"]] = set()
        visited: Set[Resource] = set()
        collected: List[Resource] = []

        def push(resource: Resource) -> None:
            if resource not in visited:
                visited.add(resource)
                collected.append(resource)

        for obj in sorted(objs, key=lambda obj: obj.__qualified_model__):
            obj_type = obj if isinstance(obj, type) else obj.__class__
            obj_inst = obj if not isinstance(obj, type) else None

            if obj_type not in visited_types:
                for obj_subtype in reversed(obj_type.mro()):
                    if issubclass(obj_subtype, Model) and obj_subtype not in visited_types:
                        visited_types.add(obj_subtype)

                        obj = obj_subtype
                        for resource in obj.__dict__.get("__resources__", []):
                            if isinstance(resource, tuple):
                                (asset, condition) = resource
                                if obj_inst is None or condition(obj_inst):
                                    push(asset)
                            else:
                                push(resource)

                        for url in list_of(obj.__dict__.get("__css__", [])):
                            push(StyleLink(url))

                        for url in list_of(obj.__dict__.get("__javascript__", [])):
                            push(ScriptLink(url))

        return collected

    def expand(self, collection: List[Resource]) -> List[Resource]:
        expanded: List[Resource] = []
        visited: Set[Artifact] = set()

        def descend(artifact: Artifact) -> None:
            if artifact not in visited:
                for dep in artifact.depends:
                    descend(dep)
                expanded.append(artifact)

        for obj in collection:
            if isinstance(obj, Asset):
                expanded.append(obj)
            else:
                descend(obj)

        return expanded

    def resolve(self, objs: Optional[List[Union["Model", Type["Model"]]]] = None) -> Bundle:
        from ..model import Model

        models: List[Union["Model", Type["Model"]]] = objs if objs is not None else Model.all_models()
        collection = self.expand(self.collect(models))

        bundle = Bundle()
        for obj in collection:
            if isinstance(obj, Asset):
                bundle.add(obj)
            else:
                bundle.add(*self._resolve(obj))

        if self.log_level is not None:
            bundle.add(Script(f"Bokeh.set_log_level('{self.log_level}');"))
        if self.dev:
            bundle.add(Script("Bokeh.settings.dev = true;"))

        return bundle

    @abstractmethod
    def _resolve(self, artifact: Artifact) -> List[Asset]:
        pass

    @property
    def log_level(self) -> Optional[LogLevel]:
        return self._log_level

    @log_level.setter
    def log_level(self, level: Optional[LogLevel]) -> None:
        valid_levels = ["trace", "debug", "info", "warn", "error", "fatal"]
        if not (level is None or level in valid_levels):
            raise ValueError(f"Unknown log level '{level}', valid levels are: {','.join(valid_levels)}")
        self._log_level = level
