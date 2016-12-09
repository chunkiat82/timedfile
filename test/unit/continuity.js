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
const testFolder = [__dirname, '..', 'testcases-continuity'].join(PATH_DELIMITER)
const gitTestFolder = [testFolder, 'git'].join(PATH_DELIMITER);
const contentTestFolder = [testFolder, 'content'].join(PATH_DELIMITER);
const fileFullPath = [contentTestFolder, 'saveTest.js'].join(PATH_DELIMITER);
const author = {
  name: 'Raymond Ho',
  email: 'chunkiat82@gmail.com'
};

describe('TimedFile - Continuity', function () {

  before(async() => {
    await createFilePromise(fileFullPath);
  });

  describe('Save in Empty Pool of Objects', function () {
    it('Able to Load Persisted Rollbacks', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await writeFilePromise(fileFullPath, 'Line 1\n');

      await timedFile.save(author);

      await writeFilePromise(fileFullPath, 'Line 2\n');

      await timedFile.save(author);

      await timedFile.rollback();

      const timedFileAgain = new TimedFile({
        fileFullPath
      });

      expect(timedFileAgain.rolls.length).to.equal(1);

    });

    it('Able to Reset after a rollback', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });

      await writeFilePromise(fileFullPath, 'Line 1\n');

      await timedFile.save(author);

      await writeFilePromise(fileFullPath, 'Line 2\n');

      await timedFile.save(author);

      await timedFile.rollback();

      await timedFile.reset();

      const timedFileAgain = new TimedFile({
        fileFullPath
      });

      expect(timedFileAgain.rolls.length).to.equal(1);

    });

    it('Able to fastfoward after rollback after reset', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });
      await writeFilePromise(fileFullPath, 'Line 1\n');

      await timedFile.save(author);

      await writeFilePromise(fileFullPath, 'Line 2\n');

      await timedFile.save(author);

      await timedFile.rollback();

      await timedFile.reset();

      const beforeRecreation = await readFilePromise(fileFullPath);

      expect(beforeRecreation.toString()).to.equal('Line 1\n');

      const timedFileAgain = new TimedFile({
        fileFullPath
      });

      expect(timedFileAgain.rolls.length).to.equal(1);

      const afterReset = await readFilePromise(fileFullPath);
      expect(afterReset.toString()).to.equal('Line 1\n');

      const afterFastforward = await timedFileAgain.fastforward();

      expect(timedFileAgain.rolls.length).to.equal(0);

      expect(afterFastforward).to.equal('Line 2\n'); //it's write file not append

    });

    it('Able to fastfoward till we reach the end with null', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });

      const afterFastforward = await timedFile.fastforward();

      expect(afterFastforward).to.equal(null);

    });

    it('Able to fastfoward till we reach the end with null', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });

      while (await timedFile.rollback()){}

      expect(true);

    });

    it('Able to rollback then fastfoward then reset', async function () {
      const timedFile = new TimedFile({
        fileFullPath
      });

      const afterFastforward = await timedFile.fastforward();

      expect(afterFastforward).to.equal('Line 2\n');

      await writeFilePromise(fileFullPath, 'You should never see this\n');

      const afterWriting = await readFilePromise(fileFullPath);

      expect(afterWriting.toString()).to.equal('You should never see this\n');

      const afterRest = await timedFile.reset();

      expect(afterRest).to.equal('Line 2\n');

    });
  });

  after('Tear Down', async() => {
    await removePromise(testFolder);
  });

});
