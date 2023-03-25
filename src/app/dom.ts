import {
    injectable,
    inject
} from 'inversify';

import {
    LoggerFactory,
    ILogger
} from 'ts-smart-logger';

import {
    ProxyError,
    NotExistError
} from './proxy';
import {Utils} from './utils';

export interface IBaseElement {
    appendChild(element:IBaseElement);
    removeChild(element:IBaseElement):IBaseElement;
}

export interface IElement extends IBaseElement {
    setAttribute(name:string, value:string);
    getAttribute(name:string);
    innerHTML:string;
    onload:Function;
    onerror:Function;
}

export interface IElementList {
    length:number;
    [index:number]:IElement;
}

export interface ISandboxDocument extends IBaseElement {
    createElement(tag:string):IElement;
    getElementsByTagName(tag:string):IElementList;
    getElementById(id:string):IElement;
    body:IElement;
    head:IElement;
}

@injectable()
export abstract class SandboxDocument implements ISandboxDocument {
    abstract createElement(tag:string):IElement;

    abstract getElementsByTagName(tag:string):IElementList;

    abstract getElementById(id:string):IElement;

    abstract appendChild(element:IElement);

    abstract removeChild(element:IElement):IElement;

    body:IElement;
    head:IElement;
}

export const ENVIRONMENT_TYPES = {
    StandaloneMode: Symbol('StandaloneMode')
};

export interface IEnvironmentLocation {
    assign(url:string);
}

@injectable()
export abstract class EnvironmentLocation implements IEnvironmentLocation {
    abstract assign(url:string);
}

export class DomElement {

    private static logger:ILogger = LoggerFactory.makeLogger(DomElement);

    protected parent:IElement;
    protected element:IElement;
    protected src:String = '';
    protected href:String = '';

    constructor(private tag:string, protected _document:ISandboxDocument) {
        this.element = _document.createElement(tag);
    }

    public setParent(parent:IElement):DomElement {
        this.parent = parent;
        return this;
    }

    public setAttribute(name:string, value:string):DomElement {
        this.element.setAttribute(name, value);
        return this;
    }

    public setInnerHtml(innerHTML:string):DomElement {
        this.element.innerHTML = innerHTML;
        return this;
    }

    public setHref(href:string):DomElement {
        this.href = href;
        return this;
    }

    public setSrc(src:string):DomElement {
        this.src = src;
        return this;
    }

    public getElement():IElement {
        return this.element;
    }

    public setOnLoadCallback(onload:Function) {
        this.element.onload = () => {
            DomElement.logger.debug('[$DomElement][onload] The element', this.src || this.href, 'has been loaded successfully');
            onload();
        };
    }

    public setOnErrorCallback(onerror:Function) {
        this.element.onerror = () => {
            DomElement.logger.debug('[$DomElement][onerror] The element', this.src || this.href, 'has been loaded unsuccessfully');
            onerror();
        };
    }

    public build():DomElement {
        (this.parent || this._document.body).appendChild(this.element);
        return this;
    }
}

export class BaseElement extends DomElement {

    constructor(_document:ISandboxDocument) {
        super('base', _document);
        this.setParent(this._document.head);
    }
}

export class TitleElement extends DomElement {

    constructor(_document:ISandboxDocument) {
        super('title', _document);
        this.setParent(this._document.head);
    }
}

export const SCRIPT_TAG = 'script';

export class ScriptElement extends DomElement {

    constructor(_document:ISandboxDocument) {
        super(SCRIPT_TAG, _document);
        this.setAttribute('type', 'text/javascript');
    }

    /**
     * @override
     */
    public setSrc(src:string):ScriptElement {
        this.setAttribute('src', src);
        return super.setSrc(src);
    }
}

export class MetaElement extends DomElement {

    constructor(_document:ISandboxDocument) {
        super('meta', _document);
        this.setParent(_document.head);
    }
}

export class LinkElement extends DomElement {

    constructor(_document:ISandboxDocument) {
        super('link', _document);
        this.setParent(_document.head);
    }
}

export class CssElement extends LinkElement {

    constructor(_document:ISandboxDocument) {
        super(_document);
        this.setAttribute('rel', 'stylesheet');
    }

    /**
     * @override
     */
    public setHref(value:string):CssElement {
        this.setAttribute('href', value);
        return super.setHref(value);
    }

    /**
     * @override
     */
    public build():CssElement {
        return super.build() as CssElement;
    }
}

export class BlockElement extends DomElement {

    constructor(_document:ISandboxDocument) {
        super('div', _document);
    }
}

@injectable()
export class SandboxDocumentAccessor {

    private static logger:ILogger = LoggerFactory.makeLogger(SandboxDocumentAccessor);

    constructor(@inject(SandboxDocument) private _document:ISandboxDocument) {
    }

    public getBaseElement():IElement {
        return this.buildElement('base', BaseElement);
    }

    public getTitleElement():IElement {
        return this.buildElement('title', TitleElement);
    }

    public makeScript():ScriptElement {
        return new ScriptElement(this._document);
    }

    public makeLink():ScriptElement {
        return new LinkElement(this._document);
    }

    public makeCss():ScriptElement {
        return new CssElement(this._document);
    }

    public makeMeta():ScriptElement {
        return new MetaElement(this._document);
    }

    public makeBlock():ScriptElement {
        return new BlockElement(this._document);
    }

    public makeElement(tag:string):ScriptElement {
        return new DomElement(tag, this._document);
    }

    private buildElement(tag:string, ctor:{new(...args:Array<any>):DomElement}):IElement {
        const el:IElement = this.getElementByTagName(tag);
        if (Utils.isPresent(el)) {
            return el;
        }
        const titleEl:IElement = Reflect.construct(ctor, [this._document]).build().getElement();

        SandboxDocumentAccessor.logger.debug('[$SandboxDocumentAccessor][getElement] ', tag, ' element has been created');
        return titleEl;
    }

    private getElementByTagName(tag:string):IElement {
        return this._document.getElementsByTagName(tag)[0];
    }
}

@injectable()
export class View {

    private static logger:ILogger = LoggerFactory.makeLogger(View);

    private _errorWrapper:BlockElement;

    constructor(@inject(SandboxDocument) private _document:ISandboxDocument) {
    }

    /**
     * @override
     */
    public applyErrorMessage(error:Error) {
        if (!this._errorWrapper) {
            (this._errorWrapper = new BlockElement(this._document)).build();
        }

        if (error instanceof ProxyError) {
            this._errorWrapper.setInnerHtml(
                `An error occurred during the application initialization.<br>Additional info is:<br>${error.getStatus()} : ${error.getStatusText()} : ${error.getRequest()}`
            );
        } else if (error instanceof NotExistError) {
            this._errorWrapper.setInnerHtml(
                `An error occurred during the application initialization.<br>The document is not found`
            );
        } else {
            this._errorWrapper.setInnerHtml(
                `An error occurred during the application initialization.<br>Additional info is: ${error.message}`
            );
        }
    }

    /**
     * @override
     */
    public cleaningViewBeforeLaunch() {
        const progressPlaceholder:IElement = this._document.getElementById('progress-placeholder');

        if (progressPlaceholder) {
            this._document.body.removeChild(progressPlaceholder);

            View.logger.debug('[$View][cleaningViewBeforeLaunch] Cleaning of dom structure has been executed');
        } else {
            View.logger.warn('[$View][cleaningViewBeforeLaunch] The progress placeholder element is not found');
        }
    }

    /**
     * @override
     */
    public cleaningView() {
        this._document.body.innerHTML = '';
    }
}
