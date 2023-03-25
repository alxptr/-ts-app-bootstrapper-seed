export class Utils {

    static isPresent(obj) {
        return !this.isUndefined(obj) && !this.isNull(obj);
    }

    static isNotPresent(obj) {
        return !this.isUndefined(obj) && this.isNull(obj);
    }

    static isNotEmpty(obj) {
        return Utils.isPresent(obj) &&
            ((Utils.isString(obj) && obj.length > 0) ||
            (Utils.isArray(obj) && obj.length > 0) ||
            (Utils.isObject(obj) && Object.keys(obj).length > 0));
    }

    static isEmpty(obj) {
        return !Utils.isPresent(obj) || !Utils.isNotEmpty(obj);
    }

    static isNull(obj) {
        return obj === null;
    }
    
    static isUndefined(obj) {
        return typeof obj === 'undefined';
    }

    static isString(obj) {
        return typeof obj === 'string';
    }

    static isNumber(obj) {
        return typeof obj === 'number';
    }

    static isSymbol(obj) {
        return typeof obj === 'symbol';
    }

    static isBoolean(obj) {
        return typeof obj === 'boolean';
    }

    static isObject(obj) {
        return typeof obj === 'object';
    }

    static isFunction(obj) {
        return typeof obj === 'function';
    }

    static isArray(obj) {
        return Array.isArray(obj);
    }

    static isPrimitive(obj) {
        return Utils.isString(obj) || Utils.isBoolean(obj) || Utils.isNumber(obj) || Utils.isSymbol(obj);
    }

    static or(param1:any, param2:any):any {
        return this.isUndefined(param1)
            ? param2
            : param1;
    }
}
