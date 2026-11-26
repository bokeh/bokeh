# Bokeh: instructions for coding agents

This file is for AI coding agents that work on the Bokeh repository. It lists commands and rules that are easy to get wrong. Explanations are in the contributor guide under `docs/bokeh/source/docs/dev_guide/`. Read the page for your task before you start.

## Repository map

| Path | Content | More instructions |
| --- | --- | --- |
| `src/bokeh` | Python library | [src/AGENTS.md](src/AGENTS.md) |
| `bokehjs` | BokehJS, the TypeScript library that renders in the browser | [bokehjs/AGENTS.md](bokehjs/AGENTS.md) |
| `docs/bokeh` | Sphinx documentation, including the contributor guide | [docs/AGENTS.md](docs/AGENTS.md) |
| `examples` | Example scripts, also used by the docs and the tests | [examples/AGENTS.md](examples/AGENTS.md) |
| `tests` | Python tests and shared baselines | [tests/AGENTS.md](tests/AGENTS.md) |
| `tools` | CI, release, and maintenance scripts | |

Read the nested file before you change anything in that directory.

## Setup

All tools run through [pixi](https://pixi.sh). Details: `docs/bokeh/source/docs/dev_guide/setup.rst`.

- `pixi run setup`: first-time setup. Builds BokehJS and installs Bokeh in editable mode. Run it again when `bokehjs/package-lock.json` changes.
- `pixi run reinstall`: rebuild after pulling changes.
- `pixi run python tools/hooks/install.py`: install the git hooks, once per clone.
- Prefix every command with `pixi run`, for example `pixi run pytest tests/unit/bokeh/models/test_ranges.py`. The default environment is right for almost everything. Select another one from `pixi.toml` with `-e` only when a task needs it.
- Leave `BOKEH_RESOURCES` and `BOKEH_DEV` unset when you run tests or build the docs.
- A change to dependencies goes into `pixi.toml`, followed by `pixi lock`. Commit both files.

## Checks to run before a pull request

Run the checks for the area you changed. The nested files list more specific ones.

- `pixi run test-py`: Python unit tests. Pass a path to run a subset, for example `pixi run pytest tests/unit/bokeh/core`.
- `pixi run test-codebase`: repository-wide checks, including `ruff`. This also runs in the pre-push hook.
- `pixi run mypy`: type checks.
- `pixi run test-js-unit`: BokehJS unit tests. Lint BokehJS as described in [bokehjs/AGENTS.md](bokehjs/AGENTS.md).
- `pixi run check-formatting`: whitespace and line-ending checks, as in CI. It fixes files in place.

Do not report a check as passed unless you ran it and saw it pass.

## Rules for every contribution

- Every pull request needs an issue that a maintainer has triaged, which means it no longer has the `TRIAGE` label. Link it in the description with `fixes #NNNN`. If there is no such issue, tell the contributor before you write code. Process: `docs/bokeh/source/docs/dev_guide/pull_requests.rst` and `docs/bokeh/source/docs/dev_guide/creating_issues.rst`.
- Pull requests target the default branch, not `main`. It is named `branch-X.Y`, and `git symbolic-ref refs/remotes/origin/HEAD` shows it. Name your branch `<issue number>_<short_description>`.
- Add or update tests with every code change. Prefer extending or parametrizing an existing test over adding many new ones.
- A new feature or an API change needs an entry in the release notes of the next version under `docs/bokeh/source/docs/releases/`.
- A change to a model or property in Python needs the matching change in BokehJS, and the reverse.
- Fill in the checklist of `.github/PULL_REQUEST_TEMPLATE.md`. Do not remove it. Leave an item that does not apply unchecked and say why.
- Keep the change focused on the issue. Do not reformat or refactor unrelated code.
- Do not push to `main` or a `branch-X.Y` branch, and do not merge pull requests.

## AI contributions

Bokeh's [AI Contribution Guidelines](https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management#ai-contribution-guidelines) apply to everything you help produce. Read them. The most important point: the contributor must understand the contribution and be able to explain it. Do not present work the contributor has not reviewed as ready.

Disclose AI involvement, every time. This rule is stricter than the guidelines on purpose.

- Every pull request description, issue, and comment you write or help write says that an AI tool was involved.
- Name the tool and say what it did, for example "drafted the fix and the tests" or "wrote this description".
- Say what the contributor did, but only what you know to be true.
- Do not remove a disclosure, and do not leave it out because the AI part was small.
- Disclosure does not make a contribution acceptable. The guidelines do not accept AI-generated comments and reviews, or pasted AI responses. Help the contributor write their own.

## Keep these files current

- A pull request that changes a command, path, tool, or convention described in an `AGENTS.md` file updates that file in the same pull request.
- Keep the files short. They cost tokens in every session. Put explanations in the contributor guide and link to them from here.
- `tests/codebase/test_agents_md.py` checks the commands, paths, and size of every `AGENTS.md`. Run it after you edit one: `pixi run pytest tests/codebase/test_agents_md.py`.
- For people: `docs/bokeh/source/docs/dev_guide/ai_tools.rst`.
