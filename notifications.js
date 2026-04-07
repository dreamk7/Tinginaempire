// FILE: notifications.js
// A centralized, reusable system for showing non-blocking toast notifications.

function showToast(message, iconClass = 'fa-check-circle') {
    // Check if a toast container exists; if not, create one.
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create the new toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Add an icon for visual feedback
    const icon = document.createElement('i');
    icon.className = `fas ${iconClass} icon`;
    
    // Add the message
    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    
    // Add the toast to the container
    toastContainer.appendChild(toast);
    
    // Animate it into view
    // Using a short timeout allows the browser to apply the initial styles before animating
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Set a timer to remove the toast after a few seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for the fade-out animation to complete before removing the element
        toast.addEventListener('transitionend', () => {
            if(toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        });
    }, 3000); // The toast will be visible for 3 seconds
}

// Global function for confirmation dialogs to replace window.confirm()
async function showConfirmation(message, title = "Are you sure?") {
    // This assumes you have the custom alert modal from the admin panel available
    const customAlert = {
        modal: document.getElementById('custom-alert-modal'),
        // ... (full custom alert object as defined in admin.js)
    };
    if (customAlert.modal) {
        return await customAlert.show(title, message, 'Confirm', 'Cancel');
    } else {
        // Fallback to the native browser confirm if the custom modal doesn't exist
        return confirm(message);
    }
}