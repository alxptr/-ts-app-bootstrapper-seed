import * as Promise from 'bluebird';
import {
    injectable,
    inject,
    Kernel
} from 'inversify';

import {AppProxy} from './app/proxy';
import {
    IModuleProvider
} from './module';
import {
    Api,
    Account,
    Profile,
    API_TYPES
} from './app/api';
import {AppContext} from './app/context';
import {BaseAppModule} from './base.module';
import {Router} from './app/router';
import {
    SandboxDocument,
    ISandboxDocument,
    IElement,
    IElementList
} from './app/dom';
import {REQUEST_TYPES} from './app/request';
import {IResourcePathOptions} from './app/path';
import {AppStorage} from './app/storage';
import {Utils} from './app/utils';

export const TYPES = {
    Login: Symbol('Login'),
    DataCenter: Symbol('DataCenter'),
    StorageLogin: Symbol('StorageLogin'),
    StorageDataCenter: Symbol('StorageDataCenter')
};

export const TEST_APP_JS:string = 'test-app.js';
const TEST_APP_CONTEXT:string = '';

export const TEST_API_PATH = 'test-api';
export const TEST_API_VERSION = '123';
const TEST_DATA_CENTER_INFO_API = 'dcinfo';

export const TEST_DATA_CENTER_PARAMETER = 'http://localhost:3001';
export const TEST_LOGIN_PARAMETER = 'login';
const TEST_LOGIN_CONTEXT_PARAMETER = TEST_LOGIN_PARAMETER;
const TEST_LOGIN_STORAGE_PARAMETER = TEST_LOGIN_PARAMETER;
const TEST_DATA_CENTER_CONTEXT_PARAMETER = TEST_DATA_CENTER_PARAMETER;
const TEST_DATA_CENTER_STORAGE_PARAMETER = TEST_DATA_CENTER_PARAMETER;

const TEST_DOMAIN = 'test@domain.com';
const TEST_USER_NAME = 'Test user';
const TEST_USER_ID = 12345;
const TEST_USER_VERSION = 1;
const TEST_USER_LANGUAGE = 'ru';

@injectable()
class TestProxy extends AppProxy {

    constructor() {
        super();
    }

    /**
     * @override
     */
    public request(request:RequestInfo, init?:RequestInit):Promise<Response> {
        return Promise.resolve<Response>(null);
    }

    /**
     * @override
     */
    public json<TResponse>(request:RequestInfo, init?:RequestInit):Promise<TResponse> {
        return Promise.resolve<TResponse>(null);
    }

    /**
     * @override
     */
    public text(request:RequestInfo, init?:RequestInit):Promise<string> {
        return Promise.resolve<string>(null);
    }
}

@injectable()
class TestApi extends Api {

    constructor() {
        super();
    }

    /**
     * @override
     */
    public getAccount(login?:string):Promise<Account> {
        return Promise.resolve<Account>(new Account(TEST_DATA_CENTER_PARAMETER, TEST_DOMAIN));
    }

    /**
     * @override
     */
    public getProfile(dataCenterPath:string):Promise<Profile> {
        return Promise.resolve<Profile>(new Profile(TEST_USER_NAME, TEST_DOMAIN, TEST_USER_ID, TEST_USER_VERSION, TEST_USER_LANGUAGE));
    }

    /**
     * @override
     */
    public getLoaderSource(domain:string):Promise<string> {
        return Promise.resolve(
            // "this" object indicates to the Sandbox context
            `this.applyScript({fnOrPath: '${TEST_APP_JS}'});`
        );
    }

    /**
     * @override
     */
    public getResource(options:IResourcePathOptions):Promise<string> {
        return Promise.resolve<string>('');
    }

    /**
     * @override
     */
    public logout():Promise<void> {
        return Promise.resolve();
    }
}

@injectable()
class TestAppContext extends AppContext {

    private _login:string;
    private _dataCenter:string;

    constructor(@inject(TYPES.Login) login:string,
                @inject(TYPES.DataCenter) dataCenter:string) {
        super();

        this._login = login;
        this._dataCenter = dataCenter;
    }

    /**
     * @override
     */
    public getContext():string {
        return TEST_APP_CONTEXT;
    }

    public getLogin():string {
        return this._login;
    }

    public getDataCenter():string {
        return this._dataCenter;
    }

    public clearContext() {
        delete this._login;
        delete this._dataCenter;
    }
}

@injectable()
class TestRouter extends Router {

    constructor() {
        super();
    }

    /**
     * @override
     */
    public login() {
    }

    /**
     * @override
     */
    public dataCenter(dataCenterPath:string) {
    }
}

class TestBaseElement {

    innerHTML:string = '';
    private children:Map<IElement, IElement> = new Map<IElement, IElement>();

    /**
     * @override
     */
    public appendChild(element:IElement) {
        this.children.set(element, element);
    }

    /**
     * @override
     */
    public removeChild(element:IElement):IElement {
        this.children.delete(element);
        return element;
    }
}

class TestElement extends TestBaseElement implements IElement {

    private attributes:{};

    constructor(private loadedSuccessfully:boolean = true) {
        super();
        this.attributes = {};
    }

    set onload(callback:Function) {
        if (this.loadedSuccessfully) {
            callback();
        }
    }

    set onerror(callback:Function) {
        if (!this.loadedSuccessfully) {
            callback();
        }
    }

    /**
     * @override
     */
    public getAttribute(name:string):string {
        return Reflect.get(this.attributes, name);
    }

    /**
     * @override
     */
    public setAttribute(name:string, value:string) {
        Reflect.set(this.attributes, name, value);
    }
}

@injectable()
export class TestSandboxDocument extends TestBaseElement implements ISandboxDocument {

    body:IElement;
    head:IElement;

    private elements:Map<string, IElementList> = new Map<string, IElementList>();

    constructor() {
        super();

        this.body = new TestElement();
        this.head = new TestElement();
    }

    /**
     * @override
     */
    public createElement(tag:string):IElement {
        return this.addElement(tag, new TestElement());
    }

    /**
     * @override
     */
    public getElementsByTagName(tag:string):IElementList {
        return this.elements.get(tag);
    }

    /**
     * @override
     */
    public getElementById(id:string):IElement {
        return null;
    }

    private addElement(tag:string, el:IElement):IElement {
        let list:IElementList = this.elements.get(tag);
        if (!Utils.isPresent(list)) {
            this.elements.set(tag, list = []);
        }
        (list as Array<IElement>).push(el);
        return el;
    }
}

@injectable()
class TestAppStorage extends AppStorage {

    private memory:{};

    constructor() {
        super();
        this.memory = {};
    }

    /**
     * @override
     */
    public get<TValue>(name:string):TValue {
        return Reflect.get(this.memory, name);
    }

    /**
     * @override
     */
    public set<TValue>(name:string, value:TValue) {
        Reflect.set(this.memory, name, value);
    }

    /**
     * @override
     */
    public clear(name:string) {
        Reflect.deleteProperty(this.memory, name);
    }
}

export class TestModule extends BaseAppModule {

    constructor(providers?:Array<IModuleProvider<any>>) {
        super(providers);
    }

    /**
     * @override
     */
    protected configure(IoC:Kernel) {
        super.configure(IoC);

        IoC.bind<AppProxy>(AppProxy).to(TestProxy);
        IoC.bind<Api>(Api).to(TestApi);
        IoC.bind<AppContext>(AppContext).to(TestAppContext);
        IoC.bind<Router>(Router).to(TestRouter);
        IoC.bind<AppStorage>(AppStorage).to(TestAppStorage);
        IoC.bind<ISandboxDocument>(SandboxDocument).toConstantValue(new TestSandboxDocument());

        IoC.bind<string>(TYPES.StorageLogin).toConstantValue(TEST_LOGIN_STORAGE_PARAMETER);
        IoC.bind<string>(TYPES.StorageDataCenter).toConstantValue(TEST_DATA_CENTER_STORAGE_PARAMETER);
        IoC.bind<string>(TYPES.Login).toConstantValue(TEST_LOGIN_CONTEXT_PARAMETER);
        IoC.bind<string>(TYPES.DataCenter).toConstantValue(TEST_DATA_CENTER_CONTEXT_PARAMETER);

        IoC.bind<string>(API_TYPES.DataCenterInfoApi).toConstantValue(TEST_DATA_CENTER_INFO_API);
        IoC.bind<string>(REQUEST_TYPES.ApiPath).toConstantValue(TEST_API_PATH);
        IoC.bind<string>(REQUEST_TYPES.ApiVersion).toConstantValue(TEST_API_VERSION);
    }
}
