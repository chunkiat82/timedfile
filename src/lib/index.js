const PATH_DELIMITER = '/'; //path.delimiter;
const jsdiff = require('diff');
const debug = require('debug')('timedfile');

import {
  writeFilePromise,
  readFilePromise,
  appendFilePromise,
  readFileSync,
  removePromise
} from './file';

import {
  initRepo,
  saveBlob,
  saveCommit,
  loadTree,
  loadCommit,
  saveCommitHead,
  saveRolls,
  loadText,
  diffCommits
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
    this.repo = initRepo(this.repoPath);
    this.repoPathCreated = false;
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

    debug('constructor - this.repoPath = %s creation succeded', this.repoPath);
    debug('constructor - this.commitHash = %s', this.commitHash);
  }

  save = async(author) => {

    if (author === undefined) throw new Error('Author - {name, email} is missing');

    const that = this;

    const {
      repoPathCreated,
      fileFullPath,
      repoPath
    } = that;

    if (!repoPathCreated) mkdirp.sync(repoPath);

    const readFile = await readFilePromise(fileFullPath);
    const contents = readFile.toString();
    const commit = {
      author,
      contents
    };

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
      return jsdiff.diffWords(retrievedText, currentText)
    } else {
      return jsdiff.diffWords('', currentText)
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
      repoPath
    } = that;

    that.rolls = [];
    // await that::saveRolls();
    that.commitHash = null;
    // await that::saveCommitHead(that.commitHash);
    await removePromise(repoPath);
    that.repoPathCreated = false;
  }

  diffs = async() => {
    const that = this;

    const diffsCollect = [];
    debug('diffs - that.headCommitFile = %s', that.headCommitFile);
    let commitHash = readFileSync(that.headCommitFile).toString();
    while (commitHash) {
      debug('diffs - commitHash = %s', commitHash);
      let commit = await that::loadCommit(commitHash);
      if (commit.parents.length === 1) {
        const parentCommitHash = commit.parents[0];
        debug('diffs - parentCommitHash = %s', parentCommitHash);
        diffsCollect[diffsCollect.length] = await that::diffCommits(parentCommitHash, commitHash);
        commitHash = parentCommitHash;        
      } else {
        debug('diffs - commitHash not found');
        commitHash = null;        
      }
    }
    debug('diffsCollect - diffsCollect length %d', diffsCollect.length);
    return diffsCollect;
  }

}
export default TimedFile
