import * as DOM from "../../core/util/dom";

interface ToolbarProps {
  location: "above" | "below" | "left" | "right";
  sticky: "sticky" | "non-sticky";
  logo?: "normal" | "grey";
}

export default (props: ToolbarProps): HTMLElement => {
  let logo;
  if (props.logo != null) {
    const cls = props.logo === "grey" ? "bk-grey" : null;
    logo = <a href="http://bokeh.pydata.org/" target="_blank" class={["bk-logo", "bk-logo-small", cls]}></a>
  }

  return (
    <div class={[`bk-toolbar-${props.location}`, `bk-toolbar-${props.sticky}`]}>
      {logo}
      <div class='bk-button-bar'>
        <div class='bk-button-bar-list' type="pan" />
        <div class='bk-button-bar-list' type="scroll" />
        <div class='bk-button-bar-list' type="pinch" />
        <div class='bk-button-bar-list' type="tap" />
        <div class='bk-button-bar-list' type="press" />
        <div class='bk-button-bar-list' type="rotate" />
        <div class='bk-button-bar-list' type="actions" />
        <div class='bk-button-bar-list' type="inspectors" />
        <div class='bk-button-bar-list' type="help" />
      </div>
    </div>
  )
}
