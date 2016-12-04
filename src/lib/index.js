import path from 'path';
const { basename, dirname } = path;
import git from 'git-node';
import fs from 'fs-promise';
require('colors');
var jsdiff = require('diff');
var debug = require('debug')('timedfile');

const PATH_DELIMITER = '/';//path.delimiter;
const FIXED_MESSAGE = 'Raymond Ho @ 2016';

export default class TimedFile {
  constructor(options) {

    const {fileFullPath, author, versionsPath } = options;

    this.fileFullPath = fileFullPath;
    this.directory = dirname(this.fileFullPath);
    this.filename = basename(this.fileFullPath);
    this.repoPath = versionsPath || this.directory;
    this.headCommitFile = [this.repoPath, `${this.filename}.commit`].join(PATH_DELIMITER);
    this.repo = git.repo(this.repoPath);
    this.tree = {};
    // try {
    //   this.commitHash = fs.readFileSync(headCommitFile);
    // } catch (e){
    //   this.commitHash = null;
    // }

    this.commitHash = null;

    this.rolls = [];
  }

  /* sample commit
      var commit1 = {
        author
        contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n"
      };
  */
  _saveBlob = (commit) => {
    const that = this;

    const { filename, repo, tree } = that;

    const { contents, author } = commit;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      repo.saveAs("blob", contents, function (err, contentsHash) {
        if (err) return reject(err);
        tree[filename] = {
          mode: 644,
          hash: contentsHash
        };
        resolve(contentsHash);
      });
    });
  }

  _saveAsCommit = async (commit) => {

    const that = this;

    const { filename, tree, repo, repoPath  } = that;

    const commitHash = await that._loadCommitHead();

    const { contents, author } = commit;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, parent: commitHash, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      //get a new parent

      repo.saveAs('tree', tree, function (err, treeHash) {
        if (err) return reject(err);
        debug('treeHash = %s', treeHash);
        const treeCommit = Object.assign({}, gitCommit, { tree: treeHash });
        if (treeCommit === null) delete treeCommit.parent;

        repo.saveAs("commit", treeCommit, async (err, commitHash) => {
          if (err) return reject(err);
          await that._saveCommitHead(commitHash);
          resolve(commitHash);
        });
      });
    });
  }

  /* this loads the tree of files, not really needed for single file repo */
  _loadTree = (commitTreeHash) => {
    const that = this;
    const { repo } = that;

    return new Promise((resolve, reject) => {
      // debug(`repo=${repo}`);
      repo.loadAs('tree', commitTreeHash, (err, tree) => {

        if (err) return reject(err);
        resolve(tree);
      });
    });
  }

  _loadCommit = (commitHash) => {
    const that = this;
    const { repo } = that;
    return new Promise((resolve, reject) => {
      repo.loadAs('commit', commitHash, (err, commit) => {
        if (err) return reject(err);
        return resolve(commit);
      });
    });
  }

  _load = (blobHash) => {
    const that = this;
    const { repo } = that;
    return new Promise((resolve, reject) => {
      repo.loadAs('text', blobHash, (err, text) => {
        if (err) return reject(err);
        return resolve(text);
      });
    });
  }

  _saveCommitHead = async (commitHash) => {
    const that = this;
    const { headCommitFile } = that;
    return await fs.writeFile(headCommitFile, commitHash);
  };

  _loadCommitHead = async () => {
    const that = this;
    const { headCommitFile } = that;
    let commitHash = null;

    try {
      const readFile = await fs.readFileSync(headCommitFile);
      commitHash = readFile.toString();
      debug('commitHash = %s', commitHash || 'EMPTY');
    } catch (err) {
      debug('file not found for %s', headCommitFile);
    }

    return commitHash;
  }

  save = async (author) => {
    var that = this;

    const { fileFullPath } = that;

    try {
      const readFile = await fs.readFile(fileFullPath);
      const contents = readFile.toString();
      const commit = { author, contents };

      const contentsHash = await that._saveBlob(commit);
      debug('contentsHash = %s', contentsHash);
      that.commitHash = await that._saveAsCommit(commit);
      debug('that.commitHashTree = %s', that.commitHash.tree);
      // const headCommit = await that._loadCommit(that.commitHash);
      // debug('headCommitTree = %s', headCommit.tree);
      // const loadTree = await that._loadTree(headCommit.tree);
      // debug('loadTree = %s', loadTree);
      // const text = await that._load(contentsHash)
      // debug('text = %s', text);

    } catch (e) {
      debug('save error %s', e);
      throw new Error(e);

    }

  }

  diff = async () => {
    const that = this;
    const { fileFullPath } = that;
    const commitHash = await that._loadCommitHead();

    const readFile = await fs.readFile(fileFullPath);
    const currentText = readFile.toString();

    if (commitHash) {
      const headCommitDiff = await that._loadCommit(commitHash);
      debug('headCommitDiffTree= %s', headCommitDiff.tree);
      const loadTreeDiff = await that._loadTree(headCommitDiff.tree);
      debug('loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
      const loadText = await that._load(loadTreeDiff[0].hash);
      debug('loadText =%s', loadText);
      return jsdiff.diffChars(loadText, currentText)
    } else {
      return jsdiff.diffChars('', currentText)
    }
  }

  fastforward = () => { }

  /* we have to check if file is saved , not done yet */
  rollback = async () => {

    //check if file here TBD

    const that = this;
    const { fileFullPath, headCommitFile } = that;

    const commitHash = await that._loadCommitHead();

    if (commitHash) {
      let headCommitDiff = await that._loadCommit(commitHash);

      if (headCommitDiff.parents.length === 1) {

        const parentCommitHash = headCommitDiff.parents[0];
        headCommitDiff = await that._loadCommit(parentCommitHash);
      } else {
        debug('headCommitDiff does not any parent that is single, it has [%s] parents', headCommitDiff.parents.length);
      }

      debug('headCommitDiffTree= %s', JSON.stringify(headCommitDiff.tree));
      const loadTreeDiff = await that._loadTree(headCommitDiff.tree);
      debug('loadTreeDiff[0].hash = %s', loadTreeDiff && loadTreeDiff[0].hash);
      const loadText = await that._load(loadTreeDiff[0].hash);
      await fs.writeFile(fileFullPath, loadText);
    } else {
      debug('Not existing commit found for rollback');
    }

  }

  reset = async () => {

  }

}
