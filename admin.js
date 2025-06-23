console.log("Admin script loaded - test version");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    const testBtn = document.getElementById('adminBtn');
    const testModal = document.getElementById('adminModal');
    
    console.log("Button element:", testBtn);
    console.log("Modal element:", testModal);
    
    if (testBtn && testModal) {
        testBtn.addEventListener('click', function() {
            console.log("Button clicked - working!");
            testModal.style.display = 'flex';
        });
    } else {
        console.error("Elements not found!");
    }
});
