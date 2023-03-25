import * as uri from 'urijs';

import {
    injectable,
    inject
} from 'inversify';

import URI = uri.URI;

import {Utils} from './utils';
import {UriHelper} from './uri';

const EMPTY_VALUE = '';

export class Request {

    protected path:Array<string>;
    protected port:string;
    protected uriObject:URI;

    constructor(host?:string) {
        this.uriObject = Utils.isPresent(host)
            ? uri(host)
            : uri();

        if (this.uriObject.port()) {
            this.port = this.uriObject.port();
        }
        this.path = [this.uriObject.path(true)];
    }

    public appendPath(path:string):Request {
        this.path.push(path);
        return this;
    }

    public appendUniqueQuery():Request {
        this.appendQuery({_dc: Date.now()});
        return this;
    }

    public appendQuery(query:Object):Request {
        this.uriObject.addQuery(query);
        return this;
    }

    public setFragment(name:string, value:string):Request {
        this.uriObject.fragment([name, value].join('='));
        return this;
    }

    public appendPort(port:number):Request {
        this.port = String(port);
        return this;
    }

    public build(encode:boolean = false):string {
        const result:string = this.uriObject
            .port(this.port || EMPTY_VALUE)
            .path(this.preparePath())
            .normalize()
            .toString();

        return encode
            ? UriHelper.encode(result)
            : result;
    }

    protected preparePath():string {
        return UriHelper.joinArray(this.path);
    }
}

export class BasicRequest extends Request {

    constructor(host:string = EMPTY_VALUE) {
        super(host);
    }
}

export const REQUEST_TYPES = {
    ApiPath: Symbol('ApiPath'),
    ApiVersion: Symbol('ApiVersion')
};

export class ApiRequest extends Request {

    constructor(private apiPath:string, private apiVersion:string, host:string = EMPTY_VALUE) {
        super(host);
    }

    /**
     * @override
     */
    protected preparePath():string {
        return UriHelper.join(
            this.apiPath,
            this.apiVersion,
            UriHelper.joinArray(this.path)
        );
    }
}

@injectable()
export class ApiRequestFactory {

    constructor(@inject(REQUEST_TYPES.ApiPath) private _apiPath:string,
                @inject(REQUEST_TYPES.ApiVersion) private _apiVersion:string) {
    }

    public getInstance(host?:string):Request {
        return new ApiRequest(this._apiPath, this._apiVersion, host);
    }
}
