const StreamrClient = require('streamr-client');
const GitHub = require('./github');

const API_KEY = process.env.API_KEY
if (API_KEY === undefined) {
  throw new Error('Must export environment variable API_KEY');
}

const POLLING_INTERVAL_IN_MS = 15 * 60 * 1000;
const LOGGING_INTERVAL_IN_MS = 15 * 60 * 1000;

const GITHUB_REPOSITORIES = [
    {
        org: 'bitcoin',
        repo: 'bitcoin'
    },
    {
        org: 'ethereum',
        repo: 'go-ethereum'
    },
    {
        org: 'ripple',
        repo: 'rippled'
    },
    {
        org: 'EOSIO',
        repo: 'eos'
    },
    {
        org: 'litecoin-project',
        repo: 'litecoin'
    },
    {
        org: 'input-output-hk',
        repo: 'cardano-sl'
    },
    {
        org: 'stellar',
        repo: 'stellar-core'
    },
    {
        org: 'iotaledger',
        repo: 'iri'
    },
    {
        org: 'tronprotocol',
        repo: 'java-tron'
    },
    {
        org: 'streamr-dev',
        repo: 'engine-and-editor'
    }
];


let messagesSent = 0;

main().catch(console.error);

async function main() {
    // Initialize Streamr-Client library
    const client = new StreamrClient({
        apiKey: API_KEY
    });

    // Get a Stream (creates one if does not already exist)
    GITHUB_REPOSITORIES.forEach(async (entry) => {
        const stream = await client.getOrCreateStream({
            name: `GitHub commits ${entry.org}/${entry.repo}`
        });

        console.info("Starting listening for Stream", stream.name, stream.id);

        await pollAndPush(entry.org, entry.repo, stream, new Date().toISOString());
    })

    // Start logging
    setInterval(() => {
        console.info(`${messagesSent} events sent.`);
        messagesSent = 0;
    }, LOGGING_INTERVAL_IN_MS);
}

async function pollAndPush(org, repo, stream, since) {
    while (true) {
        const commits = await GitHub.fetchCommits(org, repo, since);
        console.info(`${org}/${repo}: fetched commits`);
        since = new Date().toISOString();

        if (commits.message) {
            console.error(`${org}/${repo}:`, commits.message);
        } else {
            commits.forEach(async (commit) => {
                const dataPoint = transformData(commit);
                await stream.produce(dataPoint);
                messagesSent += 1;
            });
        }

        await timeout(POLLING_INTERVAL_IN_MS);
    }
}

function transformData(commit) {
    return {
        sha: commit.sha,
        message: commit.commit.message,
        commitedAt: commit.commit.committer.date,
        author: commit.commit.author.name,
        committer: commit.commit.committer.name
    };
}

function timeout(delay) {
    return new Promise(done => {
        setTimeout(done, delay);
    });
}