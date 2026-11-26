# Bokeh: instructions for coding agents

For AI coding agents that work on this repository. It lists commands and rules that are easy to get wrong. Explanations are in the contributor guide under `docs/bokeh/source/docs/dev_guide/`. Read the page for your task.

## Commands

All tools run through [pixi](https://pixi.sh). Details: `docs/bokeh/source/docs/dev_guide/setup.rst`.

```sh
pixi run setup                          # first-time setup, and after bokehjs/package-lock.json changes
pixi run python tools/hooks/install.py  # git hooks, once per clone
pixi run reinstall                      # rebuild after pulling changes or editing BokehJS
pixi run pytest tests/unit/bokeh/models/test_ranges.py  # one test file
pixi run test-py                        # all Python unit tests
pixi run test-codebase                  # repository-wide checks, including ruff
pixi run mypy                           # type checks
pixi run test-js-unit                   # BokehJS unit tests
pixi run check-formatting               # whitespace and line endings, fixes files in place
```

- Run the tests for what you changed first, not whole suites.
- Leave `BOKEH_RESOURCES` and `BOKEH_DEV` unset when you run tests or build the docs.
- Do not report a check as passed unless you ran it and saw it pass. Do not call a failure pre-existing unless you saw it fail without your change.

## Nested instructions

Read the file for a directory before you change anything there: [src/AGENTS.md](src/AGENTS.md) (Python library), [bokehjs/AGENTS.md](bokehjs/AGENTS.md) (BokehJS), [docs/AGENTS.md](docs/AGENTS.md), [examples/AGENTS.md](examples/AGENTS.md), [tests/AGENTS.md](tests/AGENTS.md).

## Before you start

- Every pull request needs an issue that a maintainer has triaged, so it no longer has the `TRIAGE` label. If there is none, tell the contributor before you write code.
- Check whether the issue already has a pull request, in its "Development" section or with `gh pr list --search "<issue number>"`. If one exists, do not open a competing one. Recommend that the contributor joins the discussion there and offers their findings.
- Branch from the default branch, which `git symbolic-ref refs/remotes/origin/HEAD` shows. It is named `branch-X.Y`, not `main`. Name your branch `<issue number>_<short_description>`.

## Rules for the change

- Keep the change focused on the issue. Do not reformat or refactor unrelated code.
- When you fix a pattern, search for its other occurrences and fix them too, or say why not.
- Add or update tests with every code change. See [tests/AGENTS.md](tests/AGENTS.md).
- A change to a model or property in Python needs the matching change in BokehJS, and the reverse.
- A new feature or an API change needs a release note. See [docs/AGENTS.md](docs/AGENTS.md).
- Comments explain why, not what. Do not add comments that narrate your change or restate the code.
- Review `git status` and the whole diff before each commit. Stage only what the change needs. No scratch files, and no lockfile changes you did not intend.
- Update your branch with a rebase on the default branch. Do not merge the default branch into it.

## Ask first, and never

Ask the contributor before you:

- add or update a dependency (`pixi.toml` and `pixi.lock`, or `bokehjs/package.json`)
- change or remove public API, or change existing behavior
- change files under `.github` or `tools`
- accept new or changed visual baselines

Never:

- push to `main` or `branch-X.Y`, merge a pull request, or request a review on your own
- edit generated files by hand, or weaken a test, a type, or a lint rule to make a check pass
- open several pull requests for one issue, or close one and open it again

## Pull requests

- Keep the checklist of `.github/PULL_REQUEST_TEMPLATE.md` and fill it in. Link the issue with `fixes #NNNN`. Leave an item that does not apply unchecked and say why.
- The title is a plain sentence in ASCII, without emoji. The changelog is generated from titles.
- Keep the description short. Say what changed and why, and what you could not verify. Do not list the diff file by file.

## AI contributions

Bokeh's [AI Contribution Guidelines](https://github.com/bokeh/bokeh/wiki/BEP-1:-Issues-and-PRs-management#ai-contribution-guidelines) apply to everything you help produce. Read them. The contributor must understand the contribution and be able to explain it. Do not present work as ready that the contributor has not reviewed.

Disclose AI involvement, every time. This is stricter than the guidelines on purpose.

- Every pull request description, issue, and comment you write or help write says that an AI tool was involved, which tool, and what it did.
- Say what the contributor did, but only what you know to be true.
- Do not remove a disclosure, and do not leave it out because the AI part was small.
- Disclosure does not make a contribution acceptable. The guidelines do not accept AI-generated comments and reviews, or pasted AI responses. Help the contributor write their own.

## Keep these files current

- A pull request that changes a command, path, tool, or convention described in an `AGENTS.md` file updates that file.
- Keep the files short. They cost tokens in every session. Explanations go into the contributor guide.
- `tests/codebase/test_agents_md.py` checks the commands, paths, and size of every `AGENTS.md`.
- For people: `docs/bokeh/source/docs/dev_guide/ai_tools.rst`.
