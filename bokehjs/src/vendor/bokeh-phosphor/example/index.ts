
import {
  Widget,
  Layout,
  BoxPanel
} from '../lib/index';


function main() {

  let firstWidget = new Widget();
  let secondWidget = new Widget();
  let thirdWidget = new Widget();

  let firstPanel = new BoxPanel();
  BoxPanel.setStretch( firstWidget, 1 );
  BoxPanel.setStretch( secondWidget, 2 );
  firstPanel.direction = BoxPanel.LeftToRight;
  firstPanel.spacing = 5;
  firstPanel.addChild( firstWidget );
  firstPanel.addChild( secondWidget );

  let secondPanel = new BoxPanel();
  secondPanel.direction = BoxPanel.TopToBottom;
  secondPanel.spacing = 5;
  secondPanel.addChild( firstPanel );
  secondPanel.addChild( thirdWidget );

}

window.onload = main;
