# Python tests: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/testing.rst` (running tests) and `docs/bokeh/source/docs/dev_guide/writing_tests.rst` (writing tests). BokehJS tests are in `bokehjs/test`, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).

## Where tests go

Which suite covers what, and how to run it: "Local testing" in `docs/bokeh/source/docs/dev_guide/testing.rst`.

- Unit tests mirror the package: `src/bokeh/models/ranges.py` is tested in `tests/unit/bokeh/models/test_ranges.py`.
- A new serialization case in `tests/cross/cases` needs a counterpart in `bokehjs/test/integration/cross.ts`.
- `tests/typing` holds type checking fixtures, run by `tests/codebase/test_typing.py`.

## Conventions

- Follow "Python unit tests" in `docs/bokeh/source/docs/dev_guide/writing_tests.rst`. Use functions or plain `Test_...` classes as in the neighboring file.
- Test files have the same license header and section comments as source files. Copy a neighboring test file.
- The module under test is imported last, with an `# isort:skip` comment.
- Warnings are errors (`filterwarnings` in `pyproject.toml`). Fix the cause of a warning. Add a `filterwarnings` mark only for a warning from a third-party package, with a comment.

## Baselines

- `tests/baselines/defaults.json5` and `tests/baselines/cross` are generated. Regenerate them with the commands above and commit the result. Do not edit them by hand.
- Visual baselines belong to BokehJS, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).

## What a good test looks like here

These points come up most often in reviews.

- A test for a bug fix fails without the fix. Run it against the unfixed code and see it fail, on an assertion, before you say it covers the bug. For visual tests, see [bokehjs/AGENTS.md](../bokehjs/AGENTS.md).
- One behavior per test. Do not mix cases that pass with cases that raise, and do not use `if` in a test body.
- Cover the same behavior for several inputs, such as a list and a NumPy array, with `@pytest.mark.parametrize`. Do not copy the test body.
- Before you add a test, check whether an existing test already covers the behavior. Do not duplicate it.
- Cover the edge cases of the change, such as empty input, `None`, NaN, and negative indices.
- Mention the issue number in the name of a regression test or in a comment.
