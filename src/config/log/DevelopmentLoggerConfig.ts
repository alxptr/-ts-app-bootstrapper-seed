import {
    LoggerLevelEnum,
    ILoggerConfig
} from 'ts-smart-logger';

const ALL_PACKAGES_AND_CLASSES_REGEXP:string = '.';

export class DevelopmentLoggerConfig implements ILoggerConfig {

    debugLevelPath:string = ALL_PACKAGES_AND_CLASSES_REGEXP;
    infoLevelPath:string = ALL_PACKAGES_AND_CLASSES_REGEXP;
    logLevelPath:string = ALL_PACKAGES_AND_CLASSES_REGEXP;
    warnLevelPath:string = ALL_PACKAGES_AND_CLASSES_REGEXP;
    errorLevelPath:string = ALL_PACKAGES_AND_CLASSES_REGEXP;
    logLevel:LoggerLevelEnum = LoggerLevelEnum.DEBUG_LEVEL;
}
