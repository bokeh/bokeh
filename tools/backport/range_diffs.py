"""Publish reviewable dual-color range diffs for adapted backports."""

# Standard library imports
import re
from collections.abc import Mapping, Sequence
from html import escape, unescape
from io import StringIO
from pathlib import Path

# External imports
from rich.console import Console
from rich.terminal_theme import TerminalTheme
from rich.text import Text

# Bokeh imports
from . import BackportError
from .git import GitRepo
from .github import GitHubAPI
from .models import PlanState

HTML_PREVIEW = "https://htmlpreview.github.io/?"
GITHUB_LIGHT = TerminalTheme(
    (255, 255, 255),
    (31, 35, 40),
    [
        (87, 96, 106),
        (207, 34, 46),
        (26, 127, 55),
        (154, 103, 0),
        (9, 105, 218),
        (130, 80, 223),
        (27, 124, 131),
        (110, 119, 129),
    ],
)
SOFT_HIGHLIGHTS = {
    "background-color: #cf222e": "background-color: #ffebe9; color: #cf222e",
    "background-color: #1a7f37": "background-color: #dafbe1; color: #1a7f37",
    "background-color: #9a6700": "background-color: #fff8c5; color: #9a6700",
    "background-color: #0969da": "background-color: #ddf4ff; color: #0969da",
    "background-color: #8250df": "background-color: #fbefff; color: #8250df",
    "background-color: #1b7c83": "background-color: #ddf4ff; color: #1b7c83",
}
LINE_HIGHLIGHTS = {"+": ("#1a7f37", "diff-added"), "-": ("#cf222e", "diff-removed")}
HTML_FORMAT = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bokeh PR #__NUMBER__ — dual-color range diff</title>
<style>
{stylesheet}
:root {{ color-scheme: light; }}
body {{
    margin: 0;
    background: {background};
    color: {foreground};
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}}
header {{
    padding: 16px 20px;
    border-bottom: 1px solid #d0d7de;
    font-family: system-ui, sans-serif;
}}
h1 {{ margin: 0 0 6px; font-size: 18px; }}
p {{ margin: 0; color: #57606a; font-size: 14px; }}
a {{ color: #0969da; }}
.binary-notice {{
    margin: 16px 20px 0;
    padding: 12px 14px;
    border: 1px solid #d4a72c;
    border-radius: 6px;
    background: #fff8c5;
    font: 14px/1.45 system-ui, sans-serif;
}}
.binary-notice strong {{ display: block; margin-bottom: 4px; }}
.binary-notice ul {{ margin: 6px 0 0; padding-left: 24px; }}
.binary-notice code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }}
.diff-added {{ background: rgb(26 127 55 / 10%); }}
.diff-removed {{ background: rgb(207 34 46 / 10%); }}
pre {{
    margin: 0;
    padding: 20px;
    overflow: auto;
    font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    tab-size: 8;
}}
</style>
</head>
<body>
<header>
  <h1>Bokeh PR #__NUMBER__ — dual-color range diff</h1>
  <p>
    <a href="https://github.com/bokeh/bokeh/commit/__ORIGINAL__">original</a>
    →
    <a href="https://github.com/bokeh/bokeh/commit/__BACKPORT__">backport</a>
  </p>
</header>
__BINARY_NOTICE__
<pre><code>{code}</code></pre>
</body>
</html>
"""


def render_html(
    number: int,
    original: str,
    backport: str,
    range_diff: str,
    binary_files: Sequence[str] = (),
) -> str:
    """Convert Git's ANSI dual-color output to a light standalone HTML page."""
    console = Console(
        file=StringIO(),
        record=True,
        color_system="truecolor",
        width=240,
    )
    console.print(Text.from_ansi(range_diff), end="", soft_wrap=True)
    binary_notice = ""
    if binary_files:
        noun = "file" if len(binary_files) == 1 else "files"
        items = "".join(f"<li><code>{escape(path)}</code></li>" for path in binary_files)
        binary_notice = (
            '<aside class="binary-notice">'
            "<strong>Binary adaptation not shown by <code>git range-diff</code></strong>"
            f"The original and backport patches differ for the following binary {noun}:"
            f"<ul>{items}</ul>"
            "</aside>"
        )
    code_format = (
        HTML_FORMAT.replace("__NUMBER__", str(number))
        .replace("__ORIGINAL__", escape(original))
        .replace("__BACKPORT__", escape(backport))
        .replace("__BINARY_NOTICE__", binary_notice)
    )
    html = console.export_html(theme=GITHUB_LIGHT, code_format=code_format, inline_styles=True)
    for saturated, soft in SOFT_HIGHLIGHTS.items():
        html = html.replace(saturated, soft)
    lines = html.splitlines(keepends=True)
    for index, line in enumerate(lines):
        plain = unescape(re.sub(r"<[^>]+>", "", line)).lstrip()
        for marker, (color, class_name) in LINE_HIGHLIGHTS.items():
            if plain.startswith(marker) and f"color: {color}" in line:
                content = line.removesuffix("\n")
                suffix = "\n" if line.endswith("\n") else ""
                lines[index] = f'<span class="{class_name}">{content}</span>{suffix}'
                break
    return "".join(lines)


def _patch_files(
    git: GitRepo,
    worktree: Path,
    commit: str,
) -> tuple[set[str], dict[str, tuple[str, str]]]:
    numstat = git.run(
        "diff",
        "--numstat",
        "--no-renames",
        f"{commit}^",
        commit,
        cwd=worktree,
    ).stdout
    binary_files: set[str] = set()
    for line in numstat.splitlines():
        fields = line.split("\t", 2)
        if len(fields) == 3 and fields[0] == fields[1] == "-":
            binary_files.add(fields[2])
    raw = git.run(
        "diff",
        "--raw",
        "--no-abbrev",
        "--no-renames",
        f"{commit}^",
        commit,
        cwd=worktree,
    ).stdout
    fingerprints: dict[str, tuple[str, str]] = {}
    for line in raw.splitlines():
        metadata, separator, path = line.partition("\t")
        fields = metadata.split()
        if separator and len(fields) >= 4:
            fingerprints[path] = (fields[2], fields[3])
    return binary_files, fingerprints


def adapted_binary_files(
    git: GitRepo,
    worktree: Path,
    original: str,
    backport: str,
) -> list[str]:
    """Return binary files whose before/after blobs differ between the two patches."""
    original_binary, original_files = _patch_files(git, worktree, original)
    backport_binary, backport_files = _patch_files(git, worktree, backport)
    return sorted(path for path in original_binary | backport_binary if original_files.get(path) != backport_files.get(path))


def generate_range_diff(
    git: GitRepo,
    worktree: Path,
    number: int,
    original: str,
    backport: str,
) -> str:
    """Generate one complete dual-color range-diff page."""
    binary_files = adapted_binary_files(git, worktree, original, backport)
    output = git.run(
        "range-diff",
        "--dual-color",
        "--color=always",
        f"{original}^!",
        f"{backport}^!",
        cwd=worktree,
    ).stdout
    return render_html(number, original, backport, output, binary_files)


def publish_range_diffs(
    api: GitHubAPI,
    git: GitRepo,
    state: PlanState,
) -> Mapping[int, str]:
    """Publish one revision-pinned HTML page per adapted pick in a single gist."""
    adapted = sorted(
        (candidate for candidate in state.accepted if candidate.adapted),
        key=lambda candidate: candidate.number,
    )
    if not adapted:
        return {}

    worktree = Path(state.worktree)
    filenames: dict[int, str] = {}
    files: dict[str, dict[str, str]] = {}
    for candidate in adapted:
        assert candidate.backport_sha is not None
        filename = f"bokeh-{candidate.number}-range-diff.html"
        filenames[candidate.number] = filename
        files[filename] = {
            "content": generate_range_diff(
                git,
                worktree,
                candidate.number,
                candidate.merge_sha,
                candidate.backport_sha,
            ),
        }

    gist = api.request(
        "POST",
        "/gists",
        expected=(201,),
        json={
            "description": f"Bokeh {state.version} adapted backport range diffs",
            "files": files,
            "public": True,
        },
    )
    try:
        return {number: f"{HTML_PREVIEW}{gist['files'][filename]['raw_url']}" for number, filename in filenames.items()}
    except (KeyError, TypeError) as error:
        raise BackportError("GitHub returned an incomplete range-diff gist") from error
