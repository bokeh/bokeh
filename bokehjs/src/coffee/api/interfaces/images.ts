import {Model} from "./model";

export interface ImageSource extends Model {
    url: string;
    extra_url_vars: {[key: string]: string};
}
