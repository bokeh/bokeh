import ast, sys
from pprint import pprint

import pytest

source = """
class Potato(object):
    def __init__(self, john, paul, george=True, ringo=[1, 2, 3]):
        self.apple = apple
        self.potato = potato

def apple(potato):
    return potato

def potato(apple):
    return apple
"""
new_source = """
class Potato(object):
    def __init__(self, paul, george=True, ringo=[1, 2, 3]):
        self.apple = apple
        self.potato = potato

def apple(potato):
    return potato
"""

if sys.version_info > (3, 0):
    arg_name = "arg"
else:
    arg_name = "id"


def get_arguments(function):
    arguments = function.args.args
    defaults = function.args.defaults
    if defaults:
        argument_names = [getattr(x, arg_name) for x in arguments[:len(arguments) - len(defaults)]]
        default_names = [getattr(x, arg_name) for x in arguments[len(arguments) - len(defaults):]]
        for x in range(len(default_names)):
            argument_names.append({default_names[x]: ast.literal_eval(defaults[x])})
        return argument_names
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

def diff_signatures(old, new):
    old_signature = get_full_signature(old)
    new_signature = get_full_signature(new)
    diff = {}
    intersection = list(set(old_signature) & set(new_signature))
    difference = list(set(old_signature) - set(new_signature))
    diff.update({x: {} for x in difference})
    for x in intersection:
        arguments_diff = []
        for y in old_signature[x]:
            if y not in new_signature[x]:
                arguments_diff.append(y)
        if arguments_diff:
            diff.update({x: arguments_diff})
    return diff


"""
Tests
"""
def test_get_arguments():
    expected = ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}]
    assert expected == get_arguments(parse_source(source)[2])

def test_single_signature():
    expected = {
        "__init__": ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
    }
    assert expected == get_signature(parse_source(source)[2])

def test_get_full_signature():
    expected = {
        "__init__": ["self", "john", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
        "apple": ["potato"],
        "potato": ["apple"]
    }
    assert expected == get_full_signature(source)

def test_get_full_signature_new():
    expected = {
        "__init__": ["self", "paul", {"george": True}, {"ringo": [1, 2, 3]}],
        "apple": ["potato"],
    }
    assert expected == get_full_signature(new_source)

def test_diff_signatures():
    expected = {
        "__init__": ["john"],
        "potato": {}
    }
    assert expected == diff_signatures(source, new_source)

