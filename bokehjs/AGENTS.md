# BokehJS: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/bokehjs.rst`, `docs/bokeh/source/docs/dev_guide/testing.rst`, and `docs/bokeh/source/docs/dev_guide/writing_tests.rst`.

## Commands

Run `node make` commands in this directory, inside the pixi environment (`pixi shell`, or `pixi run node make build` from this directory). `node make help` lists the main tasks.

- Building and linting: "Building BokehJS" and "Code Style Guide" in `docs/bokeh/source/docs/dev_guide/bokehjs.rst`. Lint needs a current build, so run `node make build lint`.
- Running and selecting tests: "Run JavaScript tests" in `docs/bokeh/source/docs/dev_guide/testing.rst`.
- After a change to BokehJS, run `pixi run reinstall` from the repository root before you run Python tests or examples against it.

## Layout

See "Source code location" and "CSS for BokehJS" in `docs/bokeh/source/docs/dev_guide/bokehjs.rst`.

## Models

- Every model has a Python counterpart in `src/bokeh/models`. Properties in `define<Props>(...)` must match Python in name, type, default value, and nullability. See [src/AGENTS.md](../src/AGENTS.md).
- For defaults, the `create()` factory, constructors, and the lifecycle methods, follow "Models" in `docs/bokeh/source/docs/dev_guide/bokehjs.rst`. For enumerations, see "Property kinds" there.
- After a change to a model or a default: build, run `pixi run reinstall` from the repository root, then regenerate the defaults baseline. See "Run Python tests" in `docs/bokeh/source/docs/dev_guide/testing.rst`.

## TypeScript conventions

- Lint decides style. The rules are in `.oxlintrc.jsonc` (TypeScript) and `stylelint.config.mjs` (LESS). Run `node make build lint --fix` and follow its output.
- No `any` type unless there is a good technical reason. Use `unknown` otherwise.
- Do not add a cast without a comment that says why it is safe.
- Do not add dependencies to `package.json` without asking the contributor. The license check in `tests/codebase/test_js_license_set.py` will fail.

## Tests

- A change to rendering needs a visual test in `test/integration`. A unit test is not enough, because it passes when the output is wrong in a consistent way.
- For a regression test, follow "BokehJS regression tests" in `docs/bokeh/source/docs/dev_guide/writing_tests.rst`. A visual test has no assertion, so look at its image before and after the fix and confirm that only the fixed one is right.
- For visual tests and for waiting on a view, follow "BokehJS visual tests" and "Waiting for asynchronous work in BokehJS tests" in the same file. Do not add arbitrary delays.

## Baselines of the visual tests

A new or changed visual test needs new baseline files (`.png` and `.blf`) in the same pull request. Missing baselines are the most common reason for a failing BokehJS CI run.

- To create, review, and accept baselines, with or without a container engine, follow "BokehJS visual tests" in `docs/bokeh/source/docs/dev_guide/writing_tests.rst` and "Run JavaScript tests" in `docs/bokeh/source/docs/dev_guide/testing.rst`.
- Do not commit baselines from macOS, Windows, or a run of `node make test:integration` on the host. Discard the files that such a run writes to `test/baselines/linux`.
- Getting baselines from CI needs a draft pull request. Ask the contributor before you open one.
- A run that creates or changes baselines fails on purpose. Run it again after you commit the files.
- When you rename a test, rename its baseline files.
- Every changed baseline is a visible change. Look at each one, explain it in the pull request, and never accept a difference you cannot explain.
