# Standard library imports
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Bokeh imports
from tests.tools.backport._support import candidate, state_with
from tools.backport import range_diffs


class RangeDiffTests(unittest.TestCase):
    def test_generate_range_diff_renders_git_output_verbatim(self) -> None:
        git = MagicMock()
        git.run.return_value.stdout = "complete range diff\n"
        with (
            patch.object(
                range_diffs,
                "adapted_binary_files",
                return_value=["baseline.png"],
            ),
            patch.object(range_diffs, "render_html", return_value="<html>diff</html>") as render,
        ):
            result = range_diffs.generate_range_diff(
                git,
                Path("/tmp/worktree"),
                15249,
                "1" * 40,
                "a" * 40,
            )

        self.assertEqual(result, "<html>diff</html>")
        git.run.assert_called_once_with(
            "range-diff",
            "--dual-color",
            "--color=always",
            f"{'1' * 40}^!",
            f"{'a' * 40}^!",
            cwd=Path("/tmp/worktree"),
        )
        render.assert_called_once_with(
            15249,
            "1" * 40,
            "a" * 40,
            "complete range diff\n",
            ["baseline.png"],
        )

    def test_identifies_only_binary_files_with_different_patch_blobs(self) -> None:
        unchanged = "unchanged.png"
        adapted = "adapted.png"
        with patch.object(
            range_diffs,
            "_patch_files",
            side_effect=[
                ({unchanged, adapted}, {unchanged: ("1", "2"), adapted: ("3", "4")}),
                ({unchanged, adapted}, {unchanged: ("1", "2"), adapted: ("5", "6")}),
            ],
        ):
            result = range_diffs.adapted_binary_files(
                MagicMock(),
                Path("/tmp/worktree"),
                "1" * 40,
                "a" * 40,
            )

        self.assertEqual(result, [adapted])

    def test_renders_complete_dual_color_html(self) -> None:
        html = range_diffs.render_html(
            15249,
            "1" * 40,
            "a" * 40,
            "@@ Metadata\n    cherry picked from commit 3c\n\x1b[31;7m-\x1b[m\x1b[31mold\x1b[m\n\x1b[32;7m+\x1b[m\x1b[32mnew\x1b[m\n",
        )

        self.assertIn("Bokeh PR #15249", html)
        self.assertIn("original", html)
        self.assertIn("backport", html)
        self.assertIn("@@ Metadata", html)
        self.assertIn("cherry picked from commit 3c", html)
        self.assertIn("old", html)
        self.assertIn("new", html)
        self.assertIn("color-scheme: light", html)
        self.assertIn("background-color: #ffebe9; color: #cf222e", html)
        self.assertIn("background-color: #dafbe1; color: #1a7f37", html)
        self.assertIn('<span class="diff-removed">', html)
        self.assertIn('<span class="diff-added">', html)
        self.assertIn(".diff-added { background: rgb(26 127 55 / 10%); }", html)
        self.assertIn(".diff-removed { background: rgb(207 34 46 / 10%); }", html)
        self.assertNotIn("color-scheme: dark", html)

    def test_lists_binary_adaptations_that_git_cannot_render(self) -> None:
        html = range_diffs.render_html(
            15183,
            "1" * 40,
            "a" * 40,
            "range diff\n",
            ["bokehjs/test/baselines/linux/example<&>.png"],
        )

        self.assertIn("Binary adaptation not shown", html)
        self.assertIn("following binary file:", html)
        self.assertIn("bokehjs/test/baselines/linux/example&lt;&amp;&gt;.png", html)

    def test_publishes_one_revision_pinned_page_per_adapted_pick(self) -> None:
        clean = candidate(15233, status="applied", backport_sha="a" * 40)
        adapted = candidate(15249, status="applied", backport_sha="b" * 40)
        adapted.adapted = True
        state = state_with([clean, adapted])
        api = MagicMock()
        api.request.return_value = {
            "files": {
                "bokeh-15249-range-diff.html": {
                    "raw_url": "https://gist.example/revision/bokeh-15249-range-diff.html",
                },
            },
        }

        with patch.object(range_diffs, "generate_range_diff", return_value="<html>diff</html>"):
            urls = range_diffs.publish_range_diffs(api, MagicMock(), state)

        self.assertEqual(
            urls,
            {
                15249: "https://htmlpreview.github.io/?https://gist.example/revision/bokeh-15249-range-diff.html",
            },
        )
        payload = api.request.call_args.kwargs["json"]
        self.assertEqual(
            list(payload["files"]),
            ["bokeh-15249-range-diff.html"],
        )
        self.assertTrue(payload["public"])
