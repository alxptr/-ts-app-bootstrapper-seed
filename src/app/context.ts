import {
    injectable,
    inject
} from 'inversify';

import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

import {
    UriContext,
    UriContextProvider, 
    UriHelper
} from './uri';
import {Utils} from './utils';
import {AppStorage} from './storage';

export const CONTEXT_TYPES = {
    LoginContextParam: Symbol('LoginContextParam'),
    DataCenterContextParam: Symbol('DataCenterContextParam'),
    UseLoginContext: Symbol('UseLoginContext'),
    UseDataCenterContext: Symbol('UseDataCenterContext')
};

export const STORAGE_TYPES = {
    LoginStorageParam: Symbol('LoginStorageParam'),
    DataCenterStorageParam: Symbol('DataCenterStorageParam'),
    UseLoginStorage: Symbol('UseLoginStorage'),
    UseDataCenterStorage: Symbol('UseDataCenterStorage')
};

export interface IContext {
    getLogin():string;
    getDataCenter():string;
    hasLogin():boolean;
    hasDataCenter():boolean;
}

@injectable()
export abstract class AbstractContext implements IContext {

    abstract getLogin():string;

    abstract getDataCenter():string;

    /**
     * @override
     */
    public hasLogin():boolean {
        return Utils.isNotEmpty(this.getLogin());
    }

    /**
     * @override
     */
    public hasDataCenter():boolean {
        return Utils.isNotEmpty(this.getDataCenter());
    }
}

export interface IAppContext {

    getContext():string;
}

@injectable()
export abstract class AppContext extends AbstractContext implements IAppContext {

    /**
     * @override
     */
    public getContext():string {
        return this.uriContext.getPath();
    }

    protected get uriContext():UriContext {
        return UriContextProvider.provide();
    }
}

@injectable()
export class ProductionAppContext extends AppContext {

    private static logger:ILogger = LoggerFactory.makeLogger(ProductionAppContext);

    constructor(@inject(CONTEXT_TYPES.UseLoginContext) private _useLoginContext:boolean,
                @inject(CONTEXT_TYPES.UseDataCenterContext) private _useDataCenterContext:boolean,
                @inject(CONTEXT_TYPES.DataCenterContextParam) private _dataCenterContextParam:string,
                @inject(CONTEXT_TYPES.LoginContextParam) private _loginContextParam:string) {
        super();
    }

    /**
     * @override
     */
    public getLogin():string {
        if (!this._useLoginContext) {
            ProductionAppContext.logger.warn('[$ProductionAppContext][getLogin] A user context is disabled');
            return null;
        }
        
        return UriHelper.decode(
            Reflect.get(this.uriContext.getUriFragmentAsObject(), this._loginContextParam)
        );
    }

    /**
     * @override
     */
    public getDataCenter():string {
        if (!this._useDataCenterContext) {
            ProductionAppContext.logger.warn('[$ProductionAppContext][getDataCenter] A data center context is disabled');
            return null;
        }
        
        return UriHelper.decode(
            Reflect.get(this.uriContext.getUriFragmentAsObject(), this._dataCenterContextParam)
        );
    }
}

export interface IStorageContext extends IContext {
    clearContext();
}

@injectable()
export class StorageContext extends AbstractContext implements IStorageContext {

    private static logger:ILogger = LoggerFactory.makeLogger(StorageContext);

    constructor(@inject(AppStorage) private _appStorage:AppStorage,
                @inject(STORAGE_TYPES.UseLoginStorage) private _useLoginStorage:boolean,
                @inject(STORAGE_TYPES.UseDataCenterStorage) private _useDataCenterStorage:boolean,
                @inject(STORAGE_TYPES.DataCenterStorageParam) private _dataCenterContextParam:string,
                @inject(STORAGE_TYPES.LoginStorageParam) private _loginContextParam:string) {
        super();
    }

    /**
     * @override
     */
    public getLogin():string {
        if (!this._useLoginStorage) {
            StorageContext.logger.warn('[$StorageContext][getLogin] A user storage is disabled');
            return null;
        }

        return UriHelper.decode(
            this._appStorage.get<string>(this._loginContextParam)
        );
    }

    /**
     * @override
     */
    public getDataCenter():string {
        if (!this._useDataCenterStorage) {
            StorageContext.logger.warn('[$StorageContext][getDataCenter] A data center storage is disabled');
            return null;
        }

        return UriHelper.decode(
            this._appStorage.get<string>(this._dataCenterContextParam)
        );
    }

    /**
     * @override
     */
    public clearContext() {
        this._appStorage.clear(this._loginContextParam);
        this._appStorage.clear(this._dataCenterContextParam);
    }
}
