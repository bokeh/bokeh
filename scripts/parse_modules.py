import ast, os, copy
import yaml


__all__ = ["api_crawler"]



class APICrawler(object):
    exclude = ("tests", "static", "sampledata", "mplexplorer")

    def __init__(self, directory):
        self.directory = directory

    def is_public(self, name):
        return not name.startswith("_", 0, 1) or name == "__init__"

    def is_function(self, ast_node):
        return isinstance(ast_node, ast.FunctionDef) and ast_node.col_offset == 0

    def is_class(self, ast_node):
        return isinstance(ast_node, ast.ClassDef)

    def get_classes(self, source):
        parsed = ast.parse(source)
        classes = [node for node in ast.walk(parsed) if self.is_class(node) and self.is_public(node.name)]
        class_defs = {}
        for x in classes:
            class_defs[x.name] = {}
            methods = []
            for y in x.body:
                if isinstance(y, ast.FunctionDef) and self.is_public(y.name):
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
                        files.append(os.path.join(dirpath, name))
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

    @staticmethod
    def diff_modules(former, latter):
        combined = copy.deepcopy(former)
        combined.update(latter)

        diff = {}
        union = {}
        files_union = set(former) & set(latter)
        files_diff = set(former) - set(latter)

        # Diff files
        for x in combined.keys():
            if x in files_diff:
                diff[x] = combined[x]
                diff[x] = {}
            else:
                union[x] = combined[x]

        # Diff functions and classes
        for x in union.keys():
            former_items = former.get(x)
            latter_items = latter.get(x)
            if former_items and latter_items:
                function_diff = set(former_items["functions"]) - set(latter_items["functions"])
                class_diff = set(list(former_items["classes"].keys())) - set(list(latter_items["classes"].keys()))
                if function_diff or list(class_diff):
                    diff[x]= copy.deepcopy(union[x])
                    if list(class_diff):
                        diff_dict = {y: {} for y in class_diff}
                        diff[x]["classes"] = diff_dict
                    else:
                        diff[x]["classes"] = {}

                    if function_diff:
                        diff[x]["functions"] = list(function_diff)
                    else:
                        diff[x]["functions"] = []

        # Diff methods
        for x in union.keys():
            former_classes = former[x].get("classes") if former.get(x) else {}
            latter_classes = latter[x].get("classes") if latter.get(x) else {}
            if former_classes and latter_classes:
                for y in union[x]["classes"]:
                    # Prevent NoneType errors by returning empty dict.
                    former_methods = former[x]["classes"].get(y, {})
                    latter_methods = latter[x]["classes"].get(y, {})
                    if former_methods.get("methods") and latter_methods.get("methods"):
                        methods_diff = list(set(list(former_methods.values())[0]) - set(list(latter_methods.values())[0]))
                        if methods_diff:
                            diff[x] = union[x]
                            diff[x]["classes"][y]["methods"] = methods_diff

        return diff

    @staticmethod
    def parse_diff(diff, added=False):
        parsed_diff = []
        if added:
            method = "ADDED"
        else:
            method = "DELETED"
        for x in diff.keys():
            formatted_string = "%s %s" % (method, os.path.splitext(x.replace("/", "."))[0])
            if diff[x].values():
                for y in diff[x].values():
                    if isinstance(y, dict) and y:
                        for z in y.keys():
                            if not y[z].values():
                                parsed_diff.append("%s.%s" % (formatted_string, z))
                            else:
                                for a in y[z].values():
                                    for b in a:
                                        parsed_diff.append("%s.%s.%s" % (formatted_string, z, b))
                    elif isinstance(y, list) and y:
                        for z in y:
                            class_string = "%s" % z
                            parsed_diff.append("%s.%s" % (formatted_string, class_string))
            else:
                parsed_diff.insert(0, formatted_string)
        return parsed_diff


api_crawler = APICrawler
