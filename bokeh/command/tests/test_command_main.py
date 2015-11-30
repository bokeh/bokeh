
import pytest

def test_runs():
    with pytest.raises(SystemExit):
        import bokeh.command.__main__
        bokeh # shut up flake8

