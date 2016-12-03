import { basename, dirname } from 'path';
import git from 'git-node';
import fs from 'fs';
require('colors');
var jsdiff = require('diff');
var debug = require('debug')('timedfile');

const FIXED_MESSAGE = 'Raymond Ho @ 2016';

export default class TimedFile {
  constructor(options) {

    const {fileFullPath, author, versionsPath } = options;

    this.fileFullPath = fileFullPath;
    this.directory = dirname(this.fileFullPath);
    this.filename = basename(this.fileFullPath);
    this.repoPath = versionsPath || this.directory;
    this.headCommitFile = [this.repoPath, `${this.filename}.commit`].join('/');
    this.repo = git.repo(this.repoPath);
    this.tree = {};
    this.commitHash = null;
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
        if (err)
          return reject(err);
        tree[filename] = {
          mode: 644,
          hash: contentsHash
        };
        resolve(contentsHash);
      });
    });
  }

  _saveAsCommit = (commit) => {

    const that = this;

    const { filename, tree, repo, repoPath, headCommitFile } = that;

    let commitHash = null;

    try {
      commitHash = fs.readFileSync(headCommitFile).toString();
    } catch (err) {
      debug('file not found for %s', headCommitFile);
    }

    const { contents, author } = commit;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, parent: commitHash, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      //get a new parent

      repo.saveAs('tree', tree, function (err, treeHash) {
        if (err) return reject(err);
        debug('treeHash = %s', treeHash);
        const treeCommit = Object.assign({}, gitCommit, { tree: treeHash });
        if (commitHash === null) delete commit.parent;

        // debug(`treeCommit=${JSON.stringify(treeCommit, null, 4)}`);

        repo.saveAs("commit", treeCommit, function (err, commitHash) {
          if (err) return reject(err);
          fs.writeFileSync(headCommitFile, commitHash);
          resolve(commitHash);
        });
      });
    });
  }

  /* this loads the tree of files, not really needed for single file repo */
  _loadTree = (commit) => {
    const that = this;
    const { repo } = that;

    const commitTreeHash = commit.tree;
    return new Promise((resolve, reject) => {
      // debug(`repo=${repo}`);
      repo.loadAs('tree', commitTreeHash, (err, tree) => {

        if (err) {
          // debug(`err=${JSON.stringify(err, null, 2)}`);
          return reject(err);
        }
        // debug(`tree=${JSON.stringify(tree, null, 2)}`);
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

  save = async (author) => {
    var that = this;

    const { fileFullPath } = that;

    try {
      const contents = fs.readFileSync(fileFullPath).toString();
      const commit = { author, contents };

      const contentsHash = await that._saveBlob(commit);
      debug('contentsHash = %s', contentsHash);
      that.commitHash = await that._saveAsCommit(commit);
      debug('that.commitHash = %s', that.commitHash);
      const headCommit = await that._loadCommit(that.commitHash);
      debug('headCommit = %s', headCommit);
      const loadTree = await that._loadTree(headCommit);
      debug('loadTree = %s', loadTree);
      const text = await that._load(contentsHash)
      debug('text = %s', text);

    } catch (e) {
      debug('save error %s', e);
      throw new Error(e);

    }

  }

  diff = async () => {
    const that = this;
    const { fileFullPath, headCommitFile } = that;

    let commitHash = null;

    try {
      commitHash = fs.readFileSync(headCommitFile).toString();
    } catch (err) {
      debug('file not found for %s', headCommitFile);
    } 

    const currentText = fs.readFileSync(fileFullPath).toString();

    if (commitHash !== null) {
      const headCommitDiff = await that._loadCommit(commitHash);
      debug('headCommitDiff= %s', headCommitDiff);
      const loadTreeDiff = await that._loadTree(headCommitDiff);
      debug('loadTreeDiff = %s', loadTreeDiff);
      const loadText = await that._load(loadTreeDiff[0].hash)
      debug('loadText =%s', loadText);
      return jsdiff.diffChars(loadText, currentText)
    } else {
      return jsdiff.diffChars('', currentText)
    }
  }

  rollForward = () => { }

  rollBack = () => { }

}
