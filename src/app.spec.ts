import {
    TestModule,
    TestSandboxDocument,
    TEST_APP_JS, TEST_DATA_CENTER_PARAMETER
} from './test.module';
import {
    SandboxDocument,
    ISandboxDocument,
    SCRIPT_TAG, IElement
} from './app/dom';

describe('App', ()=> {

    describe('Check of a code execution within the sandbox', ()=> {
        it('Test script should be successfully applied inside the sandbox', (done)=> {
            const document:ISandboxDocument = new TestSandboxDocument();

            new TestModule([
                {
                    provide: SandboxDocument,
                    toConstantValue: document
                }
            ]).init().then(() => {
                const testScript:IElement = document.getElementsByTagName(SCRIPT_TAG)[0];
                expect(testScript.getAttribute('src')).toBe([TEST_DATA_CENTER_PARAMETER, TEST_APP_JS].join('/'));

                done();
            });
        });
    });
});
