$(document).ready(function() {
    // Initialize zoom for the main image
    $("#zoom_01").elevateZoom({
        zoomType: "lens",
        lensShape: "round",
        lensSize: 200,
        scrollZoom: true,
        cursor: "crosshair",
        gallery: 'carousel-custom',
        galleryActiveClass: "active"
    });

    // Update zoom image on thumbnail click
    $('.carousel-indicators li').on('click', function() {
        var newImage = $(this).find('img').attr('src');
        var newZoomImage = $(this).find('img').attr('data-zoom-image');

        // Change the main image and its zoom image
        $('#zoom_01').attr('src', newImage).attr('data-zoom-image', newZoomImage);

        // Reinitialize Elevate Zoom
        $('#zoom_01').data('elevateZoom').swaptheimage(newImage, newZoomImage);
    });

    // Initialize zoom for thumbnail images
    $(".zoom-thumb").each(function() {
        $(this).elevateZoom({
            zoomType: "lens",
            lensShape: "round",
            lensSize: 200,
            scrollZoom: true,
            cursor: "crosshair"
        });
    });

    // Also initialize zoom for main image in case of hover
    $(".zoom-img").elevateZoom({
        zoomType: "lens",
        lensShape: "round",
        lensSize: 200,
        scrollZoom: true,
        cursor: "crosshair"
    });
});
