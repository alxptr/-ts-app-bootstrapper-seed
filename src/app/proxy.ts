import * as Promise from 'bluebird';
import {injectable} from 'inversify';

import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

export class ProxyError extends Error {

    constructor(private status:number,
                private statusText:string,
                private request:RequestInfo) {
        super();
    }

    public getStatus():number {
        return this.status;
    }

    public getStatusText():string {
        return this.statusText;
    }

    public getRequest():RequestInfo {
        return this.request;
    }
}

export class UnauthorizedError extends Error {

    constructor(message?:string) {
        super(message);
    }
}

export class NotExistError extends Error {

    constructor(message?:string) {
        super(message);
    }
}

@injectable()
export abstract class AppProxy {

    abstract request(request:RequestInfo, init?:RequestInit):Promise<Response>;

    abstract json<TResponse>(request:RequestInfo, init?:RequestInit):Promise<TResponse>;

    abstract text(request:RequestInfo, init?:RequestInit):Promise<string>;
}

@injectable()
export class ProductionProxy extends AppProxy {

    private static logger:ILogger = LoggerFactory.makeLogger(ProductionProxy);

    constructor() {
        super();
    }

    /**
     * @override
     */
    public request(request:RequestInfo, init?:RequestInit):Promise<Response> {
        ProductionProxy.logger.debug('[$ProductionProxy][request] Request is', request);

        init = init || {};
        init.credentials = 'include'; // CORS is enabled
        
        return new Promise<Response>((resolve, reject) => {
            fetch(request, init)
                .then((response:Response) => {
                    ProductionProxy.logger.debug('[$ProductionProxy][request] Response is', response,
                        ', response status is', response.status, ', request is', request);

                    if (response.status >= 200 && response.status < 300) {
                        resolve(response);
                    } else {
                        switch (response.status) {
                            case 401:
                                reject(new UnauthorizedError());
                                break;
                            case 404:
                                reject(new NotExistError());
                                break;
                            default:
                                reject(new ProxyError(response.status, response.statusText, request));
                        }
                    }
                });
        });
    }

    /**
     * @override
     */
    public json<TResponse>(request:RequestInfo, init?:RequestInit):Promise<TResponse> {
        return this.request(request, init).then((response:Response) => response.json());
    }

    /**
     * @override
     */
    public text(request:RequestInfo, init?:RequestInit):Promise<string> {
        return this.request(request, init).then((response:Response) => response.text());
    }
}
