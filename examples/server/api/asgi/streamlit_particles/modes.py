from dataclasses import dataclass
from pathlib import Path
from typing import Any

import tomllib

Reference = tuple[str, str]
MODE_FILE = Path(__file__).with_name("modes.toml")


@dataclass(frozen=True)
class Mode:
    label: str
    plot_title: str
    controls: tuple[str, str]
    color_title: str
    center_label: str
    description: str
    equation: str
    source_match: str
    wikipedia: Reference
    references: tuple[Reference, ...]


def load_reference(data: dict[str, str]) -> Reference:
    return data["title"], data["url"]


def load_mode(data: dict[str, Any]) -> Mode:
    controls = data["controls"]
    return Mode(
        label=data["label"],
        plot_title=data["plot_title"],
        controls=(controls[0], controls[1]),
        color_title=data["color_title"],
        center_label=data["center_label"],
        description=data["description"],
        equation=data["equation"].strip(),
        source_match=data["source_match"].strip(),
        wikipedia=load_reference(data["wikipedia"]),
        references=tuple(load_reference(reference) for reference in data["references"]),
    )


def load_modes() -> dict[str, Mode]:
    with MODE_FILE.open("rb") as file:
        modes = tomllib.load(file)["modes"]
    return {name: load_mode(data) for name, data in modes.items()}


MODES = load_modes()
