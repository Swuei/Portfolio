document.addEventListener('DOMContentLoaded', function () {
    console.log("Admin panel initialized successfully");

    const NETLIFY_FUNCTIONS = '/.netlify/functions';
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.querySelector('.admin-close-btn');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const loginBtn = document.getElementById('loginBtn');
    const submitEntryBtn = document.getElementById('submitEntryBtn');
    const statusNotification = document.getElementById('statusNotification');
    const logoutBtn = document.getElementById('logoutBtn');
    const shareBtn = document.getElementById('shareBtn');

    let csrfToken = generateCSRFToken();

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

    function generateCSRFToken() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function checkAuthStatus() {
        fetch(`${NETLIFY_FUNCTIONS}/check-auth`, {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                loginForm.style.display = 'none';
                entryForm.style.display = 'block';
                if (adminBtn) adminBtn.style.display = 'flex';
            } else {
                loginForm.style.display = 'block';
                entryForm.style.display = 'none';
            }
        })
        .catch(() => {
            loginForm.style.display = 'block';
            entryForm.style.display = 'none';
        });
    }

    checkAuthStatus();

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const token = sanitizeInput(document.getElementById('githubToken').value.trim());
            const expiryInput = sanitizeInput(document.getElementById('tokenExpiry').value.trim());

            if (!token || !expiryInput) {
                showNotification('Please enter both token and expiry', 'error');
                return;
            }

            const expiryDate = new Date(expiryInput);
            if (isNaN(expiryDate.getTime())) {
                showNotification('Invalid expiry format', 'error');
                return;
            }

            try {
                const response = await fetch(`${NETLIFY_FUNCTIONS}/auth`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({
                        token,
                        expiry: expiryDate.toISOString()
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Authentication failed');
                }

                csrfToken = generateCSRFToken();
                checkAuthStatus();
                showNotification('✅ Access granted', 'success');
            } catch (err) {
                console.error(err);
                showNotification(err.message || 'Authentication failed', 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${NETLIFY_FUNCTIONS}/logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'X-CSRF-Token': csrfToken
                    }
                });
                csrfToken = generateCSRFToken();
                checkAuthStatus();
                showNotification('Successfully logged out', 'success');
            } catch (err) {
                showNotification('Logout failed', 'error');
            }
        });
    }

    if (submitEntryBtn) {
        submitEntryBtn.addEventListener('click', async () => {
            const formData = {
                name: sanitizeInput(document.getElementById('entryName').value),
                sketchfabLink: sanitizeInput(document.getElementById('sketchfabLink').value),
                mediafireLink: sanitizeInput(document.getElementById('mediafireLink').value),
                counterName: sanitizeInput(document.getElementById('counterName').value),
                fileSize: sanitizeInput(document.getElementById('fileSize').value),
                modelCount: sanitizeInput(document.getElementById('modelCount').value),
                uploadDate: sanitizeInput(document.getElementById('uploadDate').value),
                targetPage: sanitizeInput(document.getElementById('targetPage').value),
                isNew: document.getElementById('isNew').checked,
                isAnimated: document.getElementById('isAnimated').checked
            };

            if (!formData.name || !formData.mediafireLink || !formData.counterName) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            try {
                const response = await fetch(`${NETLIFY_FUNCTIONS}/submit-entry`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || `HTTP ${response.status}`);
                }

                showNotification('Entry submitted for processing!', 'success');

                ['entryName', 'sketchfabLink', 'mediafireLink', 'counterName',
                 'fileSize', 'modelCount', 'uploadDate'].forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.value = '';
                });

                const targetPageSelect = document.getElementById('targetPage');
                if (targetPageSelect) targetPageSelect.selectedIndex = 0;

                csrfToken = generateCSRFToken();
            } catch (error) {
                console.error('Submission error:', error);
                let errorMessage = error.message;
                if (error.message.includes('401')) {
                    errorMessage = 'Authentication failed - please log in again';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error - please try again later';
                }
                showNotification(`Submission failed: ${errorMessage}`, 'error');
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                showNotification('URL copied to clipboard!', 'success');
            } catch (err) {
                showNotification('Failed to copy URL', 'error');
            }
        });
    }

    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
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
