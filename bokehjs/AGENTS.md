# BokehJS: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/bokehjs.rst`, `docs/bokeh/source/docs/dev_guide/testing.rst`, and `docs/bokeh/source/docs/dev_guide/writing_tests.rst`.

## Commands

Run `node make` commands in this directory, inside the pixi environment (`pixi shell`, or `pixi run node make build` from this directory). `node make help` lists the main tasks.

- `node make build`: full build. `node make dev` builds only the library and is faster.
- `node make build lint`: lint TypeScript (Oxlint) and LESS (stylelint). Lint needs a current build. Add `--fix` to fix what can be fixed automatically. The pre-push hook runs this.
- `node make test:unit`: unit tests. Same as `pixi run test-js-unit`.
- `node make test:defaults`: model defaults against the baseline that Python generates. Same as `pixi run test-js-defaults`.
- `node make test:codebase`: checks on the build output. Same as `pixi run test-js-codebase`.
- `node make test:integration`: visual tests. Same as `pixi run test-js-integration`. Build first, and see the section on baselines.
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

- Lint decides style. The rules are in `.oxlintrc.jsonc` (TypeScript) and `stylelint.config.mjs` (LESS). Run `node make build lint --fix` and follow its output.
- No `any` type unless there is a good technical reason. Use `unknown` otherwise.
- Do not add a cast without a comment that says why it is safe.
- Connect event listeners and signals in `connect_signals()`, not in constructors or render methods.
- Do not add dependencies to `package.json` without asking the contributor. The license check in `tests/codebase/test_js_license_set.py` will fail.

## Tests

- A change to rendering needs a visual test in `test/integration`. A unit test is not enough, because it passes when the output is wrong in a consistent way.
- A regression test goes into `test/unit/regressions.ts` or `test/integration/regressions.ts`, as `describe("in issue #NNNN")` with an `it(...)` whose text completes the sentence "Bug in issue #NNNN ...", for example `it("doesn't allow ...")`. A visual test has no assertion, so look at its image before and after the fix and confirm that only the fixed one is right.
- In visual tests, use `display()` and `fig()` from `test/framework/layouts.ts` (imported as `#framework/layouts`), and keep plots small.
- `await display()` already waits for the view. After later changes to a model, use `await view.ready`. Do not add arbitrary delays.

## Baselines of the visual tests

A new or changed visual test needs new baseline files (`.png` and `.blf`) in the same pull request. Missing baselines are the most common reason for a failing BokehJS CI run.

- Baselines exist only for Linux and come from one container image. Do not commit baselines from macOS, Windows, or a run of `node make test:integration` on the host. Use that only to iterate, and discard the files it writes to `test/baselines/linux`.
- A baseline file is named after its test.
- With a container engine: `node make baseline-test` runs the tests in that container (Docker, or Podman with `BOKEHJS_CONTAINER_ENGINE=podman`). `node make baseline-test:review` shows the differences, and `node make baseline-test:accept` stages the files.
- Without one: the visual tests in CI run only for pull requests. With the contributor's consent, open a draft pull request and let the BokehJS-CI workflow fail. Then run `gh run download <run id> -n bokehjs-report -D .` at the top of the repository and commit the new baseline files.
- A run that creates or changes baselines fails on purpose. Run it again after you commit the files.
- When you rename a test, rename its baseline files.
- Every changed baseline is a visible change. Look at each one, explain it in the pull request, and never accept a difference you cannot explain.
- The default tolerance is zero pixels. `it.allowing(n)` needs a comment that says why.
