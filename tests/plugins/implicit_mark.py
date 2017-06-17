from _pytest.mark import matchmark

def pytest_addoption(parser):
    parser.addini("implicit_marker",
                  "An implicit marker to assign to any test otherwise unmarked")

def pytest_collection_modifyitems(items, config):
    implicit_marker = config.getini("implicit_marker")
    if not implicit_marker:
        return

    markers = []
    for line in config.getini("markers"):
        mark, rest = line.split(":", 1)
        if '(' in mark:
            mark, rest = mark.split("(", 1)
        markers.append(mark)

    all_markers = ' or '.join(markers)
    if not all_markers:
        return

    for item in items:
        if not matchmark(item, all_markers):
            item.add_marker(implicit_marker)
