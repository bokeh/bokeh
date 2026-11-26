# Documentation: instructions for coding agents

Applies to `docs/bokeh` and to docstrings anywhere in the repository. Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/documentation.rst`.

## Commands

Run `make` in `docs/bokeh`. The Makefile enters the pixi environment by itself.

- `make html SPHINXOPTS="-j auto"`: build the documentation into `docs/bokeh/build/html`. The first build runs every example and takes several minutes.
- `make serve`: serve the built documentation locally.
- `make clean`: remove the build. Use it when a build keeps stale output.
- `make reference`: regenerate the pages of the model reference. Run it after you add, rename, or remove a public model.
- `pixi run test-docs`: tests of the documentation sources.
- CI builds with `pixi run -e docs-py315 build-docs`.

The build treats warnings as errors. A new warning is a failed build, so fix its cause.

## Where things are

| Path | Content |
| --- | --- |
| `docs/bokeh/source/docs/first_steps`, `docs/bokeh/source/docs/user_guide` | Narrative documentation |
| `docs/bokeh/source/docs/reference` | Reference pages. Most content comes from docstrings and from the `help` strings of properties. |
| `docs/bokeh/source/docs/dev_guide` | Contributor guide |
| `docs/bokeh/source/docs/releases` | Release notes, one file per version |
| `docs/bokeh/api_reference/sections.json` | Assigns every model to a section of the model reference |
| `docs/bokeh/source/rst_epilog.txt` | Substitutions that are available on every page |
| `src/bokeh/sphinxext` | Bokeh's own Sphinx directives and roles, such as `bokeh-plot`, `bokeh-model`, and `bokeh-issue` |

## Writing rules

- The sources are reStructuredText, not Markdown. Inline code uses double backticks.
- Follow the style section of the documentation page of the contributor guide: American English, second person, active voice, sentence case in headings, serial comma.
- Spell names as "Bokeh", "BokehJS", "JavaScript", "Jupyter notebook", and "pandas".
- Link to other pages with `:ref:` and a label. Do not write `https://docs.bokeh.org` URLs in directives. A pre-commit hook rejects them.
- Link to GitHub with the `:bokeh-issue:`, `:bokeh-pull:`, and `:bokeh-tree:` roles.
- Show a plot with the `bokeh-plot` directive and a script from `examples`. Do not paste example code into a page. See [examples/AGENTS.md](../examples/AGENTS.md).
- Docstrings use the Google style with `Args:` and `Returns:`.

## Release notes

- A new feature or an API change gets an entry in the file of the next version, the newest file in `docs/bokeh/source/docs/releases`.
- Add a bullet to the matching section, such as "New features". Follow the wording of the existing entries.
- Reference classes with `:class:` and the issue or pull request with `:bokeh-issue:` or `:bokeh-pull:`.
- Bug fixes do not need an entry, unless the contributor or a maintainer asks for one.

## A new public model

1. Write the docstring of the class and the `help` string of every property.
2. Add the model to `docs/bokeh/api_reference/sections.json`.
3. Run `make reference`. `make html` fails when the generated pages are out of date.

## Changes to the contributor guide

The `AGENTS.md` files point to pages of the contributor guide. When you move or rename a page there, update the `AGENTS.md` files that mention it. `tests/codebase/test_agents_md.py` finds broken paths.
