exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
    }

    const csrfToken = event.headers['x-csrf-token'];
    if (!csrfToken) {
        return { statusCode: 403, body: JSON.stringify({ message: 'Invalid CSRF token' }) };
    }

    return {
        statusCode: 200,
        headers: {
            'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
        },
        body: JSON.stringify({ message: 'Logged out successfully' })
    };
};
