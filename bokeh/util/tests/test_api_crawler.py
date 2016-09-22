from __future__ import absolute_import
import ast
import pytest


from ..api_crawler import api_crawler, differ


sample_class = """
class SampleClass:
    def __init__(self):
        pass
"""

sample_function = """
def sample_function(self):
    pass
"""

sample_code = """
class SampleClass:
    def __init__(self):
        pass
def sample_function(self):
    pass
"""


@pytest.fixture
def test_crawler():
    return api_crawler("bokeh")


def test_get_crawl_dict(test_crawler):
    crawl_dict = test_crawler.get_crawl_dict()
    assert crawl_dict


def test_name_is_public(test_crawler):
    filename = "_apple"
    assert not test_crawler.is_public(filename)
    filename = "__init__"
    assert test_crawler.is_public(filename)
    filename = "__getattribute__"
    assert test_crawler.is_public(filename)
    filename = "apple"
    assert test_crawler.is_public(filename)


def test_filename_is_public(test_crawler):
    # Should not crawl __init__.py files
    filename = "__init__.py"
    assert not test_crawler.is_public(filename)

    filename = "_apple.py"
    assert not test_crawler.is_public(filename)
    filename = "apple.py"
    assert test_crawler.is_public(filename)


def test_is_toplevel_function(test_crawler):
    parsed_function = ast.parse(sample_function).body[0]
    assert test_crawler.is_toplevel_function(parsed_function)


def test_is_class(test_crawler):
    parsed_class = ast.parse(sample_class).body[0]
    assert test_crawler.is_class(parsed_class)


def test_get_functions(test_crawler):
    functions = test_crawler.get_functions(sample_code)
    assert "sample_function" in functions


def test_get_classes(test_crawler):
    classes = test_crawler.get_classes(sample_code)
    assert "SampleClass" in classes


old_version = {
    "models": {},
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": ["thom", "jonny", "colin", "ed", "phil"]
            },
            "Beatles": {
                "methods": ["Here Comes the Sun"]
            }
        },
        "functions": ["john", "paul", "ringo"]
    }
}

new_version = {
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": ["thom", "colin", "ed", "phil"]
            },
            "Pixies": {"methods": ["debaser"]}
        },
        "functions": ["john", "paul", "george"]
    }
}

expected_diff = {
    "models": {},
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": ["jonny"]
            },
            "Beatles": {}
        },
        "functions": ["ringo"]
    }
}

expected_additions = {
    'bands': {
        'classes': {
            'Pixies': {}
        },
        'functions': ['george']
    }
}

expected_parsed_diff = [
    'DELETED models',
    'DELETED bands.Radiohead.jonny',
    'DELETED bands.Apple',
    'DELETED bands.ringo',
    'DELETED bands.Beatles'
]

expected_parsed_additions = [
    'ADDED bands.george',
    'ADDED bands.Pixies'
]

single_class_old = {
    "bands": {"functions": [], "classes": {"Radiohead": {"methods": ["thom", "jonny", "colin", "ed", "phil"]}}}
}

single_class_new = {
    "bands": {"functions": [], "classes": {"Radiohead": {"methods": ["thom", "colin", "ed", "phil"]}}}
}

expected_single_class = {
    "bands": {"classes": {"Radiohead": {"methods": ["jonny"]}}}
}


@pytest.fixture
def test_differ():
    return differ(old_version, new_version)


def test_accurate_diff(test_differ):
    test_differ.additions = False
    raw_diff = test_differ.diff_modules()
    assert raw_diff == expected_diff


def test_catch_key_error(test_differ):
    test_differ.additions = False
    test_differ.former = single_class_old
    test_differ.latter = single_class_new
    raw_diff = test_differ.diff_modules()
    assert raw_diff == expected_single_class

    test_differ.former = old_version
    test_differ.latter = new_version


def test_get_diff(test_differ):
    diff = test_differ.get_diff()
    expected_diff = expected_parsed_diff + expected_parsed_additions
    for x in diff:
        assert x in expected_diff


def test_diff_additions(test_differ):
    test_differ.additions = True
    raw_diff = test_differ.diff_modules()
    assert raw_diff == expected_additions


def test_removed_parsing(test_differ):
    test_differ.additions = False
    raw_diff = test_differ.diff_modules()
    raw_diff = test_differ.pretty_diff(raw_diff)
    for x in raw_diff:
        assert x in expected_parsed_diff


def test_additions_parsing(test_differ):
    test_differ.additions = True
    raw_diff = test_differ.diff_modules()
    raw_diff = test_differ.pretty_diff(raw_diff)
    for x in raw_diff:
        assert x in expected_parsed_additions


def test_operators(test_differ):
    a = {"one", "two", "three", "four"}
    b = {"one", "two", "three", "five"}
    assert test_differ.diff_operation(a, b) == ["four"]
    assert test_differ.combinaton_diff_operation(a, b) == ["five"]


def test_diff_files(test_differ):
    test_differ.additions = False
    intersection, diff = test_differ.diff_files()
    assert list(diff.keys()) == ["models"]
    for x in intersection.keys():
        assert x in ["models", "bands"]
    test_differ.additions = True
    intersection, diff = test_differ.diff_files()
    assert list(diff.keys()) == []
    for x in intersection.keys():
        assert x in ["models", "bands"]


def test_diff_classes_functions(test_differ):
    test_differ.additions = False
    intersection, diff = test_differ.diff_files()
    diff = test_differ.diff_functions_classes(diff, intersection)
    assert diff["bands"]["functions"] == ["ringo"]
    for x in diff["bands"]["classes"].keys():
        assert x in expected_diff["bands"]["classes"].keys()
    test_differ.additions = True
    intersection, diff = test_differ.diff_files()
    diff = test_differ.diff_functions_classes(diff, intersection)
    assert diff["bands"]["functions"] == ["george"]
    assert list(diff["bands"]["classes"].keys()) == ["Pixies"]


def test_diff_methods(test_differ):
    test_differ.additions = False
    intersection, diff = test_differ.diff_files()
    diff = test_differ.diff_functions_classes(diff, intersection)
    diff = test_differ.diff_methods(diff, intersection)
    assert diff["bands"]["classes"]["Radiohead"]["methods"] == ["jonny"]
