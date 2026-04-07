// FILE: cropper-service.js
// A reusable class to manage image cropping for any form.

class ImageCropper {
    constructor(modalId, imageElementId, confirmButtonId) {
        this.modal = document.getElementById(modalId);
        this.imageElement = document.getElementById(imageElementId);
        this.confirmButton = document.getElementById(confirmButtonId);
        this.cropperInstance = null;
        this.croppedBlob = null;
        this.resolvePromise = null;

        this.confirmButton.addEventListener('click', this.handleConfirm.bind(this));
        this.modal.querySelector('.modal-close-btn').addEventListener('click', this.handleCancel.bind(this));
    }

    // Public method to start the cropping process
    open(file) {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.imageElement.src = URL.createObjectURL(file);
            this.modal.classList.add('visible');

            // Initialize Cropper.js
            if (this.cropperInstance) {
                this.cropperInstance.destroy();
            }
            this.cropperInstance = new Cropper(this.imageElement, {
                aspectRatio: 1, // Enforce a square crop
                viewMode: 1,
                background: false,
                autoCropArea: 0.8,
            });
        });
    }

    handleConfirm() {
        if (!this.cropperInstance) return;

        this.cropperInstance.getCroppedCanvas({
            width: 500, // Standardize output size
            height: 500,
            imageSmoothingQuality: 'high',
        }).toBlob((blob) => {
            this.croppedBlob = blob;
            this.close();
            this.resolvePromise(this.croppedBlob); // Resolve the promise with the blob
        }, 'image/png');
    }

    handleCancel() {
        this.close();
        this.resolvePromise(null); // Resolve with null if canceled
    }

    close() {
        this.modal.classList.remove('visible');
        if (this.cropperInstance) {
            this.cropperInstance.destroy();
            this.cropperInstance = null;
        }
    }
}