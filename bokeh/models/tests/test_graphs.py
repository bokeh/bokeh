from bokeh.models.graphs import GraphDataSource, StaticLayoutProvider
from bokeh.models.sources import ColumnDataSource

def test_graphdatasource_init_props():
    source = GraphDataSource()
    assert source.nodes.data == dict(index=[])
    assert source.edges.data == dict(start=[], end=[])
    assert source.layout_provider is None

def test_graphdatasource_check_missing_subcolumn_no_errors():
    source = GraphDataSource()

    check = source._check_missing_subcolumns()
    assert check == []

def test_graphdatasource_check_missing_subcolumn_no_node_index():
    node_source = ColumnDataSource()
    source = GraphDataSource(nodes=node_source)

    check = source._check_missing_subcolumns()
    assert check != []

def test_graphdatasource_check_missing_subcolumn_no_edge_start_or_end():
    edge_source = ColumnDataSource()
    source = GraphDataSource(edges=edge_source)

    check = source._check_missing_subcolumns()
    assert check != []

def test_staticlayoutprovider_init_props():
    provider = StaticLayoutProvider()
    assert provider.graph_layout == {}
