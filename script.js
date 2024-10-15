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
const overlayImagesContainer = document.getElementById('overlay-images-container');

const ctx = canvas.getContext('2d');
let backgroundImage = null;

// Store overlay transformation data
let overlayData = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
};

// Initialize Moveable but initially hide it
const moveable = new Moveable(document.body, {
    target: overlayContainer,
    draggable: true,
    resizable: true,
    scalable: true,
    rotatable: true,
    pinchable: true,
    keepRatio: true,
    origin: true,
    visible: false, // Initially invisible
});

// Hide Moveable initially
moveable.target = null;
moveable.visible = false;

// Handle Moveable events
moveable
    .on('drag', ({ target, left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
        overlayData.x = left;
        overlayData.y = top;
    })
    .on('resize', ({ target, width, height }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        overlayImage.style.width = `${width}px`;
        overlayImage.style.height = `${height}px`;
        overlayData.width = width;
        overlayData.height = height;
    })
    .on('rotate', ({ target, beforeDelta }) => {
        const rotate = overlayData.rotation + beforeDelta;
        overlayData.rotation = rotate;
        target.style.transform = `rotate(${rotate}deg)`;
    });

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

            // Reset overlay data for the new image
            overlayData = {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                rotation: 0,
            };

            // Show Moveable only after an image is loaded
            moveable.target = overlayContainer;
            moveable.updateTarget();
            moveable.visible = true;  // Make Moveable visible
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
                // Max width for the canvas (90vw based on your CSS)
                const maxCanvasWidth = canvasContainer.clientWidth;

                // Calculate the image aspect ratio
                const aspectRatio = img.width / img.height;

                // Calculate the new canvas width and height based on the image aspect ratio
                let newCanvasWidth = img.width;
                let newCanvasHeight = img.height;

                // If the image width exceeds the maximum canvas width, adjust the size proportionally
                if (newCanvasWidth > maxCanvasWidth) {
                    newCanvasWidth = maxCanvasWidth;
                    newCanvasHeight = newCanvasWidth / aspectRatio;
                }

                // Update the canvas dimensions to match the adjusted image size
                canvas.width = newCanvasWidth;
                canvas.height = newCanvasHeight;

                // Clear the canvas and draw the resized background image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, newCanvasWidth, newCanvasHeight);

                // Store the background image details
                backgroundImage = { img: img, x: 0, y: 0, width: newCanvasWidth, height: newCanvasHeight };

                // Hide the upload label after an image is successfully uploaded
                uploadLabel.style.display = 'none';

                // Adjust the canvas container size to match the new canvas dimensions
                canvasContainer.style.width = `${newCanvasWidth}px`;
                canvasContainer.style.height = `${newCanvasHeight}px`;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Handle download or open in new tab
downloadBtn.addEventListener('click', function() {
    if (!backgroundImage) {
        alert("Please upload a background image first.");
        return;
    }

    // Create a temporary canvas to render the full-resolution image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = backgroundImage.img.width;  // Original width
    tempCanvas.height = backgroundImage.img.height;  // Original height
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the original-size background image onto the temp canvas
    tempCtx.drawImage(backgroundImage.img, 0, 0, backgroundImage.img.width, backgroundImage.img.height);

    // Draw the overlay image at the correct position and size relative to the original image
    if (overlayImage.style.display !== 'none') {
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.src = overlayImage.src;

        img.onload = function() {
            const containerRect = canvasContainer.getBoundingClientRect();
            const overlayRect = overlayContainer.getBoundingClientRect();

            // Calculate the scale factor between the displayed canvas and the original image
            const scaleX = backgroundImage.img.width / containerRect.width;
            const scaleY = backgroundImage.img.height / containerRect.height;

            // Calculate the actual position and size for the overlay, relative to the original image size
            const x = (overlayRect.left - containerRect.left) * scaleX;
            const y = (overlayRect.top - containerRect.top) * scaleY;
            const width = overlayRect.width * scaleX;
            const height = overlayRect.height * scaleY;

            // Save the current canvas state
            tempCtx.save();

            // Translate to the center of the overlay image, rotate, then translate back
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            tempCtx.translate(centerX, centerY);
            tempCtx.rotate((overlayData.rotation * Math.PI) / 180); // Convert degrees to radians
            tempCtx.translate(-centerX, -centerY);

            // Draw the overlay image after rotation
            tempCtx.drawImage(img, x, y, width, height);

            // Restore the canvas state
            tempCtx.restore();

            // Convert the temp canvas to a Blob and trigger download
            tempCanvas.toBlob(function(blob) {
                const newImgUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = newImgUrl;
                link.download = 'my_gizmo_high_res.png';  // Set the download filename
                document.body.appendChild(link);  // Required for Firefox
                link.click();
                document.body.removeChild(link);  // Clean up
                URL.revokeObjectURL(newImgUrl);  // Clean up
            }, 'image/png');
        };
    } else {
        // No overlay image, just download the background image
        tempCanvas.toBlob(function(blob) {
            const newImgUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = newImgUrl;
            link.download = 'my_gizmo_high_res.png';  // Set the download filename
            document.body.appendChild(link);  // Required for Firefox
            link.click();
            document.body.removeChild(link);  // Clean up
            URL.revokeObjectURL(newImgUrl);  // Clean up
        }, 'image/png');
    }
});


document.addEventListener("DOMContentLoaded", function() {
    // Automatically focus on the cheat code input field when the page loads
    const cheatCodeInput = document.getElementById("cheat-code-input");
    cheatCodeInput.focus();

    // Function to handle the cheat code detection
    cheatCodeInput.addEventListener("keypress", function(event) {
        // Check if Enter key is pressed
        if (event.key === "Enter") {
            // If the entered value is "quantum", switch the overlay
            if (cheatCodeInput.value.toLowerCase() === "quantum") {
                // Find the second overlay (overlay2.png) and replace it with lil_el.png
                const overlayImages = document.querySelectorAll('#overlay-images-container img');
                if (overlayImages.length > 1) {
                    const overlay2 = overlayImages[1];  // Assuming the second overlay is at index 1
                    overlay2.src = 'overlays/lil_el.png';  // Replace overlay2 with lil_el.png
                    overlay2.setAttribute('data-src', 'overlays/lil_el.png'); // Update the data-src as well
                }
                cheatCodeInput.value = '';  // Clear the input field
            }
        }
    });

    // Function to handle clicks on overlay images
    const overlayImagesContainer = document.getElementById('overlay-images-container');
    overlayImagesContainer.addEventListener('click', function(event) {
        const clickedImage = event.target;

        // Ensure only images are clicked
        if (clickedImage.tagName.toLowerCase() === 'img') {
            const overlayImage = document.getElementById('overlay-image');
            const overlaySrc = clickedImage.getAttribute('data-src');

            // Load the clicked overlay image into the canvas overlay
            overlayImage.src = overlaySrc;
            overlayImage.style.display = 'block';
            overlayImage.style.top = '0px';
            overlayImage.style.left = '0px';
            overlayImage.style.width = '100px';
            overlayImage.style.height = 'auto';
        }
    });
});

