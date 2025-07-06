const { Octokit } = require('@octokit/rest');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.REPO_OWNER;
  const repo = process.env.REPO_NAME;
  const path = process.env.FILE_PATH || 'itineraries/route.geojson';

  if (!token || !owner || !repo) {
    return { statusCode: 500, body: 'Missing GitHub configuration' };
  }

  const octokit = new Octokit({ auth: token });
  const content = Buffer.from(event.body).toString('base64');

  try {
    // Get the current file SHA if it exists
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (err) {
      // File does not exist
      sha = undefined;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: 'Add route',
      content,
      sha,
    });

    return { statusCode: 200, body: 'Saved' };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
