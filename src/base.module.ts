import {Kernel} from 'inversify';

import {
    API_TYPES
} from './app/api';
import {
    AppModule,
    IModuleProvider
} from './module';
import {ApiRequestFactory} from './app/request';
import {App} from './app';
import {
    CONTEXT_TYPES,
    STORAGE_TYPES,
    StorageContext
} from './app/context';
import {
    ResourcePathProvider,
    PATH_TYPES
} from './app/path';
import {
    SandboxLauncher,
    SandboxFactory
} from './app/sandbox';
import {
    SandboxDocumentAccessor,
    View, 
    ENVIRONMENT_TYPES
} from './app/dom';
import {$BootstrapperConfig} from './app/config';
import {Utils} from './app/utils';

export class BaseAppModule extends AppModule {

    constructor(providers?:Array<IModuleProvider<any>>) {
        super(providers);
    }

    /**
     * @override
     */
    protected configure(IoC:Kernel) {
        IoC.bind<App>(App).to(App);
        IoC.bind<ApiRequestFactory>(ApiRequestFactory).to(ApiRequestFactory);
        IoC.bind<ResourcePathProvider>(ResourcePathProvider).to(ResourcePathProvider);
        IoC.bind<SandboxLauncher>(SandboxLauncher).to(SandboxLauncher);
        IoC.bind<StorageContext>(StorageContext).to(StorageContext);
        IoC.bind<SandboxDocumentAccessor>(SandboxDocumentAccessor).to(SandboxDocumentAccessor);
        IoC.bind<View>(View).to(View);
        IoC.bind<SandboxFactory>(SandboxFactory).to(SandboxFactory);
        
        IoC.bind<boolean>(CONTEXT_TYPES.UseLoginContext).toConstantValue(Utils.or($BootstrapperConfig.USE_LOGIN_CONTEXT, true));
        IoC.bind<boolean>(CONTEXT_TYPES.UseDataCenterContext).toConstantValue(Utils.or($BootstrapperConfig.USE_DATA_CENTER_CONTEXT, true));
        IoC.bind<boolean>(STORAGE_TYPES.UseLoginStorage).toConstantValue(Utils.or($BootstrapperConfig.USE_LOGIN_STORAGE, true));
        IoC.bind<boolean>(STORAGE_TYPES.UseDataCenterStorage).toConstantValue(Utils.or($BootstrapperConfig.USE_DATA_CENTER_STORAGE, true));

        IoC.bind<string>(API_TYPES.BootstrapFile).toConstantValue('loader.js');
        IoC.bind<string>(PATH_TYPES.DataCenterAppPath).toConstantValue($BootstrapperConfig.DATA_CENTER_APP_PATH);
        IoC.bind<boolean>(ENVIRONMENT_TYPES.StandaloneMode).toConstantValue(Utils.or($BootstrapperConfig.IS_STANDALONE_MODE, false));
        
        IoC.bind<string>(STORAGE_TYPES.DataCenterStorageParam).toConstantValue($BootstrapperConfig.DATA_CENTER_STORAGE_PARAM || 'host');
        IoC.bind<string>(STORAGE_TYPES.LoginStorageParam).toConstantValue($BootstrapperConfig.LOGIN_STORAGE_PARAM || 'username');
        IoC.bind<string>(API_TYPES.ProfileInfoApi).toConstantValue(Utils.or($BootstrapperConfig.PROFILE_API_PATH, 'profile'));
    }
}
