import {
    injectable,
    inject
} from 'inversify';

import * as Promise from 'bluebird';

import {
    LoggerFactory,
    ILogger,
    IEnvironmentLogger
} from 'ts-smart-logger';

import {Utils} from './utils';
import {
    ScriptElement,
    MetaElement,
    BlockElement,
    LinkElement,
    CssElement,
    DomElement,
    SandboxDocumentAccessor, 
    IElement
} from './dom';
import {ResourcePathProvider} from './path';
import {Profile} from './api';

export interface IScriptOptions {
    fnOrPath:Function|string;
    parent?:IElement;
    version?:string;
}

export interface ILinkOptions {
    path:string;
    version?:string;
}

/**
 * A sandbox environment for a dynamic code of bootloader.
 * The sandbox solution has a number of advantages than the solution based on <script scr="http://localhost:3001/bc/loader.js?_dc=123">:
 *
 * 1. "eval" of a dynamic code can be wrapped at try/catch => a user can see a right message
 * 2. private scope within sandbox bootloader (loader.js) - you can safely define a local variable (via var) within bootloader
 * 3. you can handle the case when a loader does not exist within the data center (HTTP 404)
 * 4. the solution based on <script scr="http://localhost:3001/bc/loader.js?_dc=123"> does not allows load the related scripts
 *    explicitly (via DOM api) without modifying <base>
 */
export class Sandbox {

    private static logger:ILogger = LoggerFactory.makeLogger(Sandbox);

    private __dataCenterPath:string;

    /**
     * For public usage within sandbox
     */
    private isStandAloneEnvironment:boolean;

    /**
     * For public usage within sandbox
     */
    private profile:Profile;

    constructor(sandboxConfig:ISandboxConfig,
                private __resourcePathProvider:ResourcePathProvider,
                private __domAccessor:SandboxDocumentAccessor) {

        this.__dataCenterPath = sandboxConfig.dataCenterPath;
        this.profile = sandboxConfig.profile;
        this.isStandAloneEnvironment = sandboxConfig.isStandAloneEnvironment;
    }

    /**
     * @override
     */
    public applyLink():LinkElement {
        return this.__domAccessor.makeLink().build();
    }

    /**
     * @override
     */
    public applyCss(options:ILinkOptions):Promise<CssElement> {
        return new Promise<CssElement>((resolve, reject) => {
            const path:string = this.buildResourcePath(options.path, options.version);

            const cssElement:CssElement = this.__domAccessor.makeCss()
                .setHref(path)
                .build();

            cssElement.setOnErrorCallback(() => reject(new Error(`The css ${path} has been loaded unsuccessfully`)));
            cssElement.setOnLoadCallback(() => resolve(cssElement));

            Sandbox.logger.info('[$Sandbox][applyCss] The css has been applied. Css path is', path);
        });
    }

    /**
     * @override
     */
    public applyMeta():MetaElement {
        return this.__domAccessor.makeMeta().build();
    }

    /**
     * We can change base path at runtime if the application needs it.
     */
    public applyBasePath(basePath:string) {
        this.__domAccessor.getBaseElement().setAttribute('href', basePath);
    }

    /**
     * We can change base path at runtime if the application needs it.
     * Generally, we don't have to do this if the loaded application works with absolute URL (http://datacenter.com/api/..)
     */
    public applyDataCenterBasePath() {
        this.applyBasePath(
            this.__resourcePathProvider.getDataCenterFullPath(this.__dataCenterPath)
        );
    }

    /**
     * @override
     */
    public applyTitle(title:string) {
        this.__domAccessor.getTitleElement().innerHTML = title;
    }

    /**
     * @override
     */
    public applyText(text:string):BlockElement {
        return this.__domAccessor.makeBlock().build().setInnerHtml(text);
    }

    /**
     * @override
     */
    public applyElement(tag:string):DomElement {
        return this.__domAccessor.makeElement(tag).build();
    }

    /**
     * @override
     */
    public applyScript(options:IScriptOptions):Promise<void> {
        if (Utils.isString(options.fnOrPath)) {
            const path:string = this.buildResourcePath(options.fnOrPath as string, options.version);

            return new Promise<void>((resolve:Function, reject:Function) => {
                const scriptElement:ScriptElement = this.__domAccessor.makeScript()
                    .setParent(options.parent)
                    .setSrc(path)
                    .build();

                scriptElement.setOnErrorCallback(() => reject(new Error(`The script ${path} has been loaded unsuccessfully`)));
                scriptElement.setOnLoadCallback(resolve);

                Sandbox.logger.info(`[$Sandbox][applyScript] The script ${path} has been applied`);
            });
        } else if (Utils.isFunction(options.fnOrPath)) {
            (options.fnOrPath as Function).call(this);

            Sandbox.logger.debug((logger:IEnvironmentLogger) => {
                logger.write('[$Sandbox][applyScript] The script has been called. Script body is\n', options.fnOrPath.toString());
            });

            return Promise.resolve();
        }

        Sandbox.logger.warn('[$Sandbox][applyScript] The script has unsupported format. Script body is', options.fnOrPath);

        throw new Error('The script format is not recognized: ' + options.fnOrPath);
    }

    private buildResourcePath(path:string, version:string):string {
        return this.__resourcePathProvider.getResourcePath({
            dataCenterPath: this.__dataCenterPath,
            path: path,
            version: version
        });
    }
}

export interface ISandboxConfig {
    source:string;
    dataCenterPath:string;
    isStandAloneEnvironment:boolean;
    profile: Profile;
}

@injectable()
export class SandboxFactory {

    constructor(@inject(ResourcePathProvider) private _resourcePathBuilder:ResourcePathProvider,
                @inject(SandboxDocumentAccessor) private _domAccessor:SandboxDocumentAccessor) {
    }

    /**
     * @override
     */
    public getSandbox(sandboxConfig:ISandboxConfig):Sandbox {
        return new Sandbox(
            sandboxConfig,
            this._resourcePathBuilder,
            this._domAccessor
        );
    }
}

/**
 * Sandbox launcher allows create a sandbox environment for a dynamic code of bootloader and execute it using specific
 * sandbox context. The responsibility area:
 *
 * 1. Create sandbox for a bootloader
 * 2. Run a dynamic code of bootloader on the specific sandbox context
 */
@injectable()
export class SandboxLauncher {

    constructor(@inject(SandboxFactory) private _sandboxFactory:SandboxFactory) {
    }

    /**
     * @override
     */
    public run(sandboxConfig:ISandboxConfig):Promise<void> {
        /**
         * Here executed code of loader using sandbox technique.
         * The dynamic code is executed into sandbox context.
         * The sandbox context consists of useful utils methods such as applyScript and co
         */
        return (() => eval(sandboxConfig.source)).call(this._sandboxFactory.getSandbox(sandboxConfig));
    }
}
