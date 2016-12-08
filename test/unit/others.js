import {
  writeFilePromise,
  readFilePromise,
  appendFilePromise,
  removePromise,
  createFilePromise,
  readFileSync
} from '../../src/lib/fileOperations';
import path from 'path';
import TimedFile from '../../src/lib/index';
import {
  log
} from 'mocha-logger';
const PATH_DELIMITER = '/'; //path.delimiter;
const testFolder = [__dirname, '..', 'testcases'].join(PATH_DELIMITER)
const gitTestFolder = [testFolder, 'git'].join(PATH_DELIMITER);
const contentTestFolder = [testFolder, 'content'].join(PATH_DELIMITER);
const fileFullPath = [contentTestFolder, 'saveTest.js'].join(PATH_DELIMITER);
const author = {
  name: 'Raymond Ho',
  email: 'chunkiat82@gmail.com'
};

describe('TimedFile - Fresh', function () {

  before(async() => {
    await createFilePromise(fileFullPath);
  });

  describe('Save in Empty Pool of Objects', function () {
    it('Able to Save', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await writeFilePromise(fileFullPath, 'Line 1\n');

      await timedFile.save(author);

      const jsDiffs = await timedFile.diff();
      expect(jsDiffs).to.eql([{
        value: 'Line 1\n',
        count: 7
      }]);
    });
  });

  describe('Rollback', function () {
    it('Able to rollback safely even when there is nothing to go back', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await timedFile.rollback();
      expect(true);
    });
  });

  describe('Reset', function () {

    it('Able to reset safely even when there is nothing to reset 1', async function () {
      const timedFile = new TimedFile({
        fileFullPath: [contentTestFolder, 'empty.js'].join(PATH_DELIMITER)
      });
      await timedFile.reset();
      expect(true);
    });

    it('Able to reset safely even when there is nothing to reset 2', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await writeFilePromise(fileFullPath, 'Line 1\n');
      await timedFile.save(author);
      await timedFile.reset();
      expect(true);
    });
  });

  after('Tear Down', async() => {
    await removePromise(testFolder);
  });

});
