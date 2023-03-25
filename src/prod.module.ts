import {Kernel} from 'inversify';

import {
    Api,
    ProductionApi,
    API_TYPES
} from './app/api';
import {
    ProductionProxy,
    AppProxy
} from './app/proxy';
import {
    AppContext,
    ProductionAppContext,
    CONTEXT_TYPES,
    STORAGE_TYPES
} from './app/context';
import {
    ProductionAppStorage,
    AppStorage
} from './app/storage';
import {
    Router,
    ProductionRouter,
    ROUTER_TYPES
} from './app/router';
import {REQUEST_TYPES} from './app/request';
import {BaseAppModule} from './base.module';
import {
    ISandboxDocument,
    SandboxDocument,
    IEnvironmentLocation,
    EnvironmentLocation
} from './app/dom';
import {$BootstrapperConfig} from './app/config';

import {Utils} from './app/utils';

export class ProductionAppModule extends BaseAppModule {

    constructor() {
        // Default settings overrides due business requirements
        super([{
            provide: STORAGE_TYPES.UseDataCenterStorage,
            toValue: Utils.or($BootstrapperConfig.USE_DATA_CENTER_STORAGE, false)
        }]);
    }

    /**
     * @override
     */
    protected configure(IoC:Kernel) {
        super.configure(IoC);

        IoC.bind<Api>(Api).to(ProductionApi);
        IoC.bind<AppProxy>(AppProxy).to(ProductionProxy);
        IoC.bind<AppContext>(AppContext).to(ProductionAppContext);
        IoC.bind<AppStorage>(AppStorage).to(ProductionAppStorage);
        IoC.bind<Router>(Router).to(ProductionRouter);
        IoC.bind<ISandboxDocument>(SandboxDocument).toConstantValue(document);
        IoC.bind<IEnvironmentLocation>(EnvironmentLocation).toConstantValue(location);

        IoC.bind<string>(ROUTER_TYPES.LoginRoutePath).toConstantValue(Utils.or($BootstrapperConfig.LOGIN_ROUTE_PATH, '/login'));
        IoC.bind<string>(ROUTER_TYPES.ReturnUriParameter).toConstantValue($BootstrapperConfig.RETURN_URI || 'return_url');
        IoC.bind<string>(REQUEST_TYPES.ApiPath).toConstantValue($BootstrapperConfig.API_PATH || '/api');
        IoC.bind<string>(REQUEST_TYPES.ApiVersion).toConstantValue($BootstrapperConfig.API_VERSION || '1');
        IoC.bind<string>(API_TYPES.DataCenterInfoApi).toConstantValue($BootstrapperConfig.ACCOUNT_API_PATH || 'accounts');
        IoC.bind<string>(CONTEXT_TYPES.DataCenterContextParam).toConstantValue($BootstrapperConfig.DATA_CENTER_CONTEXT_PARAM || 'dc');
        IoC.bind<string>(CONTEXT_TYPES.LoginContextParam).toConstantValue($BootstrapperConfig.LOGIN_CONTEXT_PARAM || 'login');
    }
}
