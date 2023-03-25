import {injectable} from 'inversify';
import * as Cookies from 'js-cookie';

@injectable()
export abstract class AppStorage {

    abstract get<TValue>(name:string):TValue;

    abstract set<TValue>(name:string, value:TValue);

    abstract clear(name:string);
}

@injectable()
export class ProductionAppStorage extends AppStorage {

    constructor() {
        super();
    }

    /**
     * @override
     */
    public get<TValue>(name:string):TValue {
        return Cookies.getJSON(name);
    }

    /**
     * @override
     */
    public set<TValue>(name:string, value:TValue) {
        Cookies.set(name, value);
    }

    /**
     * @override
     */
    public clear(name:string) {
        Cookies.remove(name);
    }
}
