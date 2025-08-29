### Release checklist
* [ ] Bump version in `package.json`
* [ ] Compile a changelog with the `tools/collect-changelog` script
* [ ] Create an MR with an announcement to pleroma.social
#### post-merge
* [ ] Tag the release on the merge commit
* [ ] Make the tag into a Gitlab Release™
* [ ] Merge `master` into `develop` (in case the fixes are already in develop, use `git merge -s ours --no-commit` and manually merge the changelogs)
