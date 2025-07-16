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
    notification.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>You can only download this resource once to prevent inaccurate count</span>';
    document.body.appendChild(notification);

    function showNotification() {
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

                        setTimeout(() => {
                            spark.remove();
                        }, 800);
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
                button.classList.add('disabled');
                button.disabled = false;
                break;
            default:
                button.innerHTML = originalHtml;
                button.classList.remove('loading');
                button.disabled = false;
                break;
        }
    }

    function isAlreadyDownloaded(fileId) {
        const downloadKey = `downloaded_${fileId}`;
        return localStorage.getItem(downloadKey) !== null;
    }

    function markAsDownloaded(fileId) {
        const downloadKey = `downloaded_${fileId}`;
        localStorage.setItem(downloadKey, 'true');
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
            if (isAlreadyDownloaded(fileId)) {
                showNotification();
                setButtonState(button, 'default');
                return;
            }
            await trackDownloadInFirebase(fileId);
            markAsDownloaded(fileId);
            await updateCounter(fileId);
            setTimeout(() => window.open(downloadUrl, '_blank'), 300);
            setButtonState(button, 'success', '<i class="fas fa-check"></i> Downloaded');
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
        if (button.classList.contains('disabled')) {
            showNotification();
            return;
        }
        processDownload(e, fileId, button, downloadUrl);
    }

    function setupDownloadButtons() {
        document.querySelectorAll('.download-btn[data-download="true"]').forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', handleDownloadClick);
        });
    }

    updateAllCounters();
    setupDownloadButtons();
});