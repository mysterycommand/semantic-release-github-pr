#!/usr/bin/env node
const execa = require('execa');
const envCi = require('env-ci');
const { argv } = process;
const { resolve } = require('path');
const { getCurrentBranchName } = require('../src/git-utils');

(async function() {
  const plugins = `${resolve(__dirname, '../src/index.js')}`;
  const currentBranchName = await getCurrentBranchName();
  // If we're in a "detached HEAD" state, assume we're running on CI.
  const branch =
    currentBranchName !== 'HEAD' ? currentBranchName : envCi().branch;

  const args = argv.slice(2).concat([
    // We want to run on pull request builds, but `semantic-release` won't
    // let us unless we pass `--no-ci`.
    // https://github.com/semantic-release/semantic-release/issues/584
    `--no-ci`,
    // Set `dry-run` to keep `semantic-release` from publishing an actual release.
    `--dry-run`,
    `--branch=${branch}`,
    // We hard-set our version of `analyze-commits (preventing accidental override)`.
    `--analyze-commits=${plugins}`,

    // TODO: Used to hard-set our version of `generateNotes` as well, but no
    // longer seems possible after it became a "multi plugin" (array)
    // configuration in `semantic-release` 15.7.0. Instead, it's soft-set set
    // via the shareable config option below (`--extends`). It doesn't matter
    // other than it allows the user to break the plugin by (inadvertently)
    // overriding our version of `generateNotes`.

    // We use `extends` here to pick up a soft-set default for `verifyConditions`,
    // allowing users to override it (setting a plugin directly from the CLI
    // trumps plugins read from a config file).
    `--extends=${plugins}`,
  ]);

  execa('semantic-release', args, { stdio: 'inherit' });
})();
