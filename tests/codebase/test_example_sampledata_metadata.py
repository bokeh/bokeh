#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import ast
from itertools import chain
from tokenize import open as open_python

from bokeh.sphinxext._internal.bokeh_example_metadata import (
    read_example_metadata,
    sampledata_modules,
)
from bokeh.sphinxext._internal.bokeh_gallery import _discover_examples
from tests.support.util.project import TOP_PATH

SAMPLEDATA_PACKAGES = {"bokeh.sampledata", "bokeh_sampledata"}


def _imported_datasets(source: str) -> set[str]:
    if "sampledata" not in source:
        return set()

    tree = ast.parse(source)
    packages = set(SAMPLEDATA_PACKAGES)
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
                if alias.name in SAMPLEDATA_PACKAGES and alias.asname:
                    packages.add(alias.asname)
        elif isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
            if node.module in SAMPLEDATA_PACKAGES:
                imports.extend(f"{node.module}.{alias.name}" for alias in node.names if alias.name != "*")
            else:
                imports.append(node.module)
                if node.module == "bokeh":
                    packages.update(alias.asname or alias.name for alias in node.names if alias.name == "sampledata")

    accesses = (ast.unparse(node) for node in ast.walk(tree) if isinstance(node, ast.Attribute))
    datasets = set()
    for access in chain(imports, accesses):
        for package in packages:
            prefix = package + "."
            if access.startswith(prefix):
                dataset = access[len(prefix):].partition(".")[0]
                if dataset.isidentifier():
                    datasets.add(dataset)
    return datasets


def test_example_sampledata_imports_are_declared() -> None:
    missing = []
    for path in sorted((TOP_PATH / "examples").rglob("*.py")):
        with open_python(path) as file:
            imported = _imported_datasets(file.read())
        if not imported:
            continue
        _, metadata = read_example_metadata(path)
        undeclared = imported.difference(sampledata_modules(metadata.get("sampledata")))
        if undeclared:
            missing.append(f"{path.relative_to(TOP_PATH)}: {', '.join(sorted(undeclared))}")

    assert not missing, "Add these dataset names to the examples' :sampledata: metadata:\n" + "\n".join(missing)


def test_python_examples_have_docstring_summaries() -> None:
    examples = TOP_PATH / "examples"
    missing = []
    for source in _discover_examples(examples):
        if source.suffix == ".py":
            summary, _ = read_example_metadata(examples / source)
            if not summary:
                missing.append(f"examples/{source.as_posix()}")

    assert not missing, "Add a short module docstring summary to these Python examples:\n" + "\n".join(missing)
