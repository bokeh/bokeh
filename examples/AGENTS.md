# Examples: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. The scripts in this directory are user-facing examples. The documentation embeds them, the gallery and the examples index list them, and `tests/test_examples.py` runs most of them. Explanations: `docs/bokeh/source/docs/dev_guide/documentation.rst`.

## Commands

- `BOKEH_BROWSER=none pixi run python examples/basic/bars/mixed.py`: run one example. It writes an HTML file. Without `BOKEH_BROWSER=none`, it also opens a browser.
- Add `BOKEH_RESOURCES=inline` to use the local BokehJS build instead of the CDN. This is needed when the example depends on a change in BokehJS.
- `pixi run pytest tests/test_examples.py -k mixed`: run the examples test for matching examples.
- `pixi run pytest tests/codebase/test_example_sampledata_metadata.py`: check the metadata of all examples.

## Every example

- Starts with a module docstring. Its first sentence is the summary that the documentation shows.
- Has a `.. bokeh-example-metadata::` block in that docstring. Copy the block of a neighboring example, for example `examples/basic/bars/mixed.py`, and keep the order of its fields.
- Lists every `bokeh.sampledata` module it imports in the `:sampledata:` field. A test enforces this.
- Is a complete script that a user can copy and run. Keep it short, and show one idea.
- Uses only Bokeh, its required dependencies, and the packages that the examples already use. Do not add a dependency for an example.
- Ends by showing or saving its output, the way the neighboring examples do.
- Uses current API. Do not copy deprecated calls from old code, and run the example to see that it emits no deprecation warning.

## Gallery and documentation

- The `:gallery:` field puts an example into the gallery. Its value is the alt text of the thumbnail. The example then needs two thumbnails under `docs/bokeh/source/_images/examples`, at the same relative path as the script: 300 by 300 pixels, and 600 by 600 pixels with an `@2x` suffix.
- The gallery page is `docs/bokeh/source/docs/gallery.rst`.
- An unknown category or a missing thumbnail fails the documentation build.
- When you rename or move an example, search `docs/bokeh/source` and `tests/examples.yaml` for its path and update them.

## Tests

- `tests/examples.yaml` lists the directories whose examples are tested. A new example in a listed directory is tested automatically. A new directory needs an entry.
- The same file holds exceptions per directory: `skip`, `slow`, `xfail`, and `no_js`. Add one only when an example cannot run in CI.
- The apps in `examples/server/app` run with `bokeh serve`, not with `python`.
