# Bokeh imports
from bokeh.sphinxext._internal.bokeh_model_page import _model_class_uri


def test_model_class_uri() -> None:
    assert (
        _model_class_uri(
            "docs/reference/models/tools/CrosshairTool/index",
            "docs/reference/models/tools/CrosshairTool/index.html",
            ".html",
        )
        == "docs/reference/models/tools/CrosshairTool/"
    )


def test_nested_model_class_uri() -> None:
    assert (
        _model_class_uri(
            "docs/reference/models/widgets/buttons/Button/index",
            "docs/reference/models/widgets/buttons/Button/index.html",
            ".html",
        )
        == "docs/reference/models/widgets/buttons/Button/"
    )


def test_non_model_uri_is_unchanged() -> None:
    assert (
        _model_class_uri(
            "docs/reference/models/tools",
            "docs/reference/models/tools.html",
            ".html",
        )
        == "docs/reference/models/tools.html"
    )
