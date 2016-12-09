const PATH_DELIMITER = '/'; //path.delimiter;
const jsdiff = require('diff');
const debug = require('debug')('timedfile');
import git from 'git-node';

import {
  writeFilePromise,
  readFilePromise,
  appendFilePromise,
  readFileSync,
  removePromise
} from './file';

import {
  saveBlob,
  saveCommit,
  loadTree,
  loadCommit,
  saveCommitHead,
  saveRolls,
  loadText
} from './git';

import path from 'path';
const {
  basename,
  dirname
} = path;
import mkdirp from 'mkdirp';

class TimedFile {
  constructor(options) {

    const {
      fileFullPath,
      author,
      versionsPath
    } = options;

    this.fileFullPath = path.normalize(fileFullPath);
    this.directory = dirname(this.fileFullPath);
    this.filename = basename(this.fileFullPath);
    this.versionsPath = path.normalize(versionsPath || this.directory);
    this.repoPath = [this.versionsPath, `${this.fileFullPath.split(PATH_DELIMITER).join('.')}`].join(PATH_DELIMITER);
    this.repoObjectsPath = [this.repoPath, 'objects'].join(PATH_DELIMITER);
    this.headCommitFile = [this.repoPath, 'commit.txt'].join(PATH_DELIMITER);
    this.rollsFile = [this.repoPath, 'rolls.txt'].join(PATH_DELIMITER);
    this.repo = git.repo(this.repoPath);
    this.tree = {};
    try {
      this.commitHash = readFileSync(this.headCommitFile).toString();
    } catch (e) {
      this.commitHash = null;
    }

    try {
      this.rolls = JSON.parse(readFileSync(this.rollsFile).toString());
    } catch (e) {
      this.rolls = [];
    }

    mkdirp(this.repoPath);
    debug('constructor - this.repoPath = %s creation succeded', this.repoPath);
    debug('constructor - this.commitHash = %s', this.commitHash);
  }

  save = async(author) => {
    const that = this;

    const {
      fileFullPath
    } = that;

    const readFile = await readFilePromise(fileFullPath);
    const contents = readFile.toString();
    const commit = {
      author,
      contents
    };
    console.log(`that.filename=${that.filename}`);

    const contentsHash = await that::saveBlob(commit);
    debug('save - contentsHash = %s', contentsHash);
    that.commitHash = await saveCommit.call(that, commit);
    debug('save - that.commitHash = %s', that.commitHash);
    that.rolls = [];
    await saveRolls.call(that,);

  }

  diff = async() => {
    const that = this;
    const {
      fileFullPath,
      commitHash,
    } = that;

    const readFile = await readFilePromise(fileFullPath);
    const currentText = readFile.toString();

    if (commitHash) {
      const headCommitDiff = await loadCommit.call(that,commitHash);
      debug('diff - headCommitDiffTree = %s', headCommitDiff.tree);
      const loadTreeDiff = await loadTree.call(that,headCommitDiff.tree);
      debug('diff - loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
      const retrievedText = await loadText.call(that,loadTreeDiff[0].hash);
      debug('diff - retrievedText = %s', retrievedText);
      return jsdiff.diffChars(retrievedText, currentText)
    } else {
      return jsdiff.diffChars('', currentText)
    }
  }

  /* we have to check if file is saved , not done yet */
  rollback = async() => {

    //check if file here TBD

    const that = this;
    const {
      fileFullPath,
      commitHash
    } = that;

    if (commitHash) {
      let commit = await loadCommit.call(that,commitHash);

      if (commit.parents.length === 1) {
        const parentCommitHash = commit.parents[0];
        that.commitHash = parentCommitHash;
        this.rolls.push({
          commitHash,
          commit
        });
        await saveRolls.call(that,);
        commit = await loadCommit.call(that,parentCommitHash);
        const loadTreeDiff = await loadTree.call(that,commit.tree);
        debug('rollback - loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
        const retrievedText = await loadText.call(that,loadTreeDiff[0].hash);
        await writeFilePromise(fileFullPath, retrievedText);
        return retrievedText;
      } else {
        return null;
      }

    }

  }

  fastforward = async() => {
    const that = this;
    const {
      fileFullPath
    } = that;

    const roll = that.rolls.pop();
    await saveRolls.call(that,);

    if (roll) {
      const {
        commit,
        commitHash
      } = roll;
      
      debug('fastforward - commit JSON = %s', JSON.stringify(commit));
      debug('fastforward - commit.tree - %s', commit.tree);
      that.commitHash = commitHash;
      const loadTreeDiff = await loadTree.call(that,commit.tree);
      debug('rollback - loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
      const retrievedText = await loadText.call(that,loadTreeDiff[0].hash);
      await writeFilePromise(fileFullPath, retrievedText);
      return retrievedText;
    }

    debug('fastforward - that.rolls.length %s', that.rolls.length);

    return null;

  }

  reset = async() => {
    const that = this;

    const {
      commitHash,
      fileFullPath
    } = that;

    if (commitHash) {
      const commit = await loadCommit.call(that,commitHash);
      const loadTreeDiff = await loadTree.call(that,commit.tree);
      const retrievedText = await loadText.call(that,loadTreeDiff[0].hash);
      await writeFilePromise(fileFullPath, retrievedText);
      return retrievedText;
    } else {
      debug('Not existing commit found for reset');
      return null;
    }
  }

  clean = async() => {
    const that = this;

    const {
      repoObjectsPath
    } = that;

    await removePromise(repoObjectsPath);
    that.rolls = [];
    await saveRolls.call(that,);
    that.commitHash = null;
    await saveCommitHead.call(that,that.commitHash);
  }

}
export default TimedFile
