export const $BootstrapperConfig:AppConfig = {};

export interface AppConfig {
    IS_STANDALONE_MODE?:boolean;                // the default value is false
    DATA_CENTER_APP_PATH?:string;               // the default value is determined automatically => 'http://data-center.domain.com/<DATA_CENTER_APP_PATH>'
    RETURN_URI?:string;                         // the default value is 'return_url'
    API_PATH?:string;                           // the default value is '/api'
    API_VERSION?:string;                        // the default value is '1'
    ACCOUNT_API_PATH?:string;                   // the default value is 'accounts'
    PROFILE_API_PATH?:string;                   // the default value is 'profile', can be null or '' explicitly and can not be considered
    DATA_CENTER_CONTEXT_PARAM?:string;          // the default value is 'dc'
    LOGIN_CONTEXT_PARAM?:string;                // the default value is 'login'
    LOGIN_ROUTE_PATH?:string;                   // the default value is '/login', can be null explicitly and can not be considered
    DATA_CENTER_STORAGE_PARAM?:string;          // the default value is 'host'
    LOGIN_STORAGE_PARAM?:string;                // the default value is 'username'
    USE_LOGIN_CONTEXT?:boolean;                 // the default value is true
    USE_DATA_CENTER_CONTEXT?:boolean;           // the default value is true
    USE_LOGIN_STORAGE?:boolean;                 // the default value is true
    USE_DATA_CENTER_STORAGE?:boolean;           // the default value is false [in production mode]
}
