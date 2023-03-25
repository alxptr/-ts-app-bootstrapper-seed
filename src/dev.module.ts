import {Kernel} from 'inversify';

import {ProductionAppModule} from './prod.module';

export class DevelopmentAppModule extends ProductionAppModule {

    /**
     * @override
     */
    protected configure(IoC:Kernel) {
        super.configure(IoC);

        // TODO rebinding
    }
}
