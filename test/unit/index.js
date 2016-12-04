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

describe('TimedFile', function() {

    before(async () => {
        await fs.createFile(fileFullPath);
    });

    describe('Functionalities Present', function() {
        it('Functionalities Present', function(done) {
            const timedFile = new TimedFile({ fileFullPath: `${__dirname}/LICENSE`, versionsPath: `${gitTestFolder}` });
            expect(timedFile).to.have.property('save');
            expect(timedFile).to.have.property('diff');
            expect(timedFile).to.have.property('fastforward');
            expect(timedFile).to.have.property('rollback');
            done();
        });
    });

    describe('Able to Save', function() {
        it('Able to Save', async function() {
            const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
            const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
            await fs.writeFile(fileFullPath, 'Line 1\n');
            try {
                await timedFile.save(author);
                const jsDiffs = await timedFile.diff();
                expect(jsDiffs).to.eql([{ value: 'Line 1\n', count: 7 }]);
            } catch (e) {
                log(e);
            }
        });
    });

    describe('Able to Diff When Loaded with Versions', function() {
        it('Able to Diff When Loaded with Versions', async function() {
            const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
            await fs.appendFile(fileFullPath, 'Line 2\n');
            const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
            try {
                const jsDiffs = await timedFile.diff();
                expect(jsDiffs).to.eql([{ count: 7, value: 'Line 1\n' },
                { count: 7, added: true, removed: undefined, value: 'Line 2\n' }]);
            } catch (e) {
                log(e);
            }
        });
    });

    describe('Able to Save When Loaded with Versions', function() {
        it('Able to Save When Loaded with Versions', async function() {
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
                log(e);
            }
        });
    });

    describe('Able to Preview a Rollback', function() {
        it('Able to Preview a Rollback', async function() {
            const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
            const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
            try {
                const beforeRollback = await fs.readFile(fileFullPath);
                expect(beforeRollback.toString()).to.equal('Line 1\nLine 2\n');
                const jsDiffs = await timedFile.diff();
                await timedFile.rollback();
                const afterRollback = await fs.readFile(fileFullPath);
                expect(afterRollback.toString()).to.equal('Line 1\n');
            } catch (e) {
                log(e);
            }
        });
    });
    
    after('Tear Down', async () => {
        await fs.remove(contentTestFolder);
        await fs.remove(gitTestFolder);
    });

});
