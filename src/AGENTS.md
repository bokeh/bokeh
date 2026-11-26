# Python library: instructions for coding agents

Applies to `src/bokeh` and `src/typings`. Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/python.rst`.

## Commands

- `pixi run pytest tests/unit/bokeh/models/test_ranges.py`: one test file. Tests mirror the package layout, see [tests/AGENTS.md](../tests/AGENTS.md).
- `pixi run test-py`: all unit tests. Add `-n auto` to run in parallel.
- `pixi run test-codebase`: `ruff` and the other repository-wide checks.
- `pixi run ruff check --select I --fix`: sort imports.
- `pixi run mypy`, `pixi run pyright`, `pixi run verify-types`: type checks.
- `pixi run test-defaults`: regenerate the baseline of model defaults that BokehJS is checked against.

## File layout

Copy the layout of a neighboring module, for example `src/bokeh/models/ranges.py`.

- The license header comes first, then the module docstring.
- Dashed section comments follow in this order: Boilerplate, Imports, Globals and constants, General API, Dev API, Private API, Code.
- The Boilerplate section has `from __future__ import annotations` and the `log = logging.getLogger(__name__)` lines.
- `__all__` is a tuple and lists the public names.
- Imports inside `src/bokeh` are relative.

## Conventions that tools do not enforce

- Docstrings use the Google style, with `Args:` and `Returns:`. They are reStructuredText and end up in the reference documentation.
- New code is fully typed. Do not use `Any`, a cast, or a `type: ignore` to make a type checker pass. Fix the type.
- Do not add guards, fallbacks, conversions, or `try`/`except` for states that the code cannot reach. Do not catch broad exceptions.
- Keep existing behavior unless the issue asks for a change. Watch for masked arrays, NaN and `None`, and the endpoints of ranges and palettes. Back a performance claim with a benchmark that a reviewer can run.
- Do not fix a mutable default argument with `None`, because that changes the signature. Use an immutable default such as `()`, or copy the input.
- Many modules have a hand-written `.pyi` stub next to them, for example `src/bokeh/models/ranges.pyi`. When you change a public signature or a property of such a module, update its stub, including the `_...Init` class of a model.
- Lines can be up to 165 characters long. Do not rewrap existing code.

## Import rules that tests enforce

- No module-level `tornado` import outside `src/bokeh/client`, `src/bokeh/server`, `src/bokeh/command/subcommands/serve.py`, and `src/bokeh/jupyter/server.py`.
- Importing the common modules must not import `bokeh.client`, `bokeh.server`, or `tornado`.
- Optional dependencies, such as pandas, are imported where they are used, with `import_optional` or `import_required` from `bokeh.util.dependencies`. Importing `bokeh` must work without them. CI checks this in the `core-py313` environment and its siblings.
- The code must run on the oldest supported Python, see `requires-python` in `pyproject.toml`.

## Models and properties

- A model is a subclass of `Model`. Its properties are class attributes from `bokeh.core.properties`.
- Every property has a `help` string in reStructuredText. It is the reference documentation of that property.
- Every model and property has a counterpart in BokehJS under `bokehjs/src/lib/models`. Type, default value, and nullability must match. See [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).
- After a change to a model, a property, or a default, run `pixi run test-defaults`. It regenerates `tests/baselines/defaults.json5` and then fails on purpose, because the file differs from the last commit. Check the difference and commit the file. Then the test passes, and `pixi run test-js-defaults` checks BokehJS against it.
- A new public model needs an entry in the reference documentation. See [docs/AGENTS.md](../docs/AGENTS.md).

## Warnings

pytest turns warnings into errors. New code must not emit warnings in the tests, including deprecation warnings from dependencies.
