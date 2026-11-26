# Python tests: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/testing.rst` (running tests) and `docs/bokeh/source/docs/dev_guide/writing_tests.rst` (writing tests). BokehJS tests are in `bokehjs/test`, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).

## Where tests go

| Path | Content | Command |
| --- | --- | --- |
| `tests/unit` | Unit tests. `src/bokeh/models/ranges.py` is tested in `tests/unit/bokeh/models/test_ranges.py`. | `pixi run test-py` |
| `tests/codebase` | Repository-wide checks: `ruff`, licenses, import rules, CI workflows, these `AGENTS.md` files | `pixi run test-codebase` |
| `tests/test_defaults.py` | Model defaults, compared with BokehJS through `tests/baselines/defaults.json5` | `pixi run test-defaults` |
| `tests/test_cross.py`, `tests/cross` | Serialization cases shared with BokehJS. A new case in `tests/cross/cases` needs a counterpart in `bokehjs/test/integration/cross.ts`. Not supported on Windows. | `pixi run test-cross` |
| `tests/test_examples.py` | Runs the examples that `tests/examples.yaml` lists | `pixi run test-examples` |
| `tests/docs` | Tests of the documentation sources | `pixi run test-docs` |
| `tests/tools` | Tests of the scripts in `tools` | `pixi run test-tools` |
| `tests/typing` | Type checking fixtures, run by `tests/codebase/test_typing.py` | `pixi run test-codebase` |

## Conventions

- Use pytest, with functions or plain `Test_...` classes as in the neighboring file. Do not write `unittest.TestCase` classes.
- Test files have the same license header and section comments as source files. Copy a neighboring test file.
- Use absolute imports. The module under test is imported last, with an `# isort:skip` comment.
- Warnings are errors (`filterwarnings` in `pyproject.toml`). Fix the cause of a warning. Add a `filterwarnings` mark only for a warning from a third-party package, with a comment.
- Run one file with `pixi run pytest tests/unit/bokeh/models/test_ranges.py`, or one test with `-k name`.

## Baselines

- `tests/baselines/defaults.json5` and `tests/baselines/cross` are generated. Regenerate them with the commands above and commit the result. Do not edit them by hand.
- Visual baselines belong to BokehJS, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).

## What a good test looks like here

These points come up most often in reviews.

- A test for a bug fix fails without the fix. Run it against the unfixed code and see it fail, on an assertion, before you say it covers the bug.
- One behavior per test. Do not mix cases that pass with cases that raise, and do not use `if` in a test body.
- Cover the same behavior for several inputs, such as a list and a NumPy array, with `@pytest.mark.parametrize`. Do not copy the test body.
- Before you add a test, check whether an existing test already covers the behavior. Do not duplicate it.
- Cover the edge cases of the change, such as empty input, `None`, NaN, and negative indices.
- Do not weaken or remove an existing assertion to make a test pass.
- Mention the issue number in the name of a regression test or in a comment.
