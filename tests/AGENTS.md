# Python tests: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/testing.rst` (running tests) and `docs/bokeh/source/docs/dev_guide/writing_tests.rst` (writing tests). BokehJS tests are in `bokehjs/test`, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).

## Where tests go

| Path | Content | Command |
| --- | --- | --- |
| `tests/unit` | Unit tests. `src/bokeh/models/ranges.py` is tested in `tests/unit/bokeh/models/test_ranges.py`. | `pixi run test-py` |
| `tests/codebase` | Repository-wide checks: `ruff`, licenses, import rules, CI workflows, these `AGENTS.md` files | `pixi run test-codebase` |
| `tests/test_defaults.py` | Model defaults, compared with BokehJS through `tests/baselines/defaults.json5` | `pixi run test-defaults` |
| `tests/test_cross.py`, `tests/cross` | Serialization cases shared with BokehJS. Not supported on Windows. | `pixi run test-cross` |
| `tests/test_examples.py` | Runs the scripts in `examples`. Options per example are in `tests/examples.yaml`. | `pixi run test-examples` |
| `tests/docs` | Tests of the documentation sources | `pixi run test-docs` |
| `tests/tools` | Tests of the scripts in `tools` | `pixi run test-tools` |
| `tests/typing` | Type checking fixtures, run by `tests/codebase/test_typing.py` | `pixi run test-codebase` |

## Conventions

- Use plain pytest functions and fixtures. Do not write `unittest.TestCase` classes.
- Test files have the same license header and section comments as source files. Copy a neighboring test file.
- Use absolute imports. The module under test is imported last, with an `# isort:skip` comment.
- Warnings are errors (`filterwarnings` in `pyproject.toml`). Fix the cause of a warning. Add a `filterwarnings` mark only for a warning from a third-party package, with a comment.
- Tests that need the sample data are marked with `@pytest.mark.sampledata`.
- Run one file with `pixi run pytest tests/unit/bokeh/models/test_ranges.py`, or one test with `-k name`.

## Baselines

- `tests/baselines/defaults.json5` and `tests/baselines/cross` are generated. Regenerate them with the commands above and commit the result. Do not edit them by hand.
- Visual baselines belong to BokehJS, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).

## A bug fix needs a regression test

Add a test that fails without the fix. Mention the issue number in the test name or in a comment.
