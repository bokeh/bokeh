# BokehJS: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/bokehjs.rst`, `docs/bokeh/source/docs/dev_guide/testing.rst`, and `docs/bokeh/source/docs/dev_guide/writing_tests.rst`.

## Commands

Run `node make` commands in this directory, inside the pixi environment (`pixi shell`, or `pixi run node make build` from this directory). `node make help` lists the main tasks.

- `node make build`: full build. `node make dev` builds only the library and is faster.
- `node make build lint`: lint TypeScript (Oxlint) and LESS (stylelint). Lint needs a current build. Add `--fix` to fix what can be fixed automatically. The pre-push hook runs this.
- `node make test:unit`: unit tests. Same as `pixi run test-js-unit`.
- `node make test:defaults`: model defaults against `tests/baselines/defaults.json5`. Same as `pixi run test-js-defaults`.
- `node make test:codebase`: checks on the build output. Same as `pixi run test-js-codebase`.
- `node make test:integration`: visual tests. Same as `pixi run test-js-integration`. See the section on baselines.
- Select tests with `-k "substring"`, `-g "regex"`, or `-f path`. Example: `node make test:unit -f core/util/array -k linspace`.
- After a change to BokehJS, run `pixi run reinstall` from the repository root before you run Python tests or examples against it.

## Layout

| Path | Content |
| --- | --- |
| `src/lib` | The library. Models are in `src/lib/models`, one file for a model and its view. |
| `src/less` | Styles, written in LESS. Class names start with `bk-`. |
| `test/unit` | Unit tests, mirroring `src/lib` |
| `test/integration` | Visual tests |
| `test/baselines/linux` | Baseline images (`.png`) and layout files (`.blf`) of the visual tests |
| `make` | The build system behind `node make` |

## Models

- Every model has a Python counterpart in `src/bokeh/models`. Properties in `define<Props>(...)` must match Python in name, type, default value, and nullability. See [src/AGENTS.md](../src/AGENTS.md).
- A mutable default value is given as a function.
- Create instances with the `create()` factory, for example `Range1d.create({start: 0, end: 1})`. A custom constructor that does more than forward attributes must be `protected`.
- Overrides of `initialize()` and `connect_signals()` call the `super` method.
- Shared enumerations are in `src/lib/core/enums.ts`.
- After a change to a model or a default: build, run `pixi run reinstall` and `pixi run test-defaults` from the repository root, commit the regenerated `tests/baselines/defaults.json5`, then run `node make test:defaults`. Details are in [src/AGENTS.md](../src/AGENTS.md).

## TypeScript conventions

- Double quotes for strings, template literals for interpolation.
- No `for...in` loops.
- No semicolons at the end of statements. Follow the style of the surrounding file and let `node make lint --fix` decide.
- Do not add dependencies to `package.json` without asking the contributor. The license check in `tests/codebase/test_js_license_set.py` will fail.

## Tests

- A regression test goes into `test/unit/regressions.ts` or `test/integration/regressions.ts`, in a `describe("in issue #NNNN")` block.
- In visual tests, use `display()` and `fig()` from `test/framework/layouts.ts` (imported as `#framework/layouts`), and keep plots small.
- Wait for views with `await view.ready`. Do not add arbitrary delays.

## Baselines of the visual tests

- Baselines exist only for Linux, and only a containerized run produces the official ones.
- `node make baseline-test` runs the visual tests in a container (Docker, or Podman with `BOKEHJS_CONTAINER_ENGINE=podman`). `node make baseline-test:review` shows the differences, and `node make baseline-test:accept` stages the new baselines.
- A run that creates or changes baselines fails on purpose. Look at the differences before you accept them.
- Do not commit baselines from a run of `node make test:integration` on the host. Use that only to iterate.
- A changed baseline is a visible change. Explain it in the pull request, and never accept a difference you cannot explain.
- The default tolerance is zero pixels. `it.allowing(n)` needs a comment that says why.
