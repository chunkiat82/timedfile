import { basename, dirname } from 'path';
import git from 'git-node';
import fs from 'fs';
require('colors');
var jsdiff = require('diff');

console.log(jsdiff);
const FIXED_MESSAGE = 'Raymond Ho @ 2016';

export default class TimedFile {
  constructor(options) {

    const {fileFullPath, author } = options;

    this.fileFullPath = fileFullPath;
    this.directory = dirname(this.fileFullPath);
    this.filename = basename(this.fileFullPath);
    this.repo = git.repo(this.directory);
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

    // const author = `${name} <${email}>`;

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

    const { filename, tree, commitHash, repo } = that;

    const { contents, author } = commit;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, parent: commitHash, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      //get a new parent

      repo.saveAs("tree", tree, function (err, treeHash) {
        if (err) return reject(err);
        console.log(`treeHash=${treeHash}`);
        const treeCommit = Object.assign({}, gitCommit, { tree: treeHash });
        if (commitHash === null) delete commit.parent;

        // console.log(`treeCommit=${JSON.stringify(treeCommit, null, 4)}`);

        repo.saveAs("commit", treeCommit, function (err, commitHash) {
          if (err) return reject(err);
          repo.updateHead(commitHash);
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
      // console.log(`repo=${repo}`);
      repo.loadAs("tree", commitTreeHash, (err, tree) => {

        if (err) {
          // console.log(`err=${JSON.stringify(err, null, 2)}`);
          return reject(err);
        }
        // console.log(`tree=${JSON.stringify(tree, null, 2)}`);
        resolve(tree);
      });
    });
  }

  _loadCommit = (commitHash) => {
    const that = this;
    const { repo } = that;
    return new Promise((resolve, reject) => {
      repo.loadAs("commit", commitHash, (err, commit) => {
        if (err) return reject(err);
        return resolve(commit);
      });
    });
  }

  _load = (blobHash) => {
    const that = this;
    const { repo } = that;
    return new Promise((resolve, reject) => {
      repo.loadAs("text", blobHash, (err, text) => {
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
      console.log(`contentsHash=${contentsHash}`);
      that.commitHash = await that._saveAsCommit(commit);
      console.log(`that.commitHash=${that.commitHash}`);

      const headCommit = await that._loadCommit(that.commitHash);
      console.log(`headCommit=${JSON.stringify(headCommit, null, 2)}`);
      const loadTree = await that._loadTree(headCommit);
      console.log(`loadTree=${JSON.stringify(loadTree, null, 2)}`);
      const text = await that._load(contentsHash)
      console.log(`text=${text}`);
      // 

      /*test */
      if (headCommit.parents.length > 0) {
        console.log(`-----------------------`);
        const headCommit1 = await that._loadCommit(headCommit.parents[0]);
        console.log(`headCommit1=${JSON.stringify(headCommit1, null, 2)}`);
        const loadTree1 = await that._loadTree(headCommit1);
        console.log(`loadTree1=${JSON.stringify(loadTree1, null, 2)}`);
        const text1 = await that._load(loadTree1[0].hash)
        console.log(`text1=${text1}`);
        var diffs= [];
        jsdiff.diffChars(text1, text).forEach(function (part) {
          // green for additions, red for deletions 
          // grey for common parts 
          var color = part.added ? 'green' :
            part.removed ? 'red' : 'grey';
          diffs.push(part.value[color]);
        });
        console.log(diffs.join(''));        
      }
    } catch (e) {
      throw new Error(e);

    }

  }

  diff = () => { console.log(this.fileFullPath); }

  rollForward = () => { }

  rollBack = () => { }

}
