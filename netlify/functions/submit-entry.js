exports.handler = async (event, context) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'Swuei/Portfolio';

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
    }

    const csrfToken = event.headers['x-csrf-token'];
    if (!csrfToken) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Invalid CSRF token' }) };
    }

    const cookies = event.headers.cookie?.split('; ').reduce((acc, cookie) => {
        const [name, value] = cookie.split('=');
        acc[name] = value;
        return acc;
    }, {});
    if (!cookies?.session) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }

    try {
        const formData = JSON.parse(event.body);
        if (!formData.name || !formData.mediafireLink || !formData.counterName) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' }) };
        }

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                event_type: 'update_downloads',
                client_payload: formData
            })
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage = `HTTP ${response.status}`;
            try {
                const responseData = JSON.parse(responseText);
                errorMessage = responseData.message || errorMessage;
            } catch (e) {
                console.warn('Failed to parse JSON response:', responseText);
            }
            return { statusCode: response.status, body: JSON.stringify({ message: errorMessage }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Entry submitted successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message || 'Server error' })
        };
    }
};
