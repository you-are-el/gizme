// Get elements
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('canvas');
const overlayImage = document.getElementById('overlay-image');
const overlayOptions = document.getElementById('overlay-options');
const downloadBtn = document.getElementById('download-btn');
const uploadLabel = document.getElementById('upload-label');
const backgroundUpload = document.getElementById('background-upload');

const ctx = canvas.getContext('2d');
let backgroundImage = null;

// Ensure canvas dimensions match the container
console.log("Canvas container width:", canvasContainer.clientWidth, "Canvas container height:", canvasContainer.clientHeight);
canvas.width = canvasContainer.clientWidth;
canvas.height = canvasContainer.clientHeight;
console.log("Canvas width set to:", canvas.width, "Canvas height set to:", canvas.height);

// Handle drag and drop for background image
canvasContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    console.log("Drag over detected");
});

canvasContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    console.log("Drop event detected");
    handleBackgroundImage(e.dataTransfer.files[0]);
});

// Handle click to upload background image
backgroundUpload.addEventListener('change', function(e) {
    console.log("Upload input change detected");
    handleBackgroundImage(e.target.files[0]);
});

function handleBackgroundImage(file) {
    if (file) {
        console.log("File selected:", file.name, "Type:", file.type);
    } else {
        console.log("No file selected");
        return;
    }

    if (file.type.startsWith('image/')) {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = function(event) {
            console.log("FileReader load event triggered");
            img.onload = function() {
                console.log("Image loaded successfully");
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log("Canvas cleared");

                // Draw the image centered and scaled to fit
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                console.log("Image scale:", scale, "Position (x, y):", x, y);
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                backgroundImage = { img: img, x: x, y: y, width: img.width * scale, height: img.height * scale };
                console.log("Image drawn to canvas");
                
                // Hide upload label
                uploadLabel.style.display = 'none';
                console.log("Upload label hidden");
            };
            img.onerror = function(e) {
                console.error("Image load error", e);
                alert("Error loading the image.");
            };
            img.src = event.target.result;
            console.log("Image src set to:", event.target.result);
        };
        reader.onerror = function(e) {
            console.error("FileReader error", e);
            alert("Error reading the file.");
        };
        console.log("Reading file as data URL");
        reader.readAsDataURL(file);
    } else {
        console.log("Invalid file type:", file.type);
        alert("Please select a valid image file.");
    }
}

// Handle overlay image selection
overlayOptions.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG') {
        const src = e.target.getAttribute('data-src');
        overlayImage.src = src;
        overlayImage.style.display = 'block';
        console.log("Overlay image selected:", src);
        // Reset position and size
        overlayImage.style.top = '0px';
        overlayImage.style.left = '0px';
        overlayImage.style.width = '100px';
        overlayImage.style.height = 'auto';
    }
});

// Make overlay image draggable and resizable
let isDragging = false;
let isResizing = false;
let startX, startY, startWidth, startHeight, startLeft, startTop;

overlayImage.addEventListener('mousedown', function(e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = overlayImage.clientWidth;
    startHeight = overlayImage.clientHeight;
    startLeft = overlayImage.offsetLeft;
    startTop = overlayImage.offsetTop;
    console.log("Mouse down on overlay image", { startX, startY, startWidth, startHeight, startLeft, startTop });

    // Determine if we're resizing or dragging
    if (e.offsetX > overlayImage.clientWidth - 10 && e.offsetY > overlayImage.clientHeight - 10) {
        isResizing = true;
        console.log("Resizing overlay image");
    } else {
        isDragging = true;
        console.log("Dragging overlay image");
    }
});

document.addEventListener('mousemove', function(e) {
    if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        overlayImage.style.left = (startLeft + dx) + 'px';
        overlayImage.style.top = (startTop + dy) + 'px';
        console.log("Moving overlay image", { dx, dy });
    } else if (isResizing) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newWidth = startWidth + dx;
        const newHeight = startHeight + dy;
        overlayImage.style.width = newWidth + 'px';
        overlayImage.style.height = newHeight + 'px';
        console.log("Resizing overlay image", { newWidth, newHeight });
    }
});

document.addEventListener('mouseup', function() {
    isDragging = false;
    isResizing = false;
    console.log("Mouse up, dragging and resizing stopped");
});

// Change cursor style
overlayImage.addEventListener('mousemove', function(e) {
    if (e.offsetX > overlayImage.clientWidth - 10 && e.offsetY > overlayImage.clientHeight - 10) {
        overlayImage.style.cursor = 'se-resize';
    } else {
        overlayImage.style.cursor = 'move';
    }
});

// Handle download
downloadBtn.addEventListener('click', function() {
    if (!backgroundImage) {
        console.log("No background image, can't download");
        alert("Please upload a background image first.");
        return;
    }

    // Draw the background image and overlay image onto a new canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    console.log("Drawing background image to temporary canvas");
    tempCtx.drawImage(backgroundImage.img, backgroundImage.x, backgroundImage.y, backgroundImage.width, backgroundImage.height);

    // Draw the overlay image if it exists
    if (overlayImage.style.display !== 'none') {
        const img = new Image();
        img.crossOrigin = 'anonymous';  // Enable cross-origin for the overlay image
        img.src = overlayImage.src;

        img.onload = function() {
            const rect = overlayImage.getBoundingClientRect();
            const containerRect = canvasContainer.getBoundingClientRect();
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;
            const width = overlayImage.clientWidth;
            const height = overlayImage.clientHeight;
            console.log("Drawing overlay image", { x, y, width, height });

            // Ensure the overlay image is drawn at the correct position
            tempCtx.drawImage(img, 0, 0, img.width, img.height, x, y, width, height);

            // Create a link to download the image
            const link = document.createElement('a');
            link.download = 'image.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
            console.log("Image downloaded");
        };

        img.onerror = function(e) {
            console.error("Overlay image load error", e);
            alert("Error loading the overlay image.");
        };
    } else {
        // No overlay image, download background image only
        const link = document.createElement('a');
        link.download = 'image.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
        console.log("Background image only downloaded");
    }
});
