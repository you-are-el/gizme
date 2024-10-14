// Get elements
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('canvas');
const overlayImage = document.getElementById('overlay-image');
const overlayOptions = document.getElementById('overlay-options');
const downloadBtn = document.getElementById('download-btn');
const uploadLabel = document.getElementById('upload-label');
const backgroundUpload = document.getElementById('background-upload');
const overlayFolderPath = 'overlays/';

const overlayContainer = document.getElementById('overlay-container');
const moveHandle = document.getElementById('move-handle');
const resizeHandle = document.getElementById('resize-handle');
const rotateHandle = document.getElementById('rotate-handle');
const overlayImagesContainer = document.getElementById('overlay-images-container');

const ctx = canvas.getContext('2d');
let backgroundImage = null;
let currentRotation = 0;

// Function to load overlay images
function loadOverlayImages() {
    const overlayImages = ['overlay1.png', 'overlay2.png'];  // Update with your actual filenames

    overlayImages.forEach((filename) => {
        const img = new Image();
        img.src = overlayFolderPath + filename;
        img.alt = 'Overlay ' + filename;
        img.setAttribute('data-src', overlayFolderPath + filename);
        img.width = 100;
        img.style.cursor = 'pointer';
        img.style.margin = '0 10px';

        img.addEventListener('click', function() {
            overlayImage.src = this.getAttribute('data-src');
            overlayImage.style.display = 'block';
            overlayImage.style.top = '0px';
            overlayImage.style.left = '0px';
            overlayImage.style.width = '100px';
            overlayImage.style.height = 'auto';
        });

        img.onerror = function() {
            console.error('Error loading image:', filename);
            return;
        };

        overlayImagesContainer.appendChild(img);
    });
}

// Call the function to load images
loadOverlayImages();

// Ensure canvas dimensions match the container
canvas.width = canvasContainer.clientWidth;
canvas.height = canvasContainer.clientHeight;

// Handle drag and drop for background image
canvasContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

canvasContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    handleBackgroundImage(e.dataTransfer.files[0]);
});

// Handle click to upload background image
backgroundUpload.addEventListener('change', function(e) {
    handleBackgroundImage(e.target.files[0]);
});

function handleBackgroundImage(file) {
    if (file && file.type.startsWith('image/')) {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = function(event) {
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;

                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                backgroundImage = { img: img, x: x, y: y, width: img.width * scale, height: img.height * scale };
                uploadLabel.style.display = 'none';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Handle overlay image selection
overlayOptions.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG') {
        overlayImage.src = e.target.getAttribute('data-src');
        overlayImage.style.display = 'block';
        overlayImage.style.top = '0px';
        overlayImage.style.left = '0px';
        overlayImage.style.width = '100px';
        overlayImage.style.height = 'auto';
    }
});

// Make overlay image draggable, resizable, and rotatable
let isDragging = false;
let isResizing = false;
let isRotating = false;
let startX, startY, startWidth, startHeight, startLeft, startTop;
let startRotationAngle = 0;
let centerX, centerY;

function startDrag(e) {
    e.preventDefault();

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    startWidth = overlayContainer.clientWidth;
    startHeight = overlayContainer.clientHeight;
    startLeft = overlayContainer.offsetLeft;
    startTop = overlayContainer.offsetTop;

    // Calculate the center point of the overlay for rotation
    const rect = overlayContainer.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;

    if (e.target === moveHandle) {
        isDragging = true;
    } else if (e.target === resizeHandle) {
        isResizing = true;
    } else if (e.target === rotateHandle) {
        isRotating = true;
        startRotationAngle = calculateAngle(clientX, clientY);
    }
}

// Function to calculate the angle between the center of the image and the pointer position
function calculateAngle(x, y) {
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);  // Convert radians to degrees
}

function moveDrag(e) {
    if (!isDragging && !isResizing && !isRotating) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    if (isDragging) {
        overlayContainer.style.left = `${startLeft + dx}px`;
        overlayContainer.style.top = `${startTop + dy}px`;
    } else if (isResizing) {
        overlayContainer.style.width = `${startWidth + dx}px`;
        overlayContainer.style.height = `${startHeight + dy}px`;
        overlayImage.style.width = `${startWidth + dx}px`;
        overlayImage.style.height = `${startHeight + dy}px`;
    } else if (isRotating) {
        const currentAngle = calculateAngle(clientX, clientY);
        const angleDiff = currentAngle - startRotationAngle;
        currentRotation += angleDiff;  // Adjust current rotation based on the change in angle
        overlayContainer.style.transform = `rotate(${currentRotation}deg)`;
        startRotationAngle = currentAngle;  // Update the starting angle for continuous rotation
    }
}

function stopDrag() {
    isDragging = false;
    isResizing = false;
    isRotating = false;
}

// Attach events
moveHandle.addEventListener('mousedown', startDrag);
moveHandle.addEventListener('touchstart', startDrag);

resizeHandle.addEventListener('mousedown', startDrag);
resizeHandle.addEventListener('touchstart', startDrag);

rotateHandle.addEventListener('mousedown', startDrag);  // Rotate handle
rotateHandle.addEventListener('touchstart', startDrag);

document.addEventListener('mousemove', moveDrag);
document.addEventListener('touchmove', moveDrag);

document.addEventListener('mouseup', stopDrag);
document.addEventListener('touchend', stopDrag);

// Handle download or open in new tab
downloadBtn.addEventListener('click', function() {
    if (!backgroundImage) {
        alert("Please upload a background image first.");
        return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the background image onto the temp canvas
    tempCtx.drawImage(backgroundImage.img, backgroundImage.x, backgroundImage.y, backgroundImage.width, backgroundImage.height);

    // Draw the overlay image if it exists
    if (overlayImage.style.display !== 'none') {
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.src = overlayImage.src;

        img.onload = function() {
            const rect = overlayContainer.getBoundingClientRect();
            const containerRect = canvasContainer.getBoundingClientRect();
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;
            const width = overlayContainer.clientWidth;
            const height = overlayContainer.clientHeight;

            tempCtx.drawImage(img, 0, 0, img.width, img.height, x, y, width, height);

            // Convert the canvas to a Blob and trigger download
            tempCanvas.toBlob(function(blob) {
                const newImgUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = newImgUrl;
                link.download = 'my_gizmo.png'; // Set the download filename
                document.body.appendChild(link); // Required for Firefox
                link.click();
                document.body.removeChild(link); // Clean up
                URL.revokeObjectURL(newImgUrl); // Clean up
            }, 'image/png');
        };
    } else {
        // No overlay image, just download the background image
        tempCanvas.toBlob(function(blob) {
            const newImgUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = newImgUrl;
            link.download = 'my_gizmo.png'; // Set the download filename
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link); // Clean up
            URL.revokeObjectURL(newImgUrl); // Clean up
        }, 'image/png');
    }
});
