exports.handler = async (event, context) => {
    try {
        const cookies = event.headers.cookie?.split('; ').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=');
            acc[name] = value;
            return acc;
        }, {});
        const isAuthenticated = !!cookies?.session;
        return {
            statusCode: 200,
            body: JSON.stringify({ isAuthenticated })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server error' })
        };
    }
};
