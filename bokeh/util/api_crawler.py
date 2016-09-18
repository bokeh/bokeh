import ast, os, copy

__all__ = ["api_crawler", "differ"]


class APICrawler(object):
    """
    Api Crawler: Given a directory, it will use AST to crawl through each of the
    File and produce AST nodes, which can then be parsed into a representation
    of the structure of that file. The execution...
    """

    # Exclude these folders from search.
    exclude = ("tests", "static", "sampledata", "mplexplorer")


    # Point the crawler at this directory.
    def __init__(self, directory):
        self.directory = directory

    def is_public(self, name):
        # Determines whether a given function or class is public or private. Names
        # with underscores are not allowed unless the name is "__init__"
        return not name.startswith("_", 0, 1) or (name.startswith("__") and
                name.endswith("__"))

    def is_toplevel_function(self, ast_node):
        # Checks whether a node is a top level function. Checks whether it is an AST
        # function instance. Also uses column offset, i.e. whether the function has
        # any tabs or spaces before it.
        return isinstance(ast_node, ast.FunctionDef) and ast_node.col_offset == 0

    def is_class(self, ast_node):
        # Checks whether a node is an instance of an ast Class
        return isinstance(ast_node, ast.ClassDef)

    def get_classes(self, source):
        # For a given source, walk through the file looking for classes, and assign
        # the associated methods. Pass them as a dictionary containing each class
        # and its methods.
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
        # For a given source, look for functions and return those functions as a list.
        parsed = ast.parse(source)
        functions = [node.name for node in ast.walk(parsed) if self.is_toplevel_function(node) and self.is_public(node.name)]
        return functions

    def get_filenames(self, directory):
        # Go through the file tree and grab the filnames for each file found.
        # Assign these to an array and return that array.
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
        # Using a list of filenames, open each file and parse functions and classes
        # out of the source file.
        files_dict = {}
        for x in filenames:
            with open(x, "r") as f:
                source = f.read()
                files_dict[x] = {"classes": {}, "functions": []}
                files_dict[x]["classes"] = self.get_classes(source)
                files_dict[x]["functions"] = self.get_functions(source)
        return files_dict

    def get_crawl_dict(self):
        # Generate the crawl information using get_filenames as an argument to
        # get_dict_files
        files = self.get_filenames(self.directory)
        files_dict = self.get_files_dict(files)
        return files_dict


class Differ(object):

    def __init__(self, former, latter):
        self.former = former
        self.latter = latter
        self._additions = False
        self._operation = self.diff_operation

    @property
    def additions(self):
        return self._additions

    @additions.setter
    def additions(self, value):
        # If measuring additions instead of deletions, automatically change operator.
        self._additions = value
        if value:
            self._operation = self.combinaton_diff_operation
        else:
            self._operation = self.diff_operation


    def diff_operation(self, a, b):
        # Use this function to find the difference between two sets of dictionary
        # keys. Uses the set difference operation. Called by the diff_modules
        # function.
        return list(a - b)

    def combinaton_diff_operation(self, a, b):
        # Use a combination of symmetric_difference and difference to return a list
        # of items additions through the crawl. Allows you to get additions items instead of
        # removed items. Would produce the same result if you switched the
        # positions of the former and latter versions. Much more natural and
        # easy control using the different set operators.
        return list((a ^ b) - a)

    def diff_files(self):
        diff = {}
        intersection = {}

        intersection.update(self.latter)
        intersection.update(self.former)
        files_diff = self._operation(set(self.former), set(self.latter))

        # Diff files
        for x in intersection.keys():
            if x in files_diff:
                diff[x] = {}
        return intersection, diff

    def diff_functions_classes(self, diff, intersection):
        for x in intersection.keys():
            former_items = self.former.get(x)
            latter_items = self.latter.get(x)
            if former_items and latter_items:
                function_diff = self._operation(
                    set(former_items["functions"]),
                    set(latter_items["functions"])
                )
                class_diff = self._operation(
                    set(list(former_items["classes"].keys())),
                    set(list(latter_items["classes"].keys()))
                )
                if function_diff or list(class_diff):
                    diff[x]= copy.deepcopy(intersection[x])
                    if list(class_diff):
                        diff_dict = {y: {} for y in class_diff}
                        diff[x]["classes"] = diff_dict
                    else:
                        diff[x]["classes"] = {}

                    if function_diff:
                        diff[x]["functions"] = list(function_diff)
                    else:
                        diff[x]["functions"] = []
        return diff

    def diff_methods(self, diff, intersection):
        for x in intersection.keys():
            former_classes = self.former[x].get("classes") if self.former.get(x) else {}
            latter_classes = self.latter[x].get("classes") if self.latter.get(x) else {}
            if former_classes and latter_classes:
                for y in intersection[x]["classes"]:
                    # Prevent NoneType errors by returning empty dict.
                    former_methods = self.former[x]["classes"].get(y, {})
                    latter_methods = self.latter[x]["classes"].get(y, {})
                    if former_methods.get("methods") and latter_methods.get("methods"):
                        former_values = set(list(former_methods.values())[0])
                        latter_values = set(list(latter_methods.values())[0])
                        methods_diff = self._operation(former_values, latter_values)
                        if methods_diff:
                            if not diff.get(x):
                                diff[x] = {}
                                diff[x]["classes"] = {}
                            diff[x]["classes"][y] = copy.deepcopy(intersection[x]["classes"][y])
                            diff[x]["classes"][y]["methods"] = methods_diff
        return diff

    def diff_modules(self):
        intersection, diff = self.diff_files()
        diff = self.diff_functions_classes(diff, intersection)
        diff = self.diff_methods(diff, intersection)
        return diff

    def pretty_diff(self, diff):
        parsed_diff = []
        if self.additions:
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

    def get_diff(self):
        self.additions = False
        removed = self.pretty_diff(self.diff_modules())
        self.additions = True
        added = self.pretty_diff(self.diff_modules())
        return removed + added


api_crawler = APICrawler
differ = Differ
