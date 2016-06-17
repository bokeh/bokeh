from bokeh.palettes import viridis, Viridis10

def test_cmap_generator_function():
    assert viridis(10) == Viridis10
