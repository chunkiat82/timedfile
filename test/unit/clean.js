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
const testFolder = [__dirname, '..', 'testcases-clean'].join(PATH_DELIMITER)
const gitTestFolder = [testFolder, 'git'].join(PATH_DELIMITER);
const contentTestFolder = [testFolder, 'content'].join(PATH_DELIMITER);
const fileFullPath = [contentTestFolder, 'saveTest.js'].join(PATH_DELIMITER);
const author = {
  name: 'Raymond Ho',
  email: 'chunkiat82@gmail.com'
};

describe('TimedFile - Cleaning Up', function () {

  before(async() => {
    await createFilePromise(fileFullPath);
  });

  describe('Cleaning Up the Objects', function () {
    it('Able to remove all objects and reset the commits and rolls file', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await writeFilePromise(fileFullPath, 'Line 1\n');

      await timedFile.save(author);

      await writeFilePromise(fileFullPath, 'Line 2\n');

      await timedFile.save(author);

      await timedFile.rollback();

      expect(timedFile.rolls.length).to.equal(1);

      await timedFile.clean();

      expect(timedFile.rolls.length).to.equal(0);

      expect(timedFile.commitHash).to.equal(null);

      expect(JSON.parse(readFileSync(timedFile.rollsFile).toString())).to.be.empty;
      expect(JSON.parse(readFileSync(timedFile.headCommitFile).toString())).to.be.null;
    });

  });

  after('Tear Down', async() => {
    await removePromise(testFolder);
  });

});
