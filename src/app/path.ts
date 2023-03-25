import {
    injectable,
    inject
} from 'inversify';

import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

import {Request, BasicRequest} from './request';
import {Utils} from './utils';

import {
    AppContext,
    IAppContext
} from './context';

export interface IResourcePathOptions {
    dataCenterPath:string;
    path:string;
    version?:string;
    preventCached?:boolean;
}

export const PATH_TYPES = {
    DataCenterAppPath: Symbol('DataCenterAppPath')
};

@injectable()
export class ResourcePathProvider {

    private static logger:ILogger = LoggerFactory.makeLogger(ResourcePathProvider);

    constructor(@inject(AppContext) private _appContext:IAppContext,
                @inject(PATH_TYPES.DataCenterAppPath) private _dataCenterAppPath:string) {
    }

    /**
     * Get the data center full path with context, for example, http://www.domain.com/app/store
     *
     * @param dataCenterPath Data center path for example http://www.domain.com
     * @returns {string} The data center full path with context
     */
    public getDataCenterFullPath(dataCenterPath:string):string {
        return this.getDataCenterFullRequest(dataCenterPath).build();
    }

    /**
     * Get full resource path
     * @param options Resource path options
     * @returns {string} Full resource path
     */
    public getResourcePath(options:IResourcePathOptions):string {
        const request:Request = this.getDataCenterFullRequest(options.dataCenterPath)
            .appendPath(options.path);

        if (options.preventCached === true) {
            request.appendUniqueQuery();
        }
        if (Utils.isNotEmpty(options.version)) {
            request.appendQuery({_dc: options.version});
        }
        return request.build();
    }

    /**
     * @param dataCenterDomain Domain of data center as string value without app context (f.e. domain.com)
     * @returns {Request} Request
     */
    private getDataCenterFullRequest(dataCenterDomain:string):Request {
        ResourcePathProvider.logger.debug('[$ResourcePathProvider][getDataCenterFullRequest] Dynamic app context is',
            this._appContext.getContext(), ', configured app context is', this._dataCenterAppPath);
        
        /**
         * An application path on the router can be empty, but can be not empty.
         * In any case, we suppose that an application path on the router is equal an application path on the data center.
         * Therefore we should repeat the context path during builds full data center path
         */
        return new BasicRequest(dataCenterDomain).appendPath(
            Utils.or(this._dataCenterAppPath, this._appContext.getContext())
        );
    }
}
