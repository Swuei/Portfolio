exports.handler = async (event, context) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'Swuei/Portfolio';
    const AUTH_ENDPOINT = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/token-validation.yml/dispatches`;

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
    }

    const csrfToken = event.headers['x-csrf-token'];
    if (!csrfToken) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Invalid CSRF token' }) };
    }

    try {
        const { token, expiry } = JSON.parse(event.body);
        if (!token || !expiry) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' }) };
        }

        const dispatchRes = await fetch(AUTH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: { token, expiry }
            })
        });

        if (dispatchRes.status !== 204) {
            return { statusCode: dispatchRes.status, body: JSON.stringify({ message: 'Dispatch failed' }) };
        }

        const ownerRepo = GITHUB_REPO.split('/');
        const [owner, repo] = ownerRepo;
        const workflowId = 'token-validation.yml';
        let conclusion = null;
        const start = Date.now();
        const timeout = 60 * 1000;
        const pollInterval = 3000;

        while (Date.now() - start < timeout) {
            await new Promise(r => setTimeout(r, pollInterval));
            const runs = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?event=workflow_dispatch`,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            ).then(res => res.json());

            const latest = runs.workflow_runs && runs.workflow_runs[0];
            if (!latest) continue;
            if (['completed', 'failure', 'success'].includes(latest.status)) {
                conclusion = latest.conclusion;
                break;
            }
        }

        if (conclusion !== 'success') {
            return { statusCode: 401, body: JSON.stringify({ message: 'Validation failed or timed out' }) };
        }

        const sessionId = Array(32).fill().map(() => Math.random().toString(36)[2]).join('');
        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
            },
            body: JSON.stringify({ message: 'Authentication successful' })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: error.message || 'Server error' }) };
    }
};
