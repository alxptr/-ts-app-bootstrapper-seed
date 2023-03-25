import * as Promise from 'bluebird';

import {
    injectable,
    inject
} from 'inversify';

import {ApiRequestFactory} from './request';
import {AppProxy} from './proxy';
import {UriHelper} from './uri';
import {
    ResourcePathProvider, 
    IResourcePathOptions
} from './path';

export interface IAccount {
    server_url:string;
    login:string
}

export class Account implements IAccount {

    constructor(public server_url:string, public login:string) {
    }

    public getServerUrl():string {
        return this.server_url;
    }
}

export interface IProfile {
    lastname?:string;
    login?:string;
    user_id?:number;
    version?:number;
    language?:string;
}

export class Profile implements IProfile {

    constructor(
        public lastname?:string,
        public login?:string,
        public user_id?:number,
        public version?:number,
        public language?:string
    ) {
    }
}

@injectable()
export abstract class Api {

    public abstract logout():Promise<void>;

    public abstract getAccount(login?:string):Promise<Account>;

    public abstract getProfile(login:string):Promise<Profile>;

    public abstract getLoaderSource(dataCenterPath:string):Promise<string>;

    public abstract getResource(options:IResourcePathOptions):Promise<string>;
}

export const API_TYPES = {
    BootstrapFile: Symbol('BootstrapFile'),
    DataCenterInfoApi: Symbol('DataCenterInfoApi'),
    ProfileInfoApi: Symbol('ProfileInfoApi')
};

@injectable()
export class ProductionApi extends Api {

    constructor(@inject(AppProxy) private _proxy:AppProxy,
                @inject(ApiRequestFactory) private _apiRequestFactory:ApiRequestFactory,
                @inject(API_TYPES.BootstrapFile) private _bootstrapFile:string,
                @inject(API_TYPES.DataCenterInfoApi) private _dataCenterInfoApi:string,
                @inject(API_TYPES.ProfileInfoApi) private _profileInfoApi:string,
                @inject(ResourcePathProvider) private _resourcePathBuilder:ResourcePathProvider) {
        super();
    }

    /**
     * @override
     */
    public getProfile(dataCenterPath:string):Promise<Profile> {
        const request:string = this._apiRequestFactory.getInstance(dataCenterPath)
            .appendPath(this._profileInfoApi)
            .appendUniqueQuery()
            .build();

        return this._proxy.json<Profile>(request)
            // Profile should have dynamic constructor because it is passed into the sandbox
            .then((profile:IProfile) => Object.freeze(Object.assign(new Profile(), profile)));
    }

    /**
     * @override
     */
    public getAccount(login?:string):Promise<Account> {
        const request:string = this._apiRequestFactory.getInstance()
            .appendQuery({
                login: login
            })
            .appendUniqueQuery()
            .appendPath(this._dataCenterInfoApi)
            .build();

        return this._proxy.json<Account>(request)
            .then((account:IAccount) => Object.freeze(
                new Account(
                    UriHelper.decode(account.server_url),
                    account.login
                ))
            );
    }

    /**
     * @override
     */
    public getLoaderSource(domain:string):Promise<string> {
        return this.getResource({
            dataCenterPath: domain,
            path: this._bootstrapFile,
            preventCached: true
        });
    }

    /**
     * @override
     */
    public getResource(options:IResourcePathOptions):Promise<string> {
        return this._proxy.text(
            this._resourcePathBuilder.getResourcePath(options)
        );
    }

    /**
     * @override
     */
    public logout():Promise<void> {
        return Promise.resolve();
    }
}
