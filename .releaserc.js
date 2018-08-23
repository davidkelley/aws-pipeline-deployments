module.exports = {
  prepare: [
    {
      'path': '@semantic-release/changelog',
      'changelogFile': 'CHANGELOG.md',
    },
    '@semantic-release/npm',
    {
      'path': '@semantic-release/git',
      'message': 'chore(release): releases ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    },
  ],
  publish: [
    {
      'path': '@semantic-release/exec',
      'cmd': 'aws s3 cp packaged.yml s3://$BUCKET/${nextRelease.version}.yml',
    },
    '@semantic-release/github',
  ],
}
