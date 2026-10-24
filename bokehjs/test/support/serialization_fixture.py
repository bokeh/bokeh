"""Generate a bundle serialization fixture from an explicit Bokeh installation."""

# Standard library imports
import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package-root", type=Path, required=True)
    parser.add_argument("--dependency-root", type=Path, action="append", default=[])
    args = parser.parse_args()
    package_root = args.package_root.resolve()
    sys.path[:0] = [str(package_root), *[str(path.resolve()) for path in args.dependency_root]]

    # Bokeh imports
    import bokeh
    from bokeh.document import Document
    from bokeh.models import ColumnDataSource, DataTable, GlyphRenderer, Scatter, Slider, TableColumn
    from bokeh.models.dom import Div
    from bokeh.models.widgets import Div as WidgetDiv

    expected = package_root / "bokeh" / "__init__.py"
    assert Path(bokeh.__file__).resolve() == expected, f"Expected Bokeh at {expected}, got {bokeh.__file__}"

    source = ColumnDataSource(name="source", data=dict(x=[1, 2], y=[3, 4]))
    glyph = Scatter(name="glyph", x="x", y="y")
    renderer = GlyphRenderer(name="renderer", data_source=source, glyph=glyph)
    slider = Slider(name="slider", start=0, end=10, value=3)
    column = TableColumn(name="column", field="x", title="X")
    table = DataTable(name="table", source=source, columns=[column])
    dom = Div(name="dom", children=["qualified model"])
    widget = WidgetDiv(name="widget", text="unqualified model")

    doc = Document()
    for root in [renderer, slider, table, dom, widget]:
        doc.add_root(root)

    models = {
        model.name: dict(class_name=type(model).__name__, qualified_name=model.__qualified_model__)
        for model in [source, glyph, renderer, slider, column, table, dom, widget]
    }
    print(json.dumps(dict(document=doc.to_json(deferred=False), models=models)))


if __name__ == "__main__":
    main()
