$(document).ready(function () {
    var cropper;
    var subImagesData = [];
    var currentImageIndex = 0;

    // Initialize cropper for main image
    initializeCropper(
        document.getElementById('mainImage'),
        document.getElementById('image-to-crop-product'),
        document.getElementById('main-cropped-image'),
        'cropModalProduct',
        'cropButtonProduct'
    );

    // Function to initialize cropper
    function initializeCropper(inputElement, imageElement, croppedImageElement, modalId, buttonId) {
        inputElement.addEventListener('change', function (e) {
            const files = e.target.files;
            const done = function (url) {
                inputElement.value = ''; // Clear the input
                imageElement.src = url;
                $('#' + modalId).modal('show');
            };
            if (files && files.length > 0) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    done(event.target.result);
                };
                reader.readAsDataURL(files[0]);
            }
        });

        $('#' + modalId).on('shown.bs.modal', function () {
            cropper = new Cropper(imageElement, {
                aspectRatio: 1,
                viewMode: 3,
            });
        }).on('hidden.bs.modal', function () {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        });

        document.getElementById(buttonId).addEventListener('click', function () {
            const canvas = cropper.getCroppedCanvas({
                width: 400,
                height: 400,
            });
            croppedImageElement.src = canvas.toDataURL();
            croppedImageElement.style.display = 'block';
            canvas.toBlob(function (blob) {
                const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                inputElement.files = dataTransfer.files;
            });
            $('#' + modalId).modal('hide');
        });
    }

    // Event listener for sub images
    document.getElementById('subImages').addEventListener('change', function (e) {
        const files = e.target.files;
        subImagesData = []; // Reset the subImagesData array
        const subImagePreviews = document.getElementById('subImagePreviews');
        subImagePreviews.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = function (event) {
                subImagesData.push({
                    file: files[i],
                    src: event.target.result,
                    cropped: false
                });
                if (i === files.length - 1) {
                    openSubImageCarousel();
                }
            };
            reader.readAsDataURL(files[i]);
        }
    });

    // Function to open the carousel modal for sub images
    function openSubImageCarousel() {
        const carouselInner = document.querySelector('#subImageCarousel .carousel-inner');
        carouselInner.innerHTML = '';

        subImagesData.forEach((data, index) => {
            const activeClass = index === 0 ? 'active' : '';

            const carouselItem = `
                <div class="carousel-item ${activeClass}">
                    <div class="img-container">
                        <img id="subimage-to-crop-${index}" src="${data.src}" alt="Sub Image ${index}">
                    </div>
                </div>`;
            carouselInner.insertAdjacentHTML('beforeend', carouselItem);
        });

        $('#cropModalSubImage').modal('show');
        currentImageIndex = 0;
        initializeSubImageCropper(currentImageIndex);
    }

    // Function to initialize cropper for sub images in carousel
    function initializeSubImageCropper(index) {
        const imageElement = document.getElementById(`subimage-to-crop-${index}`);
        if (!imageElement) return;

        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(imageElement, {
            aspectRatio: 1,
            viewMode: 3,
        });

        document.getElementById('cropButtonSubImage').onclick = function () {
            const canvas = cropper.getCroppedCanvas({
                width: 400,
                height: 400,
            });
            canvas.toBlob(function (blob) {
                const file = new File([blob], 'cropped-subimage.jpg', { type: 'image/jpeg' });
                subImagesData[index].file = file;
                subImagesData[index].src = URL.createObjectURL(blob);
                subImagesData[index].cropped = true;

                if (index < subImagesData.length - 1) {
                    currentImageIndex++;
                    $('#subImageCarousel').carousel('next');
                } else {
                    updateSubImageInputFiles();
                    $('#cropModalSubImage').modal('hide');
                }
            });
        };
    }

    // Function to update the input files for sub images
    function updateSubImageInputFiles() {
        const dataTransfer = new DataTransfer();
        subImagesData.forEach(data => {
            dataTransfer.items.add(data.file);
        });
        document.getElementById('subImages').files = dataTransfer.files;
    }

    // Event listener for carousel slide event to initialize cropper for the current image
    $('#subImageCarousel').on('slid.bs.carousel', function (e) {
        const index = $(e.relatedTarget).index();
        initializeSubImageCropper(index);
    });

    // Manually initialize cropper on modal show
    $('#cropModalSubImage').on('shown.bs.modal', function () {
        initializeSubImageCropper(currentImageIndex);
    });
});
