from bokeh.models.graphs import GraphDataSource, StaticLayoutProvider

def test_graphdatasource_init_props():
    source = GraphDataSource()
    assert source.nodes.data == dict(index=[])
    assert source.edges.data == dict(start=[], end=[])

def test_staticlayoutprovider_init_props():
    provider = StaticLayoutProvider()
    assert provider.node_x == []
    assert provider.node_y == []
    assert provider.edge_xs == [[]]
    assert provider.edge_ys == [[]]
