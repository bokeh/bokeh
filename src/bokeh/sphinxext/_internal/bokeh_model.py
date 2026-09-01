# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" Thoroughly document Bokeh model classes.

The ``bokeh-model`` directive will automatically document all the attributes
(including Bokeh properties) of a Bokeh Model subclass. A JSON prototype showing
all the possible JSON fields will also be generated.

This directive takes the name of a Bokeh model class as an argument and its
module as an option:

.. code-block:: rest

    .. bokeh-model:: SomeModel

The ``bokeh_model_excluded_members`` Sphinx configuration value controls member
names omitted from every model page.

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

from sphinx.util import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import importlib
import inspect
import json
import warnings
from collections.abc import Collection
from heapq import nlargest
from os import getenv
from time import perf_counter
from typing import Any, NamedTuple, cast

# External imports
from docutils.parsers.rst.directives import unchanged
from sphinx import addnodes
from sphinx.errors import SphinxError

# Bokeh imports
from bokeh.core.property.descriptors import AliasPropertyDescriptor, PropertyDescriptor
from bokeh.core.property.singletons import Undefined
from bokeh.core.serialization import AnyRep, Serializer, SymbolRep
from bokeh.model import Model
from bokeh.util.warnings import BokehDeprecationWarning

# Bokeh imports
from . import PARALLEL_SAFE, SphinxParallelSpec
from .bokeh_directive import BokehDirective, py_sig_re
from .bokeh_prop import _render_property_detail
from .templates import MODEL_DETAIL, PROP_DETAIL

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

__all__ = (
    "BokehModelDirective",
    "setup",
)

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


class BokehModelDirective(BokehDirective):

    has_content = True
    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True
    option_spec = {
        "module": unchanged,
        "canonical": unchanged,
    }

    def run(self) -> list[Any]:

        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError(f"Unable to parse signature for bokeh-model: {sig!r}")
        model_name = m.group(1)

        if getenv("BOKEH_SPHINX_QUICK") == "1":
            return self.parse(f"{model_name}\n{'-'*len(model_name)}\n", f"<bokeh-model: {model_name}>")

        started = perf_counter()
        module_name = self.options["module"]

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError(f"Unable to generate model reference docs for {model_name}, couldn't import module {module_name}")

        model = getattr(module, model_name, None)
        if model is None:
            raise SphinxError(f"Unable to generate model reference docs: no model for {model_name} in module {module_name}")

        if not issubclass(model, Model):
            raise SphinxError(f"Unable to generate model reference docs: {model_name}, is not a subclass of Model")

        # We may need to instantiate deprecated objects as part of documenting
        # them in the reference guide. Suppress any warnings here to keep the
        # docs build clean just for this case
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
            model_obj = model()

        model_json = json.dumps(to_json_rep(model_obj), sort_keys=True, indent=2, separators=(", ", ": "))

        # we only want to document things as coming from top-level `bokeh.models`
        adjusted_module_name = "bokeh.models" if module_name.startswith("bokeh.models") else module_name

        properties, python_properties, methods = _model_members(
            model,
            excluded_members=self.config.bokeh_model_excluded_members,
        )
        property_details = [
            _render_property_detail(model_obj, f"{model_name}.{name}", adjusted_module_name)
            for name in properties
        ]

        rst_text = MODEL_DETAIL.render(
            name=model_name,
            module_name=adjusted_module_name,
            model_json=model_json,
            methods=methods,
            property_details=property_details,
            property_names=properties + python_properties,
            python_properties=python_properties,
        )
        rendered = perf_counter()

        for template in (MODEL_DETAIL, PROP_DETAIL):
            if template.filename is not None:
                self.env.note_dependency(template.filename)

        parsed = self.parse(rst_text, f"<bokeh-model: {model_name}>")
        parsed_at = perf_counter()
        _shorten_member_signatures(
            parsed,
            module_name=adjusted_module_name,
            model_name=model_name,
        )
        finished = perf_counter()
        env = cast(Any, self.env)
        env.bokeh_model_timings.append(_ModelTiming(
            total=finished - started,
            generate=rendered - started,
            parse=parsed_at - rendered,
            post_process=finished - parsed_at,
            docname=env.docname,
            model_name=model_name,
        ))
        return parsed


def setup(app: Any) -> SphinxParallelSpec:
    """ Required Sphinx extension setup function. """
    app.add_config_value(
        "bokeh_model_excluded_members",
        tuple(sorted(_DEFAULT_EXCLUDED_MEMBERS)),
        "env",
        types=(list, tuple, set, frozenset),
    )
    app.add_directive_to_domain("py", "bokeh-model", BokehModelDirective)
    app.connect("builder-inited", _builder_inited)
    app.connect("env-merge-info", _env_merge_info)
    app.connect("build-finished", _build_finished)

    return PARALLEL_SAFE

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_DEFAULT_EXCLUDED_MEMBERS = frozenset({
    "js_event_callbacks",
    "js_property_callbacks",
    "subscribed_events",
})


class _ModelTiming(NamedTuple):
    total: float
    generate: float
    parse: float
    post_process: float
    docname: str
    model_name: str


def _builder_inited(app: Any) -> None:
    app.env.bokeh_model_timings = []


def _env_merge_info(app: Any, env: Any, docnames: list[str], other: Any) -> None:
    docnames_set = set(docnames)
    env.bokeh_model_timings.extend(item for item in other.bokeh_model_timings if item.docname in docnames_set)


def _build_finished(app: Any, exception: Exception | None) -> None:
    timings = app.env.bokeh_model_timings
    if not timings:
        return

    total_seconds = sum(item.total for item in timings)
    generate_seconds = sum(item.generate for item in timings)
    parse_seconds = sum(item.parse for item in timings)
    post_process_seconds = sum(item.post_process for item in timings)
    log.info(
        f"Bokeh model timings: directives={len(timings)} total={total_seconds:.3f}s "
        f"generate={generate_seconds:.3f}s parse={parse_seconds:.3f}s "
        f"post-process={post_process_seconds:.3f}s",
    )
    for timing in nlargest(5, timings, key=lambda timing: timing.total):
        log.info(
            f"Bokeh model slow: total={timing.total:.3f}s generate={timing.generate:.3f}s "
            f"parse={timing.parse:.3f}s post-process={timing.post_process:.3f}s "
            f"{timing.docname} ({timing.model_name})",
        )


def _shorten_member_signatures(
    parsed: list[Any],
    *,
    module_name: str,
    model_name: str,
) -> None:
    """Remove the redundant class prefix from model member display names.

    The full object IDs and Python-domain registrations are left unchanged so
    links and intersphinx inventory entries remain fully qualified. Updating
    the parsed signature nodes also gives the page-local table of contents the
    shortened display names.
    """
    member_id_prefix = f"{module_name}.{model_name}."
    display_prefix = f"{model_name}."

    for root in parsed:
        for signature in root.findall(addnodes.desc_signature):
            if not any(identifier.startswith(member_id_prefix) for identifier in signature.get("ids", ())):
                continue

            for child in tuple(signature.children):
                if isinstance(child, addnodes.desc_addname) and child.astext() == display_prefix:
                    signature.remove(child)

            toc_name = signature.get("_toc_name", "")
            if toc_name.startswith(display_prefix):
                signature["_toc_name"] = toc_name.removeprefix(display_prefix)


def _model_members(
    model: type[Model],
    *,
    excluded_members: Collection[str] = _DEFAULT_EXCLUDED_MEMBERS,
) -> tuple[list[str], list[str], list[str]]:
    """Return documented Bokeh properties, Python properties, and methods."""
    properties: list[str] = []
    python_properties: list[str] = []
    methods: list[str] = []

    for name, member in inspect.getmembers_static(model):
        if name.startswith("_") or name in excluded_members:
            continue
        if isinstance(member, (AliasPropertyDescriptor, PropertyDescriptor)):
            properties.append(name)
        elif isinstance(member, property) and inspect.getdoc(member) is not None:
            python_properties.append(name)
        elif inspect.isroutine(member) and inspect.getdoc(member) is not None:
            methods.append(name)

    return properties, python_properties, methods


class DocsSerializer(Serializer):

    def _encode(self, obj: Any) -> AnyRep:
        if obj is Undefined:
            return SymbolRep(type="symbol", name="unset")
        else:
            return super()._encode(obj)

def to_json_rep(obj: Model) -> dict[str, AnyRep]:
    serializer = DocsSerializer()

    properties = obj.properties_with_values(include_defaults=True, include_undefined=True)
    attributes = {key: serializer.encode(val) for key, val in properties.items()}

    return dict(id=obj.id, **attributes)

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
