document.addEventListener('DOMContentLoaded', function () {
    console.log("Admin panel initialized successfully");

    const GITHUB_REPO = 'Swuei/Portfolio';
    const DISCORD_WEBHOOK_URL = '';

    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const closeBtn = document.querySelector('.admin-close-btn');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const loginBtn = document.getElementById('loginBtn');
    const submitEntryBtn = document.getElementById('submitEntryBtn');
    const statusNotification = document.getElementById('statusNotification');

    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', function (e) {
            e.preventDefault();
            adminModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
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

    if (localStorage.getItem('adminSecret')) {
        loginForm.style.display = 'none';
        entryForm.style.display = 'block';
        if (adminBtn) adminBtn.style.display = 'flex';
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const token = document.getElementById('githubToken').value.trim();
            const expiry = document.getElementById('tokenExpiry').value.trim();

            if (!token || !expiry) {
                showNotification('Please enter both token and expiry', 'error');
                return;
            }

            if (!/^[a-f0-9]{40}$/.test(token)) {
                showNotification('Invalid token format', 'error');
                return;
            }

            const expiryDate = new Date(expiry);
            if (isNaN(expiryDate.getTime())) {
                showNotification('Invalid expiry format - use YYYY-MM-DD HH:MM', 'error');
                return;
            }

            if (expiryDate < new Date()) {
                showNotification('Token has expired', 'error');
                return;
            }

            localStorage.setItem('adminSecret', token);
            loginForm.style.display = 'none';
            entryForm.style.display = 'block';
            showNotification('Successfully logged in', 'success');
        });
    }

    if (submitEntryBtn) {
        submitEntryBtn.addEventListener('click', async () => {
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
                        'Authorization': `token ${localStorage.getItem('adminSecret')}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        event_type: 'update_downloads',
                        client_payload: formData
                    })
                });

                if (response.ok) {
                    showNotification('Entry submitted for processing!', 'success');
                    document.getElementById('entryForm').reset();
                } else {
                    const errorData = await response.json();
                    showNotification(`Failed to submit entry: ${errorData.message || 'Unknown error'}`, 'error');
                    console.error('Submission error details:', errorData);
                }
            } catch (error) {
                showNotification('Network error - check console', 'error');
                console.error('Submission error:', error);
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
