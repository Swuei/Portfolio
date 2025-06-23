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
    const deleteButtons = document.querySelectorAll('.delete-btn');

    if (!adminBtn) console.error("Admin button not found - check HTML ID");
    if (!adminModal) console.error("Admin modal not found - check HTML ID");

    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', function (e) {
            console.log("Admin button clicked");
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
        console.log("Admin session detected");
        if (adminBtn) adminBtn.style.display = 'flex';
        document.querySelectorAll('.admin-controls').forEach(el => {
            el.style.display = 'block';
        });
    }

    if (loginBtn && loginForm && entryForm) {
        loginBtn.addEventListener('click', async () => {
            const token = document.getElementById('githubToken').value.trim();
            const expiry = document.getElementById('tokenExpiry').value.trim();

            if (!token || !expiry) {
                showNotification('Please enter both token and expiry', 'error');
                return;
            }

            if (!/^[a-f0-9]{32}$/.test(token)) {
                showNotification('Invalid token format - must be 32-character hex', 'error');
                return;
            }

            const expiryDate = new Date(expiry);
            if (isNaN(expiryDate.getTime())) {
                showNotification('Invalid expiry format - use YYYY-MM-DDTHH:MM:SSZ', 'error');
                return;
            }

            if (expiryDate < new Date(Date.now() + 120000)) {
                showNotification('Token has expired', 'error');
                return;
            }

            localStorage.setItem('adminSecret', token);
            loginForm.style.display = 'none';
            entryForm.style.display = 'block';
            if (adminBtn) adminBtn.style.display = 'flex';
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

            if (!formData.name || !formData.sketchfabLink || !formData.mediafireLink || !formData.counterName) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            try {
                const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${localStorage.getItem('adminSecret')}`,
                        'Accept': 'application/vnd.github.v3+json'
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
                    showNotification('Failed to submit entry', 'error');
                }
            } catch (error) {
                showNotification('Network error - check console', 'error');
                console.error('Submission error:', error);
            }
        });
    }

    deleteButtons.forEach(button => {
        const counterName = button.getAttribute('data-counter');
        button.addEventListener('click', () => deleteEntry(button, counterName));
    });

    async function deleteEntry(button, counterName) {
        if (!confirm('Permanently delete this entry?')) return;

        const item = button.closest('.download-item');
        const token = localStorage.getItem('adminSecret');
        const page = window.location.pathname.split('/').pop();

        try {
            const response = await fetch(page);
            const htmlContent = await response.text();
            const entryStart = htmlContent.indexOf(`data-counter="${counterName}"`);
            const entryEnd = htmlContent.indexOf('</div>', htmlContent.indexOf('</div>', entryStart) + 1);
            const updatedHtml = htmlContent.slice(0, entryStart) + htmlContent.slice(entryEnd + 6);
            const success = await updateGitHubFile(page, updatedHtml, token);

            if (success) {
                item.remove();
                showNotification('Entry deleted!', 'success');
            } else {
                showNotification('Deletion failed', 'error');
            }
        } catch (error) {
            showNotification('Error: Check console', 'error');
            console.error('Deletion error:', error);
        }
    }

    async function updateGitHubFile(path, content, token) {
        try {
            const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const fileData = await getResponse.json();

            const encoder = new TextEncoder();
            const encoded = encoder.encode(content);
            const base64Content = btoa(String.fromCharCode(...new Uint8Array(encoded)));

            const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Updated ${path}`,
                    content: base64Content,
                    sha: fileData.sha
                })
            });

            return updateResponse.ok;
        } catch (error) {
            console.error('File update error:', error);
            return false;
        }
    }

    function showNotification(message, type = 'info') {
        if (!statusNotification) return;
        statusNotification.textContent = message;
        statusNotification.className = `notification ${type}`;
        statusNotification.style.display = 'block';
        setTimeout(() => {
            statusNotification.style.display = 'none';
        }, 5000);
    }
});