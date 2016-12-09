import {
  writeFilePromise,
  readFilePromise,
  appendFilePromise,
  removePromise,
  createFilePromise,
  readFileSync
} from '../../src/lib/file';
import path from 'path';
import TimedFile from '../../src/lib/index';
import {
  log
} from 'mocha-logger';
const PATH_DELIMITER = '/'; //path.delimiter;
const testFolder = [__dirname, '..', 'testcases-error'].join(PATH_DELIMITER)
const gitTestFolder = [testFolder, 'git'].join(PATH_DELIMITER);
const contentTestFolder = [testFolder, 'content'].join(PATH_DELIMITER);
const fileFullPath = [contentTestFolder, 'saveTest.js'].join(PATH_DELIMITER);

describe('TimedFile - Error Detection', function () {

  before(async() => {
    await createFilePromise(fileFullPath);
  });

  describe('Throwing Errors', function () {
    it('Able to detect error when author is not supplied', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });

      try {
        await timedFile.save();
        expect.fail('Should throw exception because author not supplied');
      } catch (e) {
        expect(e.message).to.equal('Author - {name, email} is missing');
         
      }
    });
  });

  after('Tear Down', async() => {
    await removePromise(testFolder);
  });

});
