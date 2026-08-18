from __future__ import annotations

# Standard library imports
import inspect
import posixpath
from io import StringIO
from pathlib import Path
from typing import Any, cast

# External imports
from sphinx.application import Sphinx
from sphinx.util.inventory import InventoryFile

# Bokeh imports
import bokeh.models as models
from bokeh.core.has_props import HasProps, Local
from bokeh.core.properties import (
    Either,
    Enum,
    Include,
    Instance,
    Int,
    Nullable,
    String,
)
from bokeh.model import Model
from bokeh.models import BoxSelectTool, Filter
from bokeh.sphinxext._internal.bokeh_model import (
    _DEFAULT_EXCLUDED_MEMBERS,
    _model_members,
)
from bokeh.sphinxext._internal.bokeh_prop import _render_property_detail
from bokeh.sphinxext._internal.templates import MODEL_DETAIL


class _MemberBase(Model):
    base_value = Int()

    @property
    def python_property(self) -> int:
        """A documented Python property."""
        return 1

    def inherited_method(self) -> None:
        """A documented inherited method."""

    @classmethod
    def class_method(cls) -> None:
        """A documented class method."""

    @staticmethod
    def static_method() -> None:
        """A documented static method."""

    def undocumented_method(self) -> None:
        pass


class _MemberChild(_MemberBase):
    child_value = Int()

    def inherited_method(self) -> None:
        """A documented override."""


class _LinkedModel(Model):
    pass


class _PropertyDetailModel(Model):
    mixed_help = String(help="""
    Standalone help text.

Unindented suffix text.
    """)

    complex_type = Nullable(Either(
        Instance(f"{__name__}._LinkedModel"),
        Enum("auto"),
    ))


class _IncludeDelegate(HasProps, Local):
    value = Int(help="Original value documentation.")


class _IncludeBase(HasProps, Local):
    values = Include(_IncludeDelegate, help="{model}.{name} provides its {prop}. {doc}")


class _IncludeChild(_IncludeBase):
    pass


def test_model_members_separate_properties_and_methods() -> None:
    properties, python_properties, methods = _model_members(Filter)

    assert properties == ["name", "syncable", "tags"]
    assert python_properties == ["document"]
    assert "apply_theme" in methods
    assert "properties_with_values" in methods
    assert "js_event_callbacks" not in properties


def test_model_members_handle_inheritance_and_method_kinds() -> None:
    properties, python_properties, methods = _model_members(_MemberChild)

    assert properties == sorted(properties)
    assert {"base_value", "child_value"} <= set(properties)
    assert "python_property" in python_properties
    assert {"class_method", "inherited_method", "static_method"} <= set(methods)
    assert "undocumented_method" not in methods


def test_model_members_support_global_exclusions() -> None:
    properties, _, _ = _model_members(Filter, excluded_members={"name", "tags"})

    assert "name" not in properties
    assert "tags" not in properties
    assert "js_event_callbacks" in properties


def test_all_documented_model_members_are_classified() -> None:
    model_classes = {
        member
        for member in vars(models).values()
        if inspect.isclass(member) and issubclass(member, Model)
    }

    for model in model_classes:
        properties, python_properties, methods = _model_members(model)
        classified = set(properties) | set(python_properties) | set(methods)
        documented = set()

        for name, member in inspect.getmembers_static(model):
            if name.startswith("_") or name in _DEFAULT_EXCLUDED_MEMBERS:
                continue
            doc = inspect.getdoc(member)
            if doc is not None and doc != inspect.getdoc(type(member)):
                documented.add(name)

        assert documented <= classified, f"Unclassified documented members on {model.__name__}: {documented - classified}"
        assert not classified.intersection(_DEFAULT_EXCLUDED_MEMBERS)


def test_property_detail_preserves_default_type_and_help() -> None:
    detail = _render_property_detail(Filter(), "Filter.name", "bokeh.models")

    assert ".. attribute:: Filter.name" in detail
    assert ":annotation: = None" in detail
    assert ":Type: :class:`~bokeh.core.properties.Nullable`" in detail
    assert "An arbitrary, user-supplied name for this model." in detail


def test_property_detail_normalizes_mixed_help_indentation() -> None:
    detail = _render_property_detail(_PropertyDetailModel(), "_PropertyDetailModel.mixed_help", __name__)

    assert "\n    Standalone help text." in detail
    assert "\n        Standalone help text." not in detail
    assert "\n    Unindented suffix text." in detail


def test_property_detail_specializes_inherited_include_help() -> None:
    detail = _render_property_detail(_IncludeChild(), "_IncludeChild.value", __name__)

    assert "_IncludeChild.value provides its value. Original value documentation." in detail
    assert "_IncludeBase.value" not in detail


def test_property_detail_resolves_string_instance_types() -> None:
    detail = _render_property_detail(_PropertyDetailModel(), "_PropertyDetailModel.complex_type", __name__)
    target = f"{__name__}._LinkedModel"

    assert f":class:`~{target}`" in detail
    assert repr(target) not in detail
    assert "        | :class:`~bokeh.core.properties.Nullable`\\ (" in detail
    assert "        |   :class:`~bokeh.core.properties.Either`\\ (" in detail
    assert f"        |     :class:`~bokeh.core.properties.Instance`\\ (:class:`~{target}`\\ )," in detail


def test_property_detail_supports_deprecated_aliases() -> None:
    properties, _, _ = _model_members(BoxSelectTool)
    detail = _render_property_detail(
        BoxSelectTool(),
        "BoxSelectTool.select_every_mousemove",
        "bokeh.models",
    )

    assert "select_every_mousemove" in properties
    assert ":annotation: = False" in detail
    assert ":Type: :class:`~bokeh.core.properties.Bool`" in detail
    assert "was deprecated in Bokeh 3.1.0" in detail


def test_model_detail_includes_property_index() -> None:
    detail = MODEL_DETAIL.render(
        methods=[],
        model_json="{}",
        module_name="bokeh.models",
        name="Filter",
        property_details=[],
        property_names=["name", "syncable", "tags", "document"],
        python_properties=[],
    )

    assert ".. list-table:: Property index" in detail
    assert ":widths: 50 50" in detail
    assert ":attr:`~bokeh.models.Filter.name`" in detail
    assert ":attr:`~bokeh.models.Filter.document`" in detail


def test_model_build_registers_inventory_members_and_template_dependencies(tmp_path: Path) -> None:
    source_dir = tmp_path / "source"
    output_dir = tmp_path / "output"
    doctree_dir = tmp_path / "doctrees"
    source_dir.mkdir()
    (source_dir / "conf.py").write_text(
        "extensions = [\n"
        "    'sphinx.ext.autodoc',\n"
        "    'sphinx_design',\n"
        "    'bokeh.sphinxext._internal.bokeh_model',\n"
        "]\n"
        "project = 'bokeh-model-test'\n"
        "bokeh_model_excluded_members = [\n"
        "    'greedy',\n"
        "    'js_event_callbacks',\n"
        "    'js_property_callbacks',\n"
        "    'subscribed_events',\n"
        "]\n",
        encoding="utf-8",
    )
    (source_dir / "index.rst").write_text(
        "Model API\n"
        "=========\n\n"
        ".. bokeh-model:: BoxSelectTool\n"
        "    :module: bokeh.models.tools\n",
        encoding="utf-8",
    )

    status = StringIO()
    warning = StringIO()
    app = Sphinx(
        srcdir=source_dir,
        confdir=source_dir,
        outdir=output_dir,
        doctreedir=doctree_dir,
        buildername="html",
        status=status,
        warning=warning,
        freshenv=True,
    )

    app.build()
    assert app.statuscode == 0, warning.getvalue()
    assert "duplicate object description" not in warning.getvalue()
    assert "unsupported descriptor" not in warning.getvalue()

    with (output_dir / "objects.inv").open("rb") as inventory_file:
        inventory = InventoryFile.load(cast(Any, inventory_file), "", posixpath.join)

    assert "bokeh.models.BoxSelectTool" in inventory["py:class"]
    assert "bokeh.models.BoxSelectTool.continuous" in inventory["py:attribute"]
    assert "bokeh.models.BoxSelectTool.select_every_mousemove" in inventory["py:attribute"]
    assert "bokeh.models.BoxSelectTool.document" in inventory["py:property"]
    assert "bokeh.models.BoxSelectTool.apply_theme" in inventory["py:method"]
    assert "bokeh.models.BoxSelectTool.greedy" not in inventory["py:attribute"]
    assert "bokeh.models.BoxSelectTool.js_event_callbacks" not in inventory["py:attribute"]

    local_toc = app.env.tocs["index"].astext()
    assert "continuous" in local_toc
    assert "apply_theme" in local_toc
    assert "BoxSelectTool.continuous" not in local_toc
    assert "BoxSelectTool.apply_theme" not in local_toc

    dependencies = {Path(dependency).name for dependency in app.env.dependencies["index"]}
    assert {"model_detail.rst", "prop_detail.rst"} <= dependencies


def test_model_build_resolves_include_help_substitutions(tmp_path: Path) -> None:
    source_dir = tmp_path / "source"
    output_dir = tmp_path / "output"
    doctree_dir = tmp_path / "doctrees"
    image_dir = source_dir / "_images"
    image_dir.mkdir(parents=True)

    for name in ("bevel_join", "butt_cap", "miter_join", "round_cap", "round_join", "square_cap"):
        (image_dir / f"{name}.png").write_bytes(b"")

    rst_epilog = (Path(__file__).parents[4] / "docs" / "bokeh" / "source" / "rst_epilog.txt").read_text(encoding="utf-8")
    (source_dir / "conf.py").write_text(
        "extensions = [\n"
        "    'sphinx.ext.autodoc',\n"
        "    'sphinx_design',\n"
        "    'bokeh.sphinxext._internal.bokeh_model',\n"
        "]\n"
        "project = 'bokeh-model-substitution-test'\n"
        f"rst_epilog = {rst_epilog!r}\n",
        encoding="utf-8",
    )
    (source_dir / "index.rst").write_text(
        "Arrow API\n"
        "=========\n\n"
        ".. bokeh-model:: Arrow\n"
        "    :module: bokeh.models.annotations\n",
        encoding="utf-8",
    )

    status = StringIO()
    warning = StringIO()
    app = Sphinx(
        srcdir=source_dir,
        confdir=source_dir,
        outdir=output_dir,
        doctreedir=doctree_dir,
        buildername="html",
        status=status,
        warning=warning,
        freshenv=True,
    )

    app.build()
    assert app.statuscode == 0, warning.getvalue()
    assert "Undefined substitution" not in warning.getvalue()
