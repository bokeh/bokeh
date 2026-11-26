# Examples: instructions for coding agents

Read the root [AGENTS.md](../AGENTS.md) first. The scripts in this directory are user-facing examples. The documentation embeds them, the gallery and the examples index list them, and `tests/test_examples.py` runs every one of them. Explanations: `docs/bokeh/source/docs/dev_guide/documentation.rst`.

## Commands

- `pixi run python examples/basic/bars/mixed.py`: run one example. It writes an HTML file and tries to open a browser.
- `BOKEH_RESOURCES=inline pixi run python examples/basic/bars/mixed.py`: use the local BokehJS build instead of the CDN. Needed when the example depends on a change in BokehJS.
- `pixi run pytest tests/test_examples.py -k mixed`: run the examples test for matching examples.
- `pixi run pytest tests/codebase/test_example_sampledata_metadata.py`: check the metadata of all examples.

## Every example

- Starts with a module docstring. Its first sentence is the summary that the documentation shows.
- Has a `.. bokeh-example-metadata::` block in that docstring. Copy the block of a neighboring example, for example `examples/basic/bars/mixed.py`, and keep the order of its fields.
- Lists every `bokeh.sampledata` module it imports in the `:sampledata:` field. A test enforces this.
- Is a complete script that a user can copy and run. Keep it short, and show one idea.
- Uses only Bokeh, its required dependencies, and the packages that the examples already use. Do not add a dependency for an example.
- Ends by showing or saving its output, the way the neighboring examples do.

## Gallery and documentation

- The `:gallery:` field puts an example into the gallery. Its value is the alt text of the thumbnail. The example then needs two thumbnails under `docs/bokeh/source/_images/examples`, at the same relative path as the script: 300 by 300 pixels, and 600 by 600 pixels with an `@2x` suffix.
- The gallery page is `docs/bokeh/source/docs/gallery.rst`.
- An unknown category or a missing thumbnail fails the documentation build.
- When you rename or move an example, search `docs/bokeh/source` and `tests/examples.yaml` for its path and update them.

## Tests

- New examples are tested automatically.
- `tests/examples.yaml` holds exceptions, such as `skip` and `slow`. Add an entry only when an example cannot run in CI, and say why in a comment.
- Server examples in `examples/server` run with `bokeh serve`, not with `python`.
