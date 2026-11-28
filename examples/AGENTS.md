# Examples: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. The scripts in this directory are user-facing examples. The documentation embeds them, the gallery and the examples index list them, and `tests/test_examples.py` runs most of them. Explanations: `docs/bokeh/source/docs/dev_guide/documentation.rst`.

## Commands

- `BOKEH_BROWSER=none pixi run python examples/basic/bars/mixed.py`: run one example. It writes an HTML file. Without `BOKEH_BROWSER=none`, it also opens a browser.
- Add `BOKEH_RESOURCES=inline` to use the local BokehJS build instead of the CDN. This is needed when the example depends on a change in BokehJS.
- `pixi run pytest tests/test_examples.py -k mixed`: run the examples test for matching examples.
- `pixi run pytest tests/codebase/test_example_sampledata_metadata.py`: check the metadata of all examples.

## Every example

- Has a module docstring with a `bokeh-example-metadata` block. For its fields, the gallery, and the thumbnails, follow "Writing for Bokeh's narrative documentation" in `docs/bokeh/source/docs/dev_guide/documentation.rst`. Copy the block of a neighboring example, for example `examples/basic/bars/mixed.py`.
- Is a complete script that a user can copy and run. Keep it short, and show one idea.
- Uses only Bokeh, its required dependencies, and the packages that the examples already use. Do not add a dependency for an example.
- Ends by showing or saving its output, the way the neighboring examples do.
- Uses current API. Do not copy deprecated calls from old code, and run the example to see that it emits no deprecation warning.

## Renaming

When you rename or move an example, search `docs/bokeh/source` and `tests/examples.yaml` for its path and update them.

## Tests

- `tests/examples.yaml` lists the directories whose examples are tested. A new example in a listed directory is tested automatically. A new directory needs an entry.
- The same file holds exceptions per directory: `skip`, `slow`, `xfail`, and `no_js`. Add one only when an example cannot run in CI.
- The apps in `examples/server/app` run with `bokeh serve`, not with `python`.
