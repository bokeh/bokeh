import ast, sys
from pprint import pprint

import pytest

source = """
class Potato(object):
    def __init__(self, john, paul, george=True, ringo=[1, 2, 3]):
        self.apple = apple
        self.potato = potato
        self.john = john

def apple(potato):
    return potato
"""
old_source ="""
class Potato(object):
    def __init__(self, john, paul, george=True, ringo=[1, 2, 3]):
        self.apple = apple
        self.potato = potato
        self.john = john

def apple(potato):
    return potato
"""

if sys.version_info > (3, 0):
    print("Yay!")
    arg_name = "arg"
else:
    print("Aww...")
    arg_name = "id"


def get_arguments(function):
    arguments = function.args.args
    defaults = function.args.defaults
    if defaults:
        default_names = [getattr(x, arg_name) for x in arguments[len(defaults) + 1:]]
        arguments = [getattr(x, arg_name) for x in arguments[:len(defaults) + 1]]
        for x in range(len(default_names)):
            arguments.append({default_names[x]: ast.literal_eval(defaults[x])})
        return arguments
    else:
        return [getattr(x, arg_name) for x in arguments]

def get_signature(function):
    arguments = get_arguments(function)
    return {
        function.name: get_arguments(function)
    }

def parse_source(source):
    parsed = ast.parse(source)
    parsed = [node for node in ast.walk(parsed) if isinstance(node, ast.FunctionDef)]
    return parsed

def get_full_signature(source):
    full_signature = {}
    functions = parse_source(source)
    for x in functions:
        full_signature.update(get_signature(x))
    return full_signature

def diff_function(old, new):
    pass

def diff_signatures(old, new):
    old_signature = get_full_signature(old)
    new_signature = get_full_signature(new)
    print(old_signature, new_signature)


"""
Tests
"""
def test_get_arguments():
    expected = ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}]
    assert expected == get_arguments(parse_source(source)[1])

def test_single_signature():
    expected = {
        "__init__": ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
    }
    assert expected == get_signature(parse_source(source)[1])

def test_get_full_signature():
    expected = {
        "__init__": ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
        "apple": ["potato"]
    }
    pprint(get_full_signature(source))
    assert expected == get_full_signature(source)

def test_diff_signatures():
    expected = {
        "__init__": ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
        "apple": ["potato"]
    }
