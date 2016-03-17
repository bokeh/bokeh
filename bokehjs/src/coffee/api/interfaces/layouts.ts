import {Component} from "./component";
import {Int} from "../types";

export interface Layout extends Component {
    width: Int;
    height: Int;
}

export interface BaseBox extends Layout {
    children: Array<Component>;
}

export interface HBox extends BaseBox {}

export interface VBox extends BaseBox {}
