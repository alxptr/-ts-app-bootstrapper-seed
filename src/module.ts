import * as Promise from 'bluebird';

import {
    Kernel,
    interfaces
} from 'inversify';

import {App} from './app';
import {Utils} from './app/utils';

export type PrimitiveType = string|number|boolean;

export interface IModuleProvider<TClass> {
    provide:interfaces.ServiceIdentifier<TClass>,
    toValue?:{new (...args:any[]):TClass}|PrimitiveType,
    toConstantValue?:TClass
}

export abstract class AppModule {

    private IoC:Kernel;

    constructor(private providers?:Array<IModuleProvider<any>>) {
        this.IoC = new Kernel();

        this.configure(this.IoC);

        if (Utils.isNotEmpty(this.providers)) {
            for (let provider of Object.keys(this.providers)) {
                const moduleProvider:IModuleProvider<any> = this.providers[provider];
                if (this.IoC.isBound(moduleProvider.provide)) {
                    this.IoC.unbind(moduleProvider.provide);
                }
                if (Utils.isPrimitive(moduleProvider.toValue) 
                    || Utils.isNotEmpty(moduleProvider.toConstantValue) 
                    || !Utils.isPresent(moduleProvider.toValue)) {
                    this.IoC.bind<any>(moduleProvider.provide).toConstantValue(
                        moduleProvider.toConstantValue || moduleProvider.toValue as PrimitiveType
                    );
                } else {
                    this.IoC.bind<any>(moduleProvider.provide).to(moduleProvider.toValue as {new (...args:any[]):any});
                }
            }
        }
    }

    protected abstract configure(IoC:Kernel);

    public getInstance<TInstance>(ctor:{new(...args:Array<any>):TInstance}):TInstance {
        return this.IoC.get<TInstance>(ctor);
    }

    public init():Promise<void> {
        return this.IoC.get<App>(App).init();
    }
}
