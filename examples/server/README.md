# Bokeh server applications

A Bokeh application creates session documents and Python callbacks. Its form
and its host are separate choices.

- [Module apps](module_apps/) use ordinary imports and explicit configuration.
  Start here for reusable applications. They run directly through ASGI without
  a web framework. Framework integrations are optional examples.
- [Script apps](script_apps/) are a flat collection for quick experiments and
  existing script workflows. Run them with `bokeh serve` or pass their paths to `BokehASGI`.

Run the commands in each README from the repository root. These examples use
Bokeh's development environment. Some need extra packages or sample data, which
the individual READMEs identify. Importing a module app does not create its
session models or start its background producers.
