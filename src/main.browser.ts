// Polyfills
import 'core-js/es6';
import 'core-js/es7/reflect';

// Vendors
import 'whatwg-fetch';
import 'urijs';
import 'bluebird';
import 'js-cookie';
import 'ts-smart-logger';
import 'inversify';

// Main entry point
import * as Promise from 'bluebird';
import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

// Environments
const IS_PRODUCTION_ENV:boolean = 'production' === ENV;

if (IS_PRODUCTION_ENV) {
    LoggerFactory.configure(require('./config/log/ProductionLoggerConfig').ProductionLoggerConfig);
} else {
    LoggerFactory.configure(require('./config/log/DevelopmentLoggerConfig').DevelopmentLoggerConfig);
}

const mainLogger:ILogger = LoggerFactory.makeLogger('Main');

import {AppModule} from './module';
import {
    $BootstrapperConfig,
    AppConfig
} from './app/config';
import {ProductionProxy} from './app/proxy';
import {UriContextProvider} from './app/uri';

Promise.onPossiblyUnhandledRejection((error) => {
    mainLogger.error('[$Main]', error);
});

export function main() {
    const module:AppModule = IS_PRODUCTION_ENV
        ? Reflect.construct(require('./prod.module').ProductionAppModule, [])
        : Reflect.construct(require('./dev.module').DevelopmentAppModule, []);

    module.init();
}

export function fetchProductionConfigAndExecuteApp() {
    const appName:string = UriContextProvider.provide().joinSubPaths();

    new ProductionProxy().json(['bootstrapper', 'config', appName, 'json?_v=' + Date.now()].filter((item) => !!item).join('.'))
        .then((config:AppConfig)=> {
            mainLogger.debug('[$Main] The bootstrapper config has been loaded:', config);

            Object.assign($BootstrapperConfig, config);
            main();
        }, (error:Error) => {
            mainLogger.warn('[$Main] The bootstrapper config has not been loaded, therefore the application uses the default settings. Error is:', error);

            main();
        });
}

document.addEventListener('DOMContentLoaded', IS_PRODUCTION_ENV ? fetchProductionConfigAndExecuteApp : main);
