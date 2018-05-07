const fetch = require('node-fetch');

module.exports = {
    fetchCommits: async (org, repo, since) => {
        const response = await fetch(`https://api.github.com/repos/${org}/${repo}/commits?since=${since}`);
        return response.json();
    }
};