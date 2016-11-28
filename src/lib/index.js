import { basename, dirname } from 'path';
import git from 'git-node';

const message = 'Raymond Ho @ 2016';

export default class TimedFile {
  constructor(fileFullpath) {
    this.fileFullpath = fileFullpath;
    this.directory = dirname(this.fileFullpath);
    this.filename = basename(this.fileFullpath);
    this.repo = git.repo(this.directory);
    this.tree = {};
    this.parentHash = null;
  }

  /* sample commit
      var commit1 = {
        author
        contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n"
      };
  */
  _saveBlob(commit) {
    const that = this;

    const { contents, author } = commit;

    const gitCommit = { author, committer: author, filename: that, filename, contents, message };

    return new Promise((resolve, reject) => {
      that.repo.saveAs("blob", contents, function (err, contentsHash) {
        if (err)
          return reject(err);
        tree[filename] = {
          mode: 644,
          hash: contentsHash
        };
        resolve(contentHash);
      });
    });
  }

  _saveAsCommit(commit) {

    const that = this;

    const { tree, parentHash } = that;

    const gitCommit = { author, parent: parentHash, committer: author, filename: that, filename, contents, message };

    return new Promise((resolve, reject) => {
      //get a new parent
      repo.saveAs("tree", tree, function (err, treeHash) {
        if (err) return reject(err);

        const treeCommit = Object.assign({}, gitCommit, { tree: treeHash });
        if (parentHash === null) delete commit.parent;

        repo.saveAs("commit", treeCommit, function (err, parentCommitHash) {
          if (err) return reject(err);
          repo.updateHead(parentCommitHash);
          resolve(parentCommitHash);
        });
      });
    });
  }

  /* options = { author, contents } */
  async save(commit) {
    var that = this;
    try {
      // do nothing if contentsHash
      const contentsHash = await _saveBlob(commit);
      const parentHash = await _saveAsCommit(commit);
      that.parentHash = parentHash;

    } catch (e) {
      throw new Error(e);
    }

  }

  diff() { }

  rollForward() { }

  rollBack() { }

}
