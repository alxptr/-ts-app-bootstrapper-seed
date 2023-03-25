import {
    injectable,
    inject
} from 'inversify';

import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

import {
    BasicRequest,
    Request
} from './request';
import {ResourcePathProvider} from './path';
import {Utils} from './utils';
import {
    IEnvironmentLocation,
    EnvironmentLocation
} from './dom';

export const ROUTER_TYPES = {
    LoginRoutePath: Symbol('LoginRoutePath'),
    ReturnUriParameter: Symbol('ReturnUriParameter')
};

@injectable()
export abstract class Router {

    abstract login();

    abstract dataCenter(dataCenterPath:string);
}

@injectable()
export class ProductionRouter extends Router {

    private static logger:ILogger = LoggerFactory.makeLogger(ProductionRouter);

    constructor(@inject(ResourcePathProvider) private _resourcePathProvider:ResourcePathProvider,
                @inject(ROUTER_TYPES.ReturnUriParameter) private _returnUriParameter:string,
                @inject(ROUTER_TYPES.LoginRoutePath) private _loginRoutePath:string,
                @inject(EnvironmentLocation) private _environmentLocation:IEnvironmentLocation) {
        super();
    }

    /**
     * @override
     */
    public login() {
        if (Utils.isNotPresent(this._loginRoutePath) || Utils.isEmpty(this._loginRoutePath)) {
            ProductionRouter.logger.debug('[$ProductionRouter][dataCenter] Login path is empty', this._loginRoutePath, ', therefore will not go');
            return;
        }

        const assignedPage:string = this.getLoginPagePath();

        ProductionRouter.logger.debug('[$ProductionRouter][login] Redirect to the login page', assignedPage);
        this._environmentLocation.assign(assignedPage);
    }

    /**
     * @override
     */
    public dataCenter(dataCenterPath:string) {
        const assignedPage:string = this._resourcePathProvider.getDataCenterFullPath(dataCenterPath);

        ProductionRouter.logger.debug('[$ProductionRouter][dataCenter] Redirect to the data center. Redirect path is', assignedPage);
        this._environmentLocation.assign(assignedPage);
    }

    private getLoginPagePath():string {
        return new BasicRequest()
            .appendPath(this._loginRoutePath)
            .setFragment(this._returnUriParameter, new Request().build(true))
            .build();
    }
}
