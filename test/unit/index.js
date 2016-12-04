import fs from 'fs-promise';
import path from 'path';
import TimedFile from '../../src/lib/index';
import {
    log
} from 'mocha-logger';
const PATH_DELIMITER = '/';
const gitTestFolder = [__dirname, '..', 'testcases', 'git'].join(PATH_DELIMITER);
const contentTestFolder = [__dirname, '..', 'testcases', 'content'].join(PATH_DELIMITER);
const fileFullPath = [contentTestFolder, 'saveTest.js'].join(PATH_DELIMITER);

describe('TimedFile', () => {

    before('Before TimeFile', () => {
        fs.createFileSync(fileFullPath);
        log(`fileFullPath created = ${fileFullPath}`);
    });

    describe('Functionalities Present', () => {
        it('class created', () => {
            const timedFile = new TimedFile({ fileFullPath: `${__dirname}/LICENSE`, versionsPath: `${gitTestFolder}` });
            expect(timedFile).to.have.property('save');
            expect(timedFile).to.have.property('diff');
            expect(timedFile).to.have.property('fastforward');
            expect(timedFile).to.have.property('rollback');
        });

    });

    describe('Able to Save', () => {
        it('class created', async () => {
            const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
            const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
            await fs.writeFile(fileFullPath, 'Line 1\n');
            try {
                await timedFile.save(author);
                const jsDiffs = await timedFile.diff();
                expect(jsDiffs).to.eql([{ value: 'Line 1\n', count: 7 }]);
            } catch (e) {
                console.log(e);
            }
        });
    });

    describe('Able to Diff When Loaded with Versions', () => {
        it('class created', async () => {
            const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
            await fs.appendFile(fileFullPath, 'Line 2\n');
            const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
            try {
                const jsDiffs = await timedFile.diff();
                expect(jsDiffs).to.eql([{ count: 7, value: 'Line 1\n' },
                { count: 7, added: true, removed: undefined, value: 'Line 2\n' }]);
            } catch (e) {
                console.log(e);
            }
        });
    });

    describe('Able to Save When Loaded with Versions', () => {
        it('class created', async () => {
            const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
            const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
            try {
                await timedFile.save(author);
                const jsDiffs = await timedFile.diff();
                expect(jsDiffs).to.eql([{
                    count: 14,
                    value: 'Line 1\nLine 2\n'
                }]);
            } catch (e) {
                console.log(e);
            }
        });
    });

    describe('Able to Preview a Rollback', () => {
      it('class created', async () => {
        const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
        const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
        try {          
          const first = await fs.readFile(fileFullPath);
          console.log(first.toString());
          const jsDiffs = await timedFile.diff();
          await timedFile.rollback();
          const second = await fs.readFile(fileFullPath);
          console.log(second.toString());
        } catch (e) {
          console.log(e);
        }
      });
    });

    after('Tear Down', () => {
        setTimeout(() => { fs.removeSync(contentTestFolder) }, 200);
        setTimeout(() => { fs.removeSync(gitTestFolder) }, 200)
    });

});
