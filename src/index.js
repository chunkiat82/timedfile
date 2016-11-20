var git = require('git-node');
var basename = require('path').basename;

var pathname = `${__dirname}/gitFolder`;
// Create a local repo
var path = basename(pathname);
var repo = git.repo(path);

var repo1 = git.repo("test.git");

function saveAsBlob(tree, commit) {
  return new Promise((resolve, reject) => {
    repo.saveAs("blob", commit.contents, function(err, hash) {
      if (err) return reject(err);
      tree[commit.filename] = {
        mode: 644,
        hash: hash
      };
      resolve(hash);
    });
  });
}

function saveAsCommit(tree, parent, commit) {
  return new Promise((resolve, reject) => {
    repo.saveAs("tree", tree, function(err, hash) {
      if (err) return reject(err);
      var gitCommmit = {
        tree: hash,
        parent: parent,
        author: commit.author,
        committer: commit.committer,
        message: commit.message
      };
      if (!parent) delete commit.parent;
      repo.saveAs("commit", gitCommmit, function(err, hash) {
        if (err) return reject(err);
        repo.updateHead(hash);
        resolve(hash);
      });
    });
  });
}

function loadCommit(hashInput) {
  return new Promise((resolve, reject) => {
    repo.loadAs("commit", hashInput, (err, commit, hash) => {
      if (err) return reject(err);
      resolve({
        commit,
        hash
      });
    });
  });
}

function onCommit(commit, hash) {

  console.log("COMMIT", hash, commit);
  loadTree(commit.tree);
  // if (commit.parents) {
  //   commit.parents.forEach(loadCommit);
  // }
}

function loadTree(hash) {
  return new Promise((resolve, reject) => {
    try {
      repo.loadAs("tree", hash, (err, tree) => {
        console.log("TREE", hash, tree);
        if (err) return reject(err);
        resolve(tree);
      });
    } catch (err) {
      console.log(err);
    }
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
      var hash1 = await saveAsBlob(tree, commit1);
      var parentHash1 = await saveAsCommit(tree, null, commit1);
      console.log(`hash1=${hash1} parentHash1=${parentHash1}`);
      const {commit, hash: hash2 } = await loadCommit(parentHash1);
      console.log(`hash2=${hash2}`);
      await onCommit(hash2);
      //   var hash2 = await saveAsBlob(tree, hash1, commit2);
      //   console.log(tree);
      //
      //   let hash = tree['README.md'].hash;
      //   console.log(hash);
      //
      //   const {commit, hash: hash1 } = await loadCommit(hash);
      //   onCommit(commit,hash1)
      //   console.log(`loadedTree=${JSON.stringify(loadedTree)}`);

    } catch (e) {
      console.error(e);
    }

    // printTree(tree);
  });
}

run();
