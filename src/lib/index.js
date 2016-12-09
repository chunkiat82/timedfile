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
    that.commitHash = await that::saveCommit(commit);
    debug('save - that.commitHash = %s', that.commitHash);
    that.rolls = [];
    await that::saveRolls();

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
      const headCommitDiff = await that::loadCommit(commitHash);
      debug('diff - headCommitDiffTree = %s', headCommitDiff.tree);
      const loadTreeDiff = await that::loadTree(headCommitDiff.tree);
      debug('diff - loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
      const retrievedText = await that::loadText(loadTreeDiff[0].hash);
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
      let commit = await that::loadCommit(commitHash);

      if (commit.parents.length === 1) {
        const parentCommitHash = commit.parents[0];
        that.commitHash = parentCommitHash;
        this.rolls.push({
          commitHash,
          commit
        });
        await that::saveRolls();
        commit = await that::loadCommit(parentCommitHash);
        const loadTreeDiff = await that::loadTree(commit.tree);
        debug('rollback - loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
        const retrievedText = await that::loadText(loadTreeDiff[0].hash);
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
    await that::saveRolls();

    if (roll) {
      const {
        commit,
        commitHash
      } = roll;
      
      debug('fastforward - commit.tree - %s', commit.tree);
      that.commitHash = commitHash;
      const loadTreeDiff = await that::loadTree(commit.tree);
      debug('rollback - loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
      const retrievedText = await that::loadText(loadTreeDiff[0].hash);
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
      const commit = await that::loadCommit(commitHash);
      const loadTreeDiff = await that::loadTree(commit.tree);
      const retrievedText = await that::loadText(loadTreeDiff[0].hash);
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
    await that::saveRolls();
    that.commitHash = null;
    await that::saveCommitHead(that.commitHash);
  }

}
export default TimedFile
