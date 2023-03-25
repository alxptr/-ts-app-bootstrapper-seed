import * as uri from 'urijs';

import URI = uri.URI;

import {Utils} from './utils';

const PATH_SEPARATOR = '/';

export class UriHelper {

    public static encode(value:string) {
        return Utils.isNotEmpty(value)
            ? encodeURIComponent(value)
            : value;
    }

    public static decode(value:string) {
        return Utils.isNotEmpty(value)
            ? decodeURIComponent(value)
            : value;
    }

    public static joinArray(paths:Array<string>):string {
        return paths.join(PATH_SEPARATOR);
    }

    public static join(...paths:Array<string>):string {
        return paths.join(PATH_SEPARATOR);
    }
}

export class UriContextProvider {

    public static provide():UriContext {
        const uriObject:URI = uri();

        return new UriContext(
            uriObject.path(),
            uriObject.fragment()
        );
    }
}

export type UriFragmentValue = number | boolean | string;

export interface UriFragment {
    [index:string]:UriFragmentValue;
}

export class UriContext {

    constructor(private path:string, private fragment:string) {
    }

    public getPath():string {
        return this.path;
    }

    public joinSubPaths():string {
        // "/server/app1/" -> server.app1
        return (this.path || '').split(PATH_SEPARATOR).filter((a) => !!a).join('.').toLowerCase();
    }

    public getUriFragment():string {
        return this.fragment;
    }

    public getUriFragmentAsObject():UriFragment {
        return uri.parseQuery(this.fragment) as UriFragment;
    }
}
