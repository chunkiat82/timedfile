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
const author = {
  name: 'Raymond Ho',
  email: 'chunkiat82@gmail.com'
};

describe('TimedFile - Error Detection', function () {

  before(async() => {
    await createFilePromise(fileFullPath);
  });

  describe('Checking Diffs', function () {
    it('Able to return a timeline of diffs', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await writeFilePromise(fileFullPath, 'Line 1\n');
      await timedFile.save(author);
      await appendFilePromise(fileFullPath, 'Line 2\n');
      await timedFile.save(author);
      await appendFilePromise(fileFullPath, 'Line 3\n');
      await timedFile.save(author);
      const diffs = await timedFile.diffs();
      expect(diffs).to.eql(
        [
          [{
            count: 14,
            value: 'Line 1\nLine 2\n'
          }, {
            count: 7,
            added: true,
            removed: undefined,
            value: 'Line 3\n'
          }],
          [{
            count: 7,
            value: 'Line 1\n'
          }, {
            count: 7,
            added: true,
            removed: undefined,
            value: 'Line 2\n'
          }]
        ]);
    });
  });

  after('Tear Down', async() => {
    await removePromise(testFolder);
  });

});
