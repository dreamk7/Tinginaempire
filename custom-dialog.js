// FILE: custom-dialog.js
// A centralized, promise-based replacement for window.confirm().

function showConfirmation(title, message) {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-confirm-modal');
        if (!modal) {
            console.error('Custom confirm modal HTML is missing from this page.');
            // Fallback to native confirm if modal doesn't exist
            resolve(confirm(message));
            return;
        }

        modal.querySelector('#custom-confirm-title').textContent = title;
        modal.querySelector('#custom-confirm-message').textContent = message;
        
        const confirmBtn = modal.querySelector('.btn-confirm');
        const cancelBtn = modal.querySelector('.btn-cancel');

        modal.classList.add('visible');

        // We need to remove old listeners before adding new ones to prevent bugs
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newConfirmBtn.onclick = () => {
            modal.classList.remove('visible');
            resolve(true); // User clicked "Confirm"
        };
        newCancelBtn.onclick = () => {
            modal.classList.remove('visible');
            resolve(false); // User clicked "Cancel"
        };
    });
}