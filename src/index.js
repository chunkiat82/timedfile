var git = require('git-node');
var basename = require('path').basename;

var pathname = `${__dirname}/gitFolder`;
// Create a local repo
var path = basename(pathname);
var repo = git.repo(path);

function saveAsBlob(tree, commit) {
  return new Promise((resolve, reject) => {
    repo.saveAs("blob", commit.contents, function(err, contentHash) {
      if (err) return reject(err);
      tree[commit.filename] = {
        mode: 644,
        hash: contentHash
      };
      resolve(contentHash);
    });
  });
}

function saveAsCommit(tree, parent, commit) {
  return new Promise((resolve, reject) => {
    repo.saveAs("tree", tree, function(err, filenameHash) {
      if (err) return reject(err);
      var gitCommmit = {
        tree: filenameHash,
        parent: parent,
        author: commit.author,
        committer: commit.committer,
        message: commit.message
      };
      if (!parent) delete commit.parent;
      repo.saveAs("commit", gitCommmit, function(err, parentHash) {
        if (err) return reject(err);
        repo.updateHead(parentHash);
        resolve(parentHash);
      });
    });
  });
}

function loadCommit(hashInput) {
  return new Promise((resolve, reject) => {
    repo.loadAs("commit", hashInput, (err, commit, parentHash) => {
      if (err) return reject(err);
      resolve({
        commit,
        parentHash
      });
    });
  });
}

async function onLoadCommit(commit, parentHash) {
  console.log(JSON.stringify(commit, null, 2));
  return await loadTree(commit.tree);
  // if (commit.parents) {
  //   commit.parents.forEach(loadCommit);
  // }
}

function loadTree(hash) {
  return new Promise((resolve, reject) => {
    repo.loadAs("tree", hash, (err, tree) => {
      //console.log("TREE", hash, tree);
      if (err) return reject(err);
      resolve(tree);
    });
  });
}

function printTree(tree) {
  if (err) throw err;
  console.log("TREE", hash, tree);
  tree.forEach(onEntry);
}

function onEntry(entry) {
  repo.loadAs("blob", entry.hash, function(err, blob) {
    if (err) throw err;
    console.log("BLOB", entry.hash, blob);
  });
}

function run() {

  var author = {
    name: "Raymond Ho",
    email: "chunkiat82@gmail.com"
  };
  var committer = {
    name: "Raymond Ho",
    email: "chunkiat82@gmail.com"
  };
  var filename = "README.md";

  var commit1 = {
    author,
    committer,
    message: "Initial Commit1\n",
    filename,
    contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n"
  };

  var commit2 = {
    author,
    committer,
    message: "Initial Commit2\n",
    filename,
    contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n Commit 2"
  };

  repo.setHead("master", async function(err) {
    if (err) throw err;
    console.log("Git database Initialized");

    try {
      var tree = {};

      var contentHash1 = await saveAsBlob(tree, commit1);
      console.log(`tree at commit 1=${JSON.stringify(tree)}`);
      var parentHash1 = await saveAsCommit(tree, null, commit1);
      console.log(`contentHash1=${contentHash1} parentHash1=${parentHash1}`);

      var contentHash2 = await saveAsBlob(tree, commit2);
      console.log(`tree at commit 2=${JSON.stringify(tree)}`);
      var parentHash2 = await saveAsCommit(tree, parentHash1, commit2);
      console.log(`contentHash2=${contentHash2} parentHash2=${parentHash2}`);

      const {
        commit: commit22,
        parentHash: parentHash
      } = await loadCommit(parentHash2);
      await onLoadCommit(commit22, parentHash);

    } catch (e) {
      console.error(e);
    }

    // printTree(tree);
  });
}

run();
