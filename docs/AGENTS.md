# Documentation: instructions for coding agents

Applies to `docs/bokeh` and to docstrings anywhere in the repository. Read the root [AGENTS.md](../AGENTS.md) first. Explanations: `docs/bokeh/source/docs/dev_guide/documentation.rst`.

## Commands

Run `make` in `docs/bokeh`. The Makefile enters the pixi environment by itself.

- Building: "Setting up and building Bokeh's documentation" in `docs/bokeh/source/docs/dev_guide/documentation.rst`. The first build runs every example and takes several minutes.
- `make serve` opens a browser and does not return, so leave it to the contributor.
- `pixi run test-docs`: tests of the documentation sources.

The build treats warnings as errors. A new warning is a failed build, so fix its cause.

## Where things are

- `docs/bokeh/source/docs/reference`: reference pages. Most content comes from docstrings and from the `help` strings of properties.
- `docs/bokeh/api_reference`: generates the pages of the model reference. They are not committed.
- `docs/bokeh/source/rst_epilog.txt`: substitutions that are available on every page.
- `src/bokeh/sphinxext`: Bokeh's own Sphinx directives and roles, such as `bokeh-plot`, `bokeh-model`, and `bokeh-issue`.

## Writing rules

- The sources are reStructuredText, not Markdown. Inline code uses double backticks.
- For style and the spelling of names, follow "Documentation style guidelines" in `docs/bokeh/source/docs/dev_guide/documentation.rst`.
- Link to other pages with `:ref:` and a label. Do not write `https://docs.bokeh.org` URLs in directives. A pre-commit hook rejects them.
- Link to GitHub with the `:bokeh-issue:`, `:bokeh-pull:`, and `:bokeh-tree:` roles.
- Show a plot with the `bokeh-plot` directive and a script from `examples`. Do not paste example code into a page. See [examples/AGENTS.md](../examples/AGENTS.md).
- Docstrings and `help` strings: follow "Writing docstrings" and "Writing models and properties help" in the same file.

## Release notes

The core team writes the release notes, see the note at the end of "Writing models and properties help" in `docs/bokeh/source/docs/dev_guide/documentation.rst`. Do not edit the files in `docs/bokeh/source/docs/releases` unless the contributor or a maintainer asks. If the contributor is a maintainer, ask whether to add the entry to the file directly.

- For a new feature or an API change, propose the text of an entry in the pull request description. This is the "release document entry" item of the checklist.
- A new feature also needs a place in the user guide and an example. See [examples/AGENTS.md](../examples/AGENTS.md).

## A new public model

Follow "Writing Bokeh's documentation" in `docs/bokeh/source/docs/dev_guide/documentation.rst` for the reference pages and `make reference`. Then run `pixi run test-docs`.
