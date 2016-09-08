from __future__ import absolute_import
import ast

import pytest
xfail = pytest.mark.xfail

from ..api_crawler import api_crawler, differ


source = """
class Beatles(object):
    def __init__(self, john, paul, george=True, ringo=[1, 2, 3]):
        self.apple = apple
        self.potato = potato

    def strawberry_fields_forever(self, fields, eyes_closed=True):
        pass

def john(guitar, song="imagine"):
    return guitar

def ringo(drums, beat=[1, 2, 3]):
    return drums
"""

sample_function = """
def sample_function(self):
    pass
"""

sample_class = """
class SampleClass:
    def __init__(self):
        pass
"""


class TestApiCrawler(object):
    crawler = api_crawler("bokeh")

    def test_get_crawl_dict(self):
        crawl_dict = self.crawler.get_crawl_dict()
        assert crawl_dict

    def test_name_is_public(self):
        filename = "_apple"
        assert not self.crawler.is_public(filename)
        filename = "__init__"
        assert self.crawler.is_public(filename)
        filename = "__getattribute__"
        assert self.crawler.is_public(filename)
        filename = "apple"
        assert self.crawler.is_public(filename)

    def test_filename_is_public(self):
        # Should not crawl __init__.py files
        filename = "__init__.py"
        assert not self.crawler.is_public(filename)

        filename = "_apple.py"
        assert not self.crawler.is_public(filename)
        filename = "apple.py"
        assert self.crawler.is_public(filename)

    def test_is_toplevel_function(self):
        parsed_function = ast.parse(sample_function).body[0]
        assert self.crawler.is_toplevel_function(parsed_function)

    def test_is_class(self):
        parsed_class = ast.parse(sample_class).body[0]
        assert self.crawler.is_class(parsed_class)

    def test_get_functions(self):
        functions = self.crawler.get_functions(sample_function)
        assert "sample_function" in functions

    def test_get_classes(self):
        classes = self.crawler.get_classes(sample_class)
        assert "SampleClass" in classes

    def test_get_arguments(self):
        expected = ["drums", {"beat": [1, 2, 3]}]
        assert expected == self.crawler.get_functions(source)["ringo"]

    def test_get_full_signature(self):
        expected = {
            "john": ["guitar", {"song": "imagine"}],
            "ringo": ["drums", {"beat": [1, 2, 3]}]
        }
        assert expected == self.crawler.get_functions(source)


old_version = {
    "models": {},
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": {
                    "thom": ["self", "guitar"],
                    "jonny": ["self"],
                    "colin": ["self", {"bass": [1, 2, 3]}],
                    "ed": ["self"],
                    "phil": ["self", "song", {"drums": [1, 2, 3]}, {"solo": False}]
                }
            },
            "Beatles": {
                "methods": {"here_comes_the_sun": []}
            }
        },
        "functions": {"john": [], "paul": ["bass"], "ringo": [{"beat":[1, 2, 3]}]}
    }
}

new_version = {
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": {
                    "thom": ["self"],
                    "colin": ["self"],
                    "ed": ["self"],
                    "phil": ["self"]},
            },
            "Pixies": {"methods": {"debaser": []}}
        },
        "functions": {"john": [], "paul": [], "george": [], "ringo": [{"beat":[1, 2]}]}
    }
}

expected_diff = {
    "models": {},
    "bands": {
        "classes": {
            "Radiohead": {
                "methods":{
                    "jonny": [],
                    "thom": ["guitar"],
                    "colin": [{"bass": [1, 2, 3]}],
                    "phil": ["song", {"drums": [1, 2, 3]}, {"solo": False}]
                }
            },
            "Beatles": {}
        },
        "functions": {"ringo": [{"beat":[1, 2, 3]}], "paul": ["bass"]}
    }
}

expected_additions = {
    'bands': {
        'classes': {
            'Pixies': {}
        },
        'functions': {"george": [], "ringo": [{"beat":[1, 2]}]}
    }
}

expected_parsed_diff = [
    'DELETED models',
    'DELETED bands.Radiohead.jonny',
    'DELETED bands.Radiohead.thom(guitar)',
    'DELETED bands.Radiohead.colin(bass=[1, 2, 3])',
    'DELETED bands.Radiohead.phil(song, drums=[1, 2, 3], solo=False)',
    'DELETED bands.ringo(beat=[1, 2, 3])',
    'DELETED bands.paul(bass)',
    'DELETED bands.Beatles'
]

expected_parsed_additions = [
    'ADDED bands.george',
    'ADDED bands.Pixies',
    'ADDED bands.ringo(beat=[1, 2])',
]

single_class_old = {
    "bands": {
        "functions": {},
        "classes": {
            "Radiohead": {
                "methods": {"jonny": ["self"], "thom": ["self"], "colin": ["self"], "ed": ["self"], "phil": ["self"]}
            }
        }
    }
}

single_class_new = {
    "bands": {
        "functions": {},
        "classes": {
                "Radiohead": {
                "methods": {"thom": ["self"], "colin": ["self"], "ed": ["self"], "phil": ["self"]}
            }
        }
    }
}

expected_single_class = {
    "bands": {"classes": {"Radiohead": {"methods": {"jonny": []}}}}
}

old_signature = {
    "__init__": ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
    "radiohead": ["self", "thom", "jonny"]
}

new_signature = {
    "__init__": ["self", "paul", "pete", {"george": False}, {"ringo": [1, 2]}],
    "pixies": []
}


class TestDiffer(object):
    differ = differ(old_version, new_version)

    def test_accurate_diff(self):
        self.differ.additions = False
        raw_diff = self.differ.diff_modules()
        assert raw_diff == expected_diff
        self.differ.additions = True
        raw_diff = self.differ.diff_modules()
        assert raw_diff == expected_additions

    def test_get_diff(self):
        diff = self.differ.get_diff()
        expected_diff = expected_parsed_diff + expected_parsed_additions
        for x in diff:
            assert x in expected_diff

    def test_diff_additions(self):
        self.differ.additions = True
        raw_diff = self.differ.diff_modules()
        assert raw_diff == expected_additions

    def test_removed_parsing(self):
        self.differ.additions = False
        raw_diff = self.differ.diff_modules()
        raw_diff = self.differ.pretty_diff(raw_diff)
        for x in expected_parsed_diff:
            assert x in raw_diff

    def test_additions_parsing(self):
        self.differ.additions = True
        raw_diff = self.differ.diff_modules()
        raw_diff = self.differ.pretty_diff(raw_diff)
        for x in expected_parsed_additions:
            assert x in raw_diff

    def test_operators(self):
        a = {"one", "two", "three", "four"}
        b = {"one", "two", "three", "five"}
        assert self.differ.diff_operation(a, b) == ["four"]
        assert self.differ.combinaton_diff_operation(a, b) == ["five"]

    def test_diff_files(self):
        self.differ.additions = False
        intersection, diff = self.differ.diff_files()
        assert list(diff.keys()) == ["models"]
        for x in intersection.keys():
            assert x in ["models", "bands"]
        self.differ.additions = True
        intersection, diff = self.differ.diff_files()
        assert list(diff.keys()) == []
        for x in intersection.keys():
            assert x in ["models", "bands"]

    def test_diff_classes_functions(self):
        self.differ.additions = False
        intersection, diff = self.differ.diff_files()
        diff = self.differ.diff_functions_classes(diff, intersection)
        assert diff["bands"]["functions"] == {"ringo": [{"beat":[1, 2, 3]}], "paul": ["bass"]}
        for x in diff["bands"]["classes"].keys():
            assert x in expected_diff["bands"]["classes"].keys()
        self.differ.additions = True
        intersection, diff = self.differ.diff_files()
        diff = self.differ.diff_functions_classes(diff, intersection)
        assert diff["bands"]["functions"] == {"george": [], "ringo": [{"beat":[1, 2]}]}
        assert list(diff["bands"]["classes"].keys()) == ["Pixies"]

    def test_diff_methods(self):
        self.differ.additions = False
        intersection, diff = self.differ.diff_files()
        diff = self.differ.diff_functions_classes(diff, intersection)
        diff = self.differ.diff_methods(diff, intersection)
        assert diff["bands"]["classes"]["Radiohead"]["methods"] == {"jonny": [],
                "thom": ["guitar"], "colin": [{"bass": [1, 2, 3]}],
                "phil": ["song", {"drums": [1, 2, 3]}, {"solo": False}]
        }

    def test_diff_single_signature(self):
        expected = ["john", {"george": True}, {"ringo": [1, 2, 3]}]
        assert expected == self.differ.diff_single_signature(
            old_signature["__init__"],
            new_signature["__init__"]
        )

    def test_diff_full_signature(self):
        self.differ.additions = False
        expected = {
            "__init__": ["john", {"george": True}, {"ringo": [1, 2, 3]}],
            "radiohead": []
        }
        assert expected == self.differ.diff_signatures(old_signature, new_signature)

    def test_diff_signature_added(self):
        self.differ.additions = True
        expected = {
            "__init__": ["pete", {"george": False}, {"ringo": [1, 2]}],
            "pixies": []
        }
        assert expected == self.differ.diff_signatures(old_signature, new_signature)
