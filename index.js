if (window.Sentry) {
    Sentry.init({ enabled: false });
}
document.addEventListener('DOMContentLoaded', function () {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');

    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.portfolio-item');
            const title = item.querySelector('h3').textContent;
            const src = btn.dataset.src;

            modalTitle.textContent = title;
            modalContent.innerHTML = `<iframe src="${src}" frameborder="0" allowfullscreen></iframe>`;
            modal.style.display = 'flex';
        });
    });

    closeModal.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const heroBtn = document.querySelector('.hero-text .btn');
    if (heroBtn) {
        heroBtn.addEventListener('mouseenter', () => {
            heroBtn.classList.add('animate__animated', 'animate__pulse');
        });
        heroBtn.addEventListener('mouseleave', () => {
            heroBtn.classList.remove('animate__animated', 'animate__pulse');
        });
    }
    const modelRequestForm = document.getElementById('modelRequestForm');
    const formStatus = document.getElementById('formStatus');

    const imageInput = document.getElementById('referenceImage');
    let imagePreview; 

    if (imageInput) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';

        const previewLabel = document.createElement('span');
        previewLabel.className = 'preview-label';
        previewLabel.textContent = 'Image Preview:';

        imagePreview = document.createElement('img'); 
        imagePreview.className = 'image-preview';
        imagePreview.style.display = 'none';

        previewContainer.appendChild(previewLabel);
        previewContainer.appendChild(imagePreview);
        imageInput.parentNode.appendChild(previewContainer);

        imageInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(this.files[0]);
            } else {
                imagePreview.style.display = 'none';
                previewContainer.style.display = 'none';
            }
        });
    }

    if (modelRequestForm) {
        modelRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = modelRequestForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            const imageUrlInput = document.getElementById('referenceImage');
            const imageUrl = imageUrlInput.value.trim();

            if (!imageUrl) {
                showError('Please provide an image URL');
                resetSubmitButton();
                return;
            }

            try {
                const url = new URL(imageUrl);
                const validDomains = ['ibb.co', 'i.ibb.co'];

                if (!validDomains.includes(url.hostname)) {
                    throw new Error('Only ImgBB URLs are allowed (format: https://ibb.co/... or https://i.ibb.co/...)');
                }

                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
                const pathHasExtension = imageExtensions.some(ext =>
                    url.pathname.toLowerCase().endsWith(ext) ||
                    url.pathname.toLowerCase().includes(ext + '/')
                );

                if (!pathHasExtension) {
                    https://ibb.co/YFj1nyP7
                    console.log('Assuming URL points to an image page');
                }

                const formData = new FormData(modelRequestForm);
                const data = Object.fromEntries(formData.entries());

                const webhookUrl = 'https://discord.com/api/webhooks/1389255048344895608/XggXNvL46jrNsv6ktOr3Y3wPSp6LsL6VpfsB2NN9zeNZas6MrBJDBaNXpPoBcMxD3yuj';

                const embed = {
                    title: '📦 New Model Request',
                    color: 0x00ffd5,
                    thumbnail: { url: 'https://i.ibb.co/MDhCjGRL/eye-block.png' },
                    fields: [
                        { name: '👤 Discord', value: `\`\`\`${data.discord}\`\`\``, inline: true },
                        { name: '🎯 Topic', value: `\`\`\`${data.topic}\`\`\``, inline: true },
                        { name: '🖼️ Texture Size', value: `\`\`\`${data.textureSize}\`\`\``, inline: true },
                        { name: '🏷️ Used For', value: `\`\`\`${data.usedFor}\`\`\``, inline: true },
                        { name: '📝 Details', value: `\`\`\`${data.details.substring(0, 1000)}\`\`\`` },
                        { name: '📎 Image', value: `[View on ImgBB](${imageUrl})` }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: { text: 'New model request submitted' }
                };

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: 'Model Request Bot',
                        avatar_url: 'https://i.ibb.co/MDhCjGRL/eye-block.png',
                        embeds: [embed],
                        content: `📬 New model request from ${data.discord}`
                    })
                });

                if (!response.ok) throw new Error('Failed to send to Discord');

                showSuccess('Request sent successfully! I\'ll contact you soon.');
                modelRequestForm.reset();
            } catch (error) {
                console.error('Error:', error);
                showError(error.message || 'Error sending request. Please try again.');
            } finally {
                resetSubmitButton();
            }
        });
    }

    function showError(message) {
        formStatus.textContent = message;
        formStatus.className = 'form-status error';
        formStatus.style.display = 'block';
    }

    function showSuccess(message) {
        formStatus.textContent = message;
        formStatus.className = 'form-status success';
        formStatus.style.display = 'block';
    }

    function resetSubmitButton() {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Request';
        submitBtn.disabled = false;
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    }
});
