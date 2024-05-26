$(document).ready(function () {
    var cropper;
    var imageElement = document.getElementById('image-to-crop-category');
    var currentInputElement = document.getElementById('categoryImage');
    var currentCroppedImageElement = document.getElementById('category-cropped-image');

    currentInputElement.addEventListener('change', function (e) {
        const files = e.target.files;
        const done = function (url) {
            currentInputElement.value = ''; // Clear the input
            imageElement.src = url;
            $('#cropModalCategory').modal('show');
        };
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (event) {
                done(event.target.result);
            };
            reader.readAsDataURL(files[0]);
        }
    });

    $('#cropModalCategory').on('shown.bs.modal', function () {
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

    document.getElementById('cropButtonCategory').addEventListener('click', function () {
        const canvas = cropper.getCroppedCanvas({
            width: 400,
            height: 400,
        });
        currentCroppedImageElement.src = canvas.toDataURL();
        currentCroppedImageElement.style.display = 'block';
        canvas.toBlob(function (blob) {
            const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            currentInputElement.files = dataTransfer.files;
        });
        $('#cropModalCategory').modal('hide');
    });
});
