document.addEventListener('DOMContentLoaded', function () {
    console.log("Admin panel initialized successfully");

    const GITHUB_REPO = 'Swuei/Portfolio';
    const AUTH_ENDPOINT = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/token-validation.yml/dispatches`;
    const DISCORD_WEBHOOK_URL = '';

    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.querySelector('.admin-close-btn');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const loginBtn = document.getElementById('loginBtn');
    const submitEntryBtn = document.getElementById('submitEntryBtn');
    const statusNotification = document.getElementById('statusNotification');
    const logoutBtn = document.getElementById('logoutBtn');

    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', function (e) {
            e.preventDefault();
            adminModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            checkAuthStatus();
        });

        closeBtn.addEventListener('click', function () {
            adminModal.style.display = 'none';
            document.body.style.overflow = '';
        });

        window.addEventListener('click', function (e) {
            if (e.target === adminModal) {
                adminModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    function checkAuthStatus() {
        const token = localStorage.getItem('adminSecret');
        const expiry = localStorage.getItem('tokenExpiry');

        if (token && expiry && new Date(expiry) > new Date()) {
            loginForm.style.display = 'none';
            entryForm.style.display = 'block';
            if (adminBtn) adminBtn.style.display = 'flex';
        } else {
            localStorage.removeItem('adminSecret');
            localStorage.removeItem('tokenExpiry');
            loginForm.style.display = 'block';
            entryForm.style.display = 'none';
        }
    }

    checkAuthStatus();

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const token = document.getElementById('githubToken').value.trim();
            const expiry = document.getElementById('tokenExpiry').value.trim();

            if (!token || !expiry) {
                showNotification('Please enter both token and expiry', 'error');
                return;
            }

            if (!/^[a-zA-Z0-9_]{40}$/.test(token)) {
                showNotification('Invalid token format - must be 40-character GitHub token', 'error');
                return;
            }

            try {
                const expiryDate = new Date(expiry);
                if (isNaN(expiryDate.getTime())) {
                    showNotification('Invalid expiry format', 'error');
                    return;
                }

                const isoExpiry = expiryDate.toISOString();

                const response = await fetch(AUTH_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ref: 'main',
                        inputs: {
                            token: token,
                            expiry: isoExpiry
                        }
                    })
                });

                if (response.status === 204) {
                    localStorage.setItem('adminSecret', token);
                    localStorage.setItem('tokenExpiry', isoExpiry);
                    checkAuthStatus();
                    showNotification('Validation request sent. Please check your email for confirmation.', 'success');
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Validation error:', error);
                showNotification('Token validation failed', 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminSecret');
            localStorage.removeItem('tokenExpiry');
            checkAuthStatus();
            showNotification('Successfully logged out', 'success');
        });
    }

   if (submitEntryBtn) {
    submitEntryBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('adminSecret');
        if (!token) {
            showNotification('Please log in first', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('entryName').value,
            sketchfabLink: document.getElementById('sketchfabLink').value,
            mediafireLink: document.getElementById('mediafireLink').value,
            counterName: document.getElementById('counterName').value,
            fileSize: document.getElementById('fileSize').value,
            modelCount: document.getElementById('modelCount').value,
            uploadDate: document.getElementById('uploadDate').value,
            targetPage: document.getElementById('targetPage').value
        };

        if (!formData.name || !formData.mediafireLink || !formData.counterName) {
            showNotification('Please fill all required fields', 'error');
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
                throw new Error(errorMessage);
            }

            showNotification('Entry submitted for processing!', 'success');
            
            const formElements = [
                'entryName', 'sketchfabLink', 'mediafireLink', 'counterName',
                'fileSize', 'modelCount', 'uploadDate'
            ];
            
            formElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
            
            const targetPageSelect = document.getElementById('targetPage');
            if (targetPageSelect) targetPageSelect.selectedIndex = 0;

        } catch (error) {
            console.error('Submission error:', error);
            let errorMessage = error.message;

            if (error instanceof SyntaxError) {
                errorMessage = 'Invalid server response';
            } else if (error.message.includes('401')) {
                errorMessage = 'Authentication failed - please log in again';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error - please try again later';
            }

            showNotification(`Submission failed: ${errorMessage}`, 'error');
        }
    });
}

    function showNotification(message, type = 'info') {
        if (!statusNotification) return;
        statusNotification.textContent = message;
        statusNotification.className = `status-notification ${type}`;
        statusNotification.style.display = 'block';

        setTimeout(() => {
            statusNotification.style.display = 'none';
        }, 5000);
    }
});
