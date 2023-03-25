import {
    injectable,
    inject
} from 'inversify';

import {
    BasicRequest,
    ApiRequestFactory
} from './request';
import {
    TEST_API_PATH,
    TEST_API_VERSION,
    TestModule
} from '../test.module';
import {API_TYPES} from './api';
import {AppModule} from '../module';

describe('Request', ()=> {

    describe('Checking BasicRequest', ()=> {
        it('BasicRequest should work correctly. Checking path. Test#0', ()=> {
            expect(
                new BasicRequest('http://www.domain.com:4444').appendPath('bc').build()
            ).toEqual('http://www.domain.com:4444/bc');
        });

        it('BasicRequest should work correctly. Checking port. Test#1', ()=> {
            expect(
                new BasicRequest('http://www.domain.com').appendPort(4444).appendPath('bc').build()
            ).toEqual('http://www.domain.com:4444/bc');
        });

        it('BasicRequest should work correctly. Checking the queries. Test#2', ()=> {
            expect(
                new BasicRequest('http://www.domain.com').appendPort(4444).appendPath('bc').appendQuery({
                    q: 100,
                    m: 200
                }).build()
            ).toEqual('http://www.domain.com:4444/bc?q=100&m=200');
        });

        it('BasicRequest should work correctly. Extra slashes. Test#4', ()=> {
            expect(
                new BasicRequest('http://www.domain.com//').appendPort(4444).appendPath('//bc///').appendQuery({
                    q: 100,
                    m: 200
                }).build()
            ).toEqual('http://www.domain.com:4444/bc/?q=100&m=200');
        });
    });

    describe('Checking ApiRequest', ()=> {
        it('ApiRequest should work correctly. Checking path. Test#0', (done)=> {

            const HOST:string = 'http://www.domain.com:4444';

            @injectable()
            class TestApiRequestFactoryHolder {

                constructor(@inject(ApiRequestFactory) private apiRequestFactory:ApiRequestFactory,
                            @inject(API_TYPES.DataCenterInfoApi) private _dataCenterInfoApi:string) {

                    expect(this.apiRequestFactory.getInstance(HOST).appendPath(this._dataCenterInfoApi).build())
                        .toEqual(`${HOST}/${TEST_API_PATH}/${TEST_API_VERSION}/${this._dataCenterInfoApi}`);
                }
            }

            const module:AppModule = new TestModule([
                {
                    provide: TestApiRequestFactoryHolder,
                    toValue: TestApiRequestFactoryHolder
                }
            ]);

            module.init()
                .then(() => {
                    module.getInstance<TestApiRequestFactoryHolder>(TestApiRequestFactoryHolder);
                    done();
                });
        });
    });
});
