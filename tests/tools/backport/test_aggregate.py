# Standard library imports
import unittest

# Bokeh imports
from tests.tools.backport._support import candidate, state_with
from tools.backport import BackportError, aggregate
from tools.backport.models import BackportSummary


class PRBodyTests(unittest.TestCase):
    def test_summarizes_only_accepted_prs_sorted_by_number(self) -> None:
        state = state_with(
            [
                candidate(
                    15261,
                    status="applied",
                    backport_sha="b" * 40,
                ),
                candidate(
                    15217,
                    status="rejected",
                    backport_sha=None,
                ),
                candidate(
                    15233,
                    status="applied",
                    backport_sha="a" * 40,
                ),
            ],
        )

        body = aggregate.render_pr_body(state)

        self.assertLess(body.index("#15233"), body.index("#15261"))
        self.assertNotIn("#15217", body)
        self.assertNotIn("~~", body)
        self.assertIn(
            "| PR | Result | Details |",
            body,
        )
        self.assertIn(
            "> Merge this PR with `python -m tools.backport merge`. Do not use GitHub's web UI.",
            body,
        )
        self.assertIn(
            "[#15233 Fix #15233](https://github.com/bokeh/bokeh/pull/15233) | clean |  |",
            body,
        )
        self.assertNotIn("Original commit", body)
        self.assertNotIn("Backport commit", body)
        self.assertNotIn("[ ]", body)
        self.assertNotIn("checklist", body.lower())
        self.assertNotIn("<!--", body)

    def test_marks_adapted_pick_in_summary(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.adapted = True
        body = aggregate.render_pr_body(
            state_with([item]),
            {15233: "https://htmlpreview.github.io/?https://gist.example/raw/diff.html"},
        )
        self.assertIn(
            "| adapted | [diff](https://htmlpreview.github.io/?https://gist.example/raw/diff.html) |",
            body,
        )

    def test_escapes_title_for_markdown_table(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.title = r"Fix [A]\B | C"
        body = aggregate.render_pr_body(state_with([item]))

        self.assertIn(r"[#15233 Fix \[A\]\\B \| C]", body)
        self.assertEqual(
            aggregate.parse_pr_body(body, "bokeh/bokeh"),
            [BackportSummary(15233, False)],
        )

    def test_generated_summary_round_trips_into_merge_entries(self) -> None:
        clean = candidate(15233, status="applied", backport_sha="a" * 40)
        adapted = candidate(15261, status="applied", backport_sha="b" * 40)
        adapted.adapted = True

        summaries = aggregate.parse_pr_body(
            aggregate.render_pr_body(
                state_with([adapted, clean]),
                {
                    15261: "https://htmlpreview.github.io/?https://gist.example/raw/diff.html",
                },
            ),
            "bokeh/bokeh",
        )

        self.assertEqual(
            summaries,
            [
                BackportSummary(15233, False),
                BackportSummary(15261, True),
            ],
        )

    def test_rejects_hand_edited_summary_rows(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = aggregate.render_pr_body(state_with([item])).replace("| clean |", "| maybe |")

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            aggregate.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_adapted_row_without_range_diff(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        item.adapted = True
        body = aggregate.render_pr_body(state_with([item]))

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            aggregate.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_unrecognized_extra_body_content(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = aggregate.render_pr_body(state_with([item])) + "\n<!-- hidden state -->\n"

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            aggregate.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_hidden_state(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = aggregate.render_pr_body(state_with([item])) + "\n<!-- backport-state\n" + f"15233 {item.merge_sha} {'a' * 40}\n" + "-->\n"

        with self.assertRaisesRegex(BackportError, "invalid aggregate PR summary row"):
            aggregate.parse_pr_body(body, "bokeh/bokeh")

    def test_rejects_changed_merge_instruction(self) -> None:
        item = candidate(15233, status="applied", backport_sha="a" * 40)
        body = aggregate.render_pr_body(state_with([item])).replace(
            "python -m tools.backport merge",
            "gh pr merge",
        )

        with self.assertRaisesRegex(BackportError, "not the generated backport summary"):
            aggregate.parse_pr_body(body, "bokeh/bokeh")
