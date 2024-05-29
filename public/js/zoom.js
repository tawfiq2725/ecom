$(document).ready(function() {
    // Check if elevateZoom is available
    if ($.fn.elevateZoom) {
        // Initialize elevateZoom with enhanced settings
        $('.zoom-img').elevateZoom({
            zoomType: "lens",
            lensShape: "round",
            lensSize: 300, // Increased lens size for more prominent zoom
            scrollZoom: true, // Enable scroll to zoom
            zoomWindowWidth: 400, // Increased zoom window size for better zoom view
            zoomWindowHeight: 400,
            borderSize: 2, // Border around the lens for better visibility
            borderColour: "#fff" // Border color for the lens
        });
    } else {
        console.error('elevateZoom plugin is not loaded.');
    }

    // Check if TouchSpin is available
    if ($.fn.TouchSpin) {
        // Initialize TouchSpin
        $("#product-quantity").TouchSpin({
            verticalbuttons: true,
            min: 1, // Minimum quantity should be 1 instead of 0
            max: 100, // Maximum quantity limit
            step: 1 // Incremental steps
        });
    } else {
        console.error('TouchSpin plugin is not loaded.');
    }

    // Initialize other plugins if needed
});