import * as Promise from 'bluebird';

import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

import {
    injectable,
    inject
} from 'inversify';

import {
    Api,
    Account,
    Profile, 
    API_TYPES
} from './app/api';
import {SandboxLauncher} from './app/sandbox';
import {
    AppContext,
    StorageContext,
    IContext,
    IStorageContext
} from './app/context';
import {Utils} from './app/utils';
import {
    UnauthorizedError,
    NotExistError
} from './app/proxy';
import {Router} from './app/router';
import {
    View,
    ENVIRONMENT_TYPES
} from './app/dom';

/**
 * Main application entry point. The responsibility area:
 *
 * 1. Checking the session
 * 2. Validation of input parameters
 * 3. Retrieve data center URI
 * 4. Loading the loader.js
 * 5. Executing thr loader.js
 * 6. Clearing bootstrap context (if necessarily)
 */
@injectable()
export class App {

    private static logger:ILogger = LoggerFactory.makeLogger(App);

    public constructor(@inject(Api) private _api:Api,
                       @inject(AppContext) private _appContext:IContext,
                       @inject(StorageContext) private _storageContext:IStorageContext,
                       @inject(Router) private _router:Router,
                       @inject(View) private _view:View,
                       @inject(SandboxLauncher) private _sandboxLauncher:SandboxLauncher,
                       @inject(API_TYPES.ProfileInfoApi) private _profileInfoApi:string,
                       @inject(ENVIRONMENT_TYPES.StandaloneMode) private _standaloneMode:boolean) {
    }

    /**
     * Main entry point
     */
    public init():Promise<void> {
        this._view.cleaningViewBeforeLaunch();

        if (this.isLogoutNeeded()) {
            return this._api.logout().finally(() => {
                // Clear the previous local user context
                this._storageContext.clearContext();

                // Session reinitialization
                return this.doInit();
            });
        } else {
            return this.doInit();
        }
    }

    private doInit():Promise<void> {
        /**
         * Scheme:
         *      context login -> http://router.com/api/1/accounts?login=ContextLogin -> context data center
         *      context data center -> load boot.js from context data center
         */
        const login:string = this._appContext.getLogin();
        const dataCenter:string = this._appContext.getDataCenter();
        const storageLogin:string = this._storageContext.getLogin();
        const storageDataCenter:string = this._storageContext.getDataCenter();

        if (Utils.isNotEmpty(dataCenter)) {
            /**
             * A context data center is present
             */
            if (Utils.isNotEmpty(login)) {
                App.logger.debug('[$App][doInit] A context user is present and a context data center is present. Initialization using context data center', dataCenter);

                /**
                 * http://router.com/#dc=dc1-dc.domain.com&login=login1
                 * A context user is present and a context data center is present. Don't look at a context user
                 */
                return this.retrieveLoaderAndExecute(dataCenter);
            } else {
                App.logger.debug('[$App][doInit] A context user is not present and a context data center is present. Initialization using context data center', dataCenter);

                /**
                 * http://router.com/#dc=dc1-dc.domain.com
                 * A context user is not present and a context data center is present
                 */
                return this.retrieveLoaderAndExecute(dataCenter);
            }
        } else {
            /**
             * A context data center is not present
             */
            if (Utils.isNotEmpty(login)) {
                App.logger.debug('[$App][doInit] A context user is present and a context data center is not present. Initialization using context user', login);

                /**
                 * http://router.com/#login=login1
                 * A context user is present and a context data center is not present
                 */
                return this.initializationUsingLogin(login);
            } else {
                /**
                 * http://router.com/#
                 * A context user is not present and a context data center is not present. Trying look at storage context
                 */
                if (Utils.isNotEmpty(storageDataCenter)) {
                    App.logger.debug('[$App][doInit] A context user is not present and a context data center is not present.' +
                        ' But the storage data center is present. Initialization using the storage data center', storageDataCenter);

                    /**
                     * http://router.com/#
                     * Storage: dc=dc1-dc.domain.com
                     *
                     * A context user is not present and a context data center is not present. But the storage data center is present.
                     * Don't look at the storage user
                     */
                    return this.retrieveLoaderAndExecute(storageDataCenter);
                } else {
                    if (Utils.isNotEmpty(storageLogin)) {
                        App.logger.debug('[$App][doInit] A context user is not present and a context data center is not present.' +
                            ' But the storage login is present. Initialization using the storage login', storageLogin);

                        /**
                         * http://router.com/#
                         * Storage: login=login1
                         *
                         * A context user is not present and a context data center is not present. But the storage login is present.
                         */
                        return this.initializationUsingLogin(storageLogin);
                    } else {
                        App.logger.debug('[$App][doInit] No one parameter is present. Checking the environment, maybe it is different');

                        return new Promise<void>((resolve, reject) => {
                            const standAloneDataCenterPath:string = location.origin;

                            if (this._standaloneMode) {
                                App.logger.debug('[$App][doInit] The environment is "stand-alone" because initial parameter is present');

                                this.retrieveLoaderSource(standAloneDataCenterPath, true).then(resolve, reject);
                            } else {
                                this._api.getAccount()
                                    .catch((error:Error) => {
                                        if (error instanceof NotExistError) {
                                            App.logger.debug('[$App][doInit] The environment is "stand-alone" because account info API is not available, but an activation process has started via bootloader');

                                            this.retrieveLoaderSource(standAloneDataCenterPath, true).then(resolve, reject);
                                        } else {
                                            App.logger.debug('[$App][doInit] The environment is a part of cloud space, therefore going to login page');
                                            this._router.login();

                                            resolve();
                                        }
                                    });
                            }
                        });
                    }
                }
            }
        }
    }

    private initializationUsingLogin(login:string):Promise<void> {
        return this._api.getAccount(login)
            .then((account:Account) => {
                const dataCenterPathByLogin:string = account.getServerUrl();
                App.logger.debug('[$App][init] A context data center has been received. Initialization using the context login',
                    login, 'and the context data center', dataCenterPathByLogin);

                return this.retrieveLoaderAndExecute(dataCenterPathByLogin);
            }, (error:Error) => {
                if (error instanceof UnauthorizedError) {
                    App.logger.debug('[$App][initializationUsingLogin] An access error occurred while trying to load account info. Go to login page');

                    this._router.login();
                } else {
                    App.logger.debug('[$App][initializationUsingLogin] An error occurred while trying to load account info. Error is', error);

                    this._view.applyErrorMessage(error);
                }
            });
    }

    private retrieveLoaderAndExecute(dataCenterPath:string):Promise<void> {
        if (Utils.isNotPresent(this._profileInfoApi) || Utils.isEmpty(this._profileInfoApi)) {
            App.logger.debug('[$App][retrieveLoaderAndExecute] The profile will not be loaded because custom settings, data center is', dataCenterPath);
            return this.retrieveLoaderSource(dataCenterPath, false);
        }

        return this._api.getProfile(dataCenterPath)
            .then((profile:Profile) => {
                App.logger.debug('[$App][retrieveLoaderAndExecute] The profile', profile, 'is loaded. The user is authorized, data center is', dataCenterPath);

                return this.retrieveLoaderSource(dataCenterPath, false, profile);
            }, (error:Error) => {
                if (error instanceof UnauthorizedError) {
                    App.logger.debug('[$App][retrieveLoaderAndExecute] An access error occurred while trying to load profile info. Go to login page');

                    this._router.login();
                } else {
                    App.logger.debug('[$App][retrieveLoaderAndExecute] An error occurred while trying to load profile info. Error is', error);

                    this._view.applyErrorMessage(error);
                }
            });
    }

    private retrieveLoaderSource(dataCenterPath:string, isStandAloneEnvironment:boolean, profile?:Profile):Promise<void> {
        return this._api.getLoaderSource(dataCenterPath)
            .then((source:string) => {
                if (isStandAloneEnvironment) {
                    App.logger.debug('[$App][retrieveLoaderSource] The bootloader is loaded and the environment is "stand-alone". Data center is', dataCenterPath, ', source is\n', source);
                } else {
                    App.logger.debug('[$App][retrieveLoaderSource] The bootloader is loaded. Data center is', dataCenterPath, ', source is\n', source);
                }

                try {
                    const result:Promise<void> = this._sandboxLauncher.run({
                        source: source,
                        dataCenterPath: dataCenterPath,
                        profile: profile,
                        isStandAloneEnvironment: isStandAloneEnvironment
                    });

                    App.logger.debug('[$App][retrieveLoaderSource] The bootloader has been finished successfully!');
                    return result;
                } catch (error) {
                    App.logger.debug('[$App][retrieveLoaderSource] An error occurred while trying to execute the bootloader. Error is', error);

                    this._view.cleaningView();
                    this._view.applyErrorMessage(error);

                    return Promise.reject(error);
                }
            }, (error:Error) => {
                if (error instanceof UnauthorizedError) {
                    App.logger.debug('[$App][retrieveLoaderSource] An access error occurred while trying to load the bootloader. Go to a login page. Data center is', dataCenterPath);

                    this._router.login();
                } else if (error instanceof NotExistError) {
                    if (isStandAloneEnvironment) {
                        App.logger.debug('[$App][retrieveLoaderSource] An error occurred while trying to load the bootloader and the environment is "stand-alone". Data center is', dataCenterPath, ', error is', error);

                        this._view.applyErrorMessage(error);
                    } else {
                        App.logger.debug('[$App][retrieveLoaderSource] The bootloader is not found. Go to data center', dataCenterPath);

                        this._router.dataCenter(dataCenterPath);
                    }
                } else {
                    App.logger.debug('[$App][retrieveLoaderSource] An error occurred while trying to load the bootloader. Data center is', dataCenterPath, ', error is', error);

                    this._view.applyErrorMessage(error);
                }
            });
    }

    private isLogoutNeeded():boolean {
        const login:string = this._appContext.getLogin();
        const dataCenter:string = this._appContext.getDataCenter();
        const storageLogin:string = this._storageContext.getLogin();
        const storageDataCenter:string = this._storageContext.getDataCenter();

        if (login === storageLogin && dataCenter === storageDataCenter) {
            App.logger.debug('[$App][isLogoutNeeded] There is a full match. Logout operation is not needed', login, dataCenter);
            return false;
        }

        if ((Utils.isNotEmpty(storageLogin) || Utils.isNotEmpty(storageDataCenter)) && Utils.isEmpty(login) && Utils.isEmpty(dataCenter)) {
            App.logger.debug('[$App][isLogoutNeeded] A user is authorized and context values are absent. Logout operation is not needed. The values:', storageLogin, storageDataCenter);
            return false;
        }

        if (Utils.isEmpty(storageLogin) && Utils.isEmpty(storageDataCenter) && (Utils.isNotEmpty(login) || Utils.isNotEmpty(dataCenter))) {
            App.logger.debug('[$App][isLogoutNeeded] An user is not authorized and context user or context data center is present. Logout operation is not needed. The values:', login, dataCenter);
            return false;
        }

        App.logger.debug('[$App][isLogoutNeeded] Logout operation is needed. The values:', login, dataCenter, storageLogin, storageDataCenter);
        return true;
    }
}
