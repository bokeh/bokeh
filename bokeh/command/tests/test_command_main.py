
import pytest

def test_runs():
    with pytest.raises(SystemExit):
        import bokeh.command.__main__

