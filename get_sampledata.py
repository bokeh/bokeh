import os
import re
from os.path import join, isdir, isfile

regex = "(:|bokeh\.)sampledata(:|\.| import )\s*(\w+(\,\s*\w+)*)"
folders = ["plotting","models"]

csv_dirs = ["bokeh","sphinxext","sampledata.csv"]
cwd = os.getcwd()

csv_path = join(cwd, *csv_dirs)
if isfile(csv_path):
    os.remove(csv_path)
    with open(csv_path, "a") as csv:
        csv.write("path;imported sampledata;documented sampledata;missing documentation\n")

for p in path:
    for file in os.listdir(join(cwd,"examples", p, "file")):
        _lp = join("examples", p, "file", file)
        pp  = join(cwd,_lp)
        if isdir(pp) or file.startswith(".") or file.startswith("__"):
            continue

        with open(pp, "r") as f:
            matches = re.findall(regex, f.read())
            
        if matches:
            documented = []
            imported = []
            for m in matches:
                keywords = m[2].replace(" ","")
                if m[0] == "bokeh.":
                    imported.extend(keywords.split(","))
                else:
                    documented.extend(keywords.split(","))
            imported = sorted(imported)
            documented = sorted(documented)
            missing = imported != documented
            with open(csv_path, "a") as csv:
                csv.write(f"{_lp};{imported};{documented};{missing}\n")
