import ast, os, copy
import yaml


__all__ = ["api_crawler", "diff_modules"]


def diff_modules(old_version, new_version):
    with open(old_version, "r") as f:
        old = f.read()
        old = yaml.load(old)
    with open(new_version, "r") as f:
        new = f.read()
        new = yaml.load(new)
    combined = copy.deepcopy(old)
    combined.update(new)

    diff = {}
    union = {}
    files_union = set(old) & set(new)
    files_diff = set(old) - set(new)

    # Diff files
    for x in combined.keys():
        if x in files_diff:
            diff[x] = combined[x]
            diff[x] = {}
        else:
            union[x] = combined[x]

    # Diff functions and classes
    for x in union.keys():
        old_items = old.get(x, None)
        new_items = new.get(x, None)
        if old_items and new_items:
            function_diff = set(old_items["functions"]) - set(new_items["functions"])
            class_diff = set(list(old_items["classes"].keys())) - set(list(new_items["classes"].keys()))
            if function_diff or list(class_diff):
                diff[x]= copy.deepcopy(union[x])
                if list(class_diff):
                    diff_dict = {y: {"methods": []} for y in class_diff}
                    diff[x]["classes"] = diff_dict
                else:
                    diff[x]["classes"] = {}

                if function_diff:
                    diff[x]["functions"] = list(function_diff)
                else:
                    diff[x]["functions"] = []

    # Diff methods
    for x in union.keys():
        old_classes = old[x].get("classes", None) if old.get(x, None) else {}
        new_classes = new[x].get("classes", None) if new.get(x, None) else {}
        if old_classes and new_classes:
            for y in union[x]["classes"]:
                old_methods = old[x]["classes"].get(y, None)
                new_methods = new[x]["classes"].get(y, None)
                if old_methods and new_methods:
                    methods_diff = list(set(list(old_methods.values())[0]) - set(list(new_methods.values())[0]))
                    if methods_diff:
                        diff[x] = union[x]
                        diff[x]["classes"][y]["methods"] = methods_diff

    with open("diff.yaml", "w") as f:
        yaml.dump(diff, f, default_flow_style=False)
    return diff


class APICrawler(object):
    exclude = ("tests", "static", "sampledata", "mplexplorer")

    def __init__(self, directory):
        self.directory = directory

    def is_public(self, name):
        if name.startswith("_", 0, 1) and name != "__init__":
            return False
        else:
            return True

    def is_function(self, ast_node):
        if isinstance(ast_node, ast.FunctionDef) and ast_node.col_offset == 0:
            return True
        else:
            return False

    def is_class(self, ast_node):
        if isinstance(ast_node, ast.ClassDef):
            return True
        else:
            return False

    def get_classes(self, source):
        parsed = ast.parse(source)
        classes = [node for node in ast.walk(parsed) if self.is_class(node) and self.is_public(node.name)]
        class_defs = {}
        for x in classes:
            class_defs[x.name] = {}
            methods = []
            for y in x.body:
                if type(y) == ast.FunctionDef and self.is_public(y.name):
                    methods.append(y.name)
            class_defs[x.name]["methods"] = methods
        return class_defs

    def get_functions(self, source):
        parsed = ast.parse(source)
        functions = [node for node in ast.walk(parsed) if self.is_function(node) and self.is_public(node.name)]
        functions = [x.name for x in functions]
        return functions

    def get_filenames(self, directory):
        files = []
        tree = os.walk(directory, topdown=True, followlinks=False)
        for dirpath, dirnames, filenames in tree:
            for folder in self.exclude:
                if folder in dirpath:
                    break
            else:
                for name in filenames:
                    if name.endswith(".py") and not name.startswith("_"):
                        files.append(dirpath + "/" + name)
        return files

    def get_files_dict(self, filenames):
        files_dict = {}
        for x in filenames:
            with open(x, "r") as f:
                source = f.read()
                files_dict[x] = {"classes": {}, "functions": []}
                files_dict[x]["classes"] = self.get_classes(source)
                files_dict[x]["functions"] = self.get_functions(source)
        return files_dict

    def dump_yaml(self, output_file):
        files = self.get_filenames(self.directory)
        files_dict = self.get_files_dict(files)
        with open(output_file, "w") as stream:
            yaml.dump(files_dict, stream, default_flow_style=False)


api_crawler = APICrawler
