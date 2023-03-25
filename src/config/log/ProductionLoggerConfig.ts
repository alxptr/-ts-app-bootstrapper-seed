import {
    LoggerLevelEnum,
    ILoggerConfig
} from 'ts-smart-logger';

export class ProductionLoggerConfig implements ILoggerConfig {
    
    logLevel:LoggerLevelEnum = LoggerLevelEnum.ERROR_LEVEL;
}
