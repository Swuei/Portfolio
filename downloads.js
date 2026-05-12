document.addEventListener('DOMContentLoaded', function () {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    const firebaseConfig = {
        apiKey: "AIzaSyCz9MLnvwdLgHLI947uZGzDZFQipJKB8Gg",
        authDomain: "swuei-portfolio.firebaseapp.com",
        projectId: "swuei-portfolio",
        storageBucket: "swuei-portfolio.appspot.com",
        messagingSenderId: "498855900959",
        appId: "1:498855900959:web:1b6a010095b0914776a22a",
        measurementId: "G-3MZFQS8GQ0"
    };

    let db;
    try {
        const app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }

    const notification = document.createElement('div');
    notification.className = 'download-notification';
    document.body.appendChild(notification);

    function showNotification(message) {
        notification.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    async function updateTotalDownloads() {
        if (!db) return;
        try {
            const snapshot = await db.collection("downloads").get();
            const totalElement = document.getElementById('totalDownloads');
            if (totalElement) {
                const newCount = snapshot.size.toLocaleString();
                if (totalElement.textContent !== newCount) {
                    for (let i = 0; i < 8; i++) {
                        const spark = document.createElement('div');
                        spark.className = 'total-downloads-spark';
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 30 + Math.random() * 30;
                        spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
                        spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
                        spark.style.left = `${50 + Math.cos(angle) * 10}%`;
                        spark.style.top = `${50 + Math.sin(angle) * 10}%`;
                        totalElement.parentElement.appendChild(spark);
                        setTimeout(() => spark.remove(), 800);
                    }
                    totalElement.classList.add('total-downloads-bounce');
                    setTimeout(() => {
                        totalElement.textContent = newCount;
                    }, 200);
                    setTimeout(() => {
                        totalElement.classList.remove('total-downloads-bounce');
                    }, 400);
                }
            }
        } catch (error) {
            console.error('Error updating total downloads:', error);
        }
    }

    async function updateCounter(fileId) {
        if (!db) return;
        try {
            const snapshot = await db.collection("downloads").where("fileId", "==", fileId).get();
            const counterElement = document.querySelector(`[data-counter="${fileId}"] span`);
            if (counterElement) {
                counterElement.textContent = snapshot.size;
            }
        } catch (error) {
            console.error(`Error updating counter for ${fileId}:`, error);
        }
    }

    async function updateAllCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        const updatePromises = Array.from(counters).map(counter => {
            const fileId = counter.getAttribute('data-counter');
            return updateCounter(fileId);
        });
        await Promise.all(updatePromises);
        updateTotalDownloads();
    }

    function setButtonState(button, state, html = null) {
        const originalHtml = button.innerHTML;
        switch (state) {
            case 'loading':
                button.innerHTML = html || originalHtml;
                button.classList.add('loading');
                button.disabled = true;
                break;
            case 'success':
                button.innerHTML = html || originalHtml;
                button.classList.remove('loading');
                button.disabled = false;
                break;
            default:
                button.innerHTML = originalHtml;
                button.classList.remove('loading');
                button.disabled = false;
                break;
        }
    }

    async function trackDownloadInFirebase(fileId) {
        if (!db) throw new Error("Firestore not initialized");
        await db.collection("downloads").add({
            fileId: fileId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            source: 'mediafire'
        });
        updateTotalDownloads();
    }

    async function processDownload(event, fileId, button, downloadUrl) {
        try {
            setButtonState(button, 'loading', '<i class="fas fa-spinner fa-spin"></i> Processing...');

            await trackDownloadInFirebase(fileId);
            await updateCounter(fileId);

            setTimeout(() => window.open(downloadUrl, '_blank'), 300);
            setButtonState(button, 'success', '<i class="fas fa-check"></i> Downloaded');

            setTimeout(() => {
                setButtonState(button, 'default', '<i class="fas fa-download"></i> Download');
            }, 2000);

        } catch (error) {
            console.error("Download processing failed:", error);
            window.open(downloadUrl, '_blank');
            setButtonState(button, 'default');
        }
    }

    function handleDownloadClick(e) {
        e.preventDefault();
        const button = e.currentTarget;
        const downloadItem = button.closest('.download-item');
        if (!downloadItem) return;

        const counterElement = downloadItem.querySelector('[data-counter]');
        if (!counterElement) return;

        const fileId = counterElement.getAttribute('data-counter');
        const downloadUrl = button.getAttribute('href');

        if (!fileId || !downloadUrl) return;

        processDownload(e, fileId, button, downloadUrl);
    }

    function handleSharePageClick(e) {
        e.preventDefault();
        const button = e.currentTarget;
        setButtonState(button, 'loading', '<i class="fas fa-spinner fa-spin"></i> Copying...');
        const urlToCopy = 'https://swuei.github.io/Portfolio/downloads';

        if (navigator.permissions && navigator.permissions.query && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.permissions.query({ name: 'clipboard-write' })
                .then(result => {
                    if (result.state === 'granted' || result.state === 'prompt') {
                        navigator.clipboard.writeText(urlToCopy)
                            .then(() => {
                                showNotification('Page URL copied to clipboard!');
                                setButtonState(button, 'success', '<i class="fas fa-check"></i> Copied');
                                setTimeout(() => setButtonState(button, 'default', '<i class="fas fa-link"></i> Share my Page'), 2000);
                            })
                            .catch(() => fallbackCopy());
                    } else {
                        fallbackCopy();
                    }
                })
                .catch(() => fallbackCopy());
        } else {
            fallbackCopy();
        }

        function fallbackCopy() {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = urlToCopy;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (success) {
                    showNotification('Page URL copied to clipboard!');
                    setButtonState(button, 'success', '<i class="fas fa-check"></i> Copied');
                    setTimeout(() => setButtonState(button, 'default', '<i class="fas fa-link"></i> Share my Page'), 2000);
                }
            } catch (err) {
                showNotification('Failed to copy URL. Please copy it manually: ' + urlToCopy);
                setButtonState(button, 'default', '<i class="fas fa-link"></i> Share my Page');
            }
        }
    }

    function setupDownloadButtons() {
        document.querySelectorAll('.download-btn[data-download="true"]').forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', handleDownloadClick);
        });
    }

    function setupShareButton() {
        const shareButton = document.getElementById('share-page-btn');
        if (shareButton) {
            shareButton.addEventListener('click', handleSharePageClick);
        }
    }

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.onkeydown = function(event) {
        if (event.key === 'F12' ||
            (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'C' || event.key === 'J')) ||
            (event.ctrlKey && event.key === 'U') ||
            (event.ctrlKey && event.key === 'S') ||
            (event.ctrlKey && event.shiftKey && event.key === 'E')) {
            event.preventDefault();
            return false;
        }
    };
    document.onselectstart = () => false;

    setInterval(() => {
        if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
            alert('Please close DevTools to continue...');
            location.reload();
        }
    }, 500);

    updateAllCounters();
    setupDownloadButtons();
    setupShareButton();
});
