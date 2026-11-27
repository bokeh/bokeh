# Python library: instructions for coding agents

Applies to `src/bokeh` and `src/typings`. Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/python.rst`.

## Commands

In addition to the commands in the root file, see "Code style" and "Typing" in `docs/bokeh/source/docs/dev_guide/python.rst`, and "Run Python tests" in `docs/bokeh/source/docs/dev_guide/testing.rst`.

## File layout

Copy the layout of a neighboring module, for example `src/bokeh/models/ranges.py`.

- The license header comes first, then the module docstring.
- Dashed section comments follow in this order: Boilerplate, Imports, Globals and constants, General API, Dev API, Private API, Code.
- The Boilerplate section has `from __future__ import annotations` and the `log = logging.getLogger(__name__)` lines.
- `__all__` is a tuple and lists the public names.
- Imports inside `src/bokeh` are relative.

## Conventions that tools do not enforce

- Docstrings and `help` strings: follow "Writing docstrings" and "Writing models and properties help" in `docs/bokeh/source/docs/dev_guide/documentation.rst`.
- New code is fully typed. Do not use `Any`, a cast, or a `type: ignore` to make a type checker pass. Fix the type.
- Do not add guards, fallbacks, conversions, or `try`/`except` for states that the code cannot reach. Do not catch broad exceptions.
- Keep existing behavior unless the issue asks for a change. Watch for masked arrays, NaN and `None`, and the endpoints of ranges and palettes. Back a performance claim with a benchmark that a reviewer can run.
- Do not fix a mutable default argument with `None`, because that changes the signature. Use an immutable default such as `()`, or copy the input.
- Many modules have a hand-written `.pyi` stub next to them, for example `src/bokeh/models/ranges.pyi`. When you change a public signature or a property of such a module, update its stub, including the `_...Init` class of a model.
- Do not rewrap existing code.

## Import rules that tests enforce

- No module-level `tornado` import outside `src/bokeh/client`, `src/bokeh/server`, `src/bokeh/command/subcommands/serve.py`, and `src/bokeh/jupyter/server.py`.
- Importing the common modules must not import `bokeh.client`, `bokeh.server`, or `tornado`.
- Optional dependencies, such as pandas, are imported where they are used, with `import_optional` or `import_required` from `bokeh.util.dependencies`. Importing `bokeh` must work without them. CI checks this in separate environments.
- The code must run on the oldest supported Python, see `requires-python` in `pyproject.toml`.

## Models and properties

- A model is a subclass of `Model`. Its properties are class attributes from `bokeh.core.properties`.
- Every model and property has a counterpart in BokehJS under `bokehjs/src/lib/models`. Type, default value, and nullability must match. See [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).
- After a change to a model, a property, or a default, regenerate the defaults baseline and commit it. See "Run Python tests" in `docs/bokeh/source/docs/dev_guide/testing.rst`.
- A new public model needs an entry in the reference documentation. See [docs/AGENTS.md](../docs/AGENTS.md).
