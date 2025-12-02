
Map.centerObject(aoi, 10);

// Select Landsat 8 Surface Reflectance Collection 2
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_SR');

// Filter the collection by date and location
var filteredCollection = l8.filterBounds(aoi)
                           .filterDate('2023-01-01', '2023-12-31'); // Example Year

// ---------------------------------------------------------------------------------------------------
// 2. Cloud Masking Function
// ---------------------------------------------------------------------------------------------------

// Function to mask clouds and cloud shadows using the QA_PIXEL band
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBit = 1 << 3;
  var cloudBit = 1 << 5;
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBit).eq(0)
             .and(qa.bitwiseAnd(cloudBit).eq(0));
  return image.updateMask(mask).divide(10000) // Apply scale factor (SR values are *10000)
             .copyProperties(image, ['system:time_start']);
}

// Apply the mask and scale the Surface Reflectance values
var maskedCollection = filteredCollection.map(maskL8sr);

// Reduce the collection to a single image (e.g., median composite)
var composite = maskedCollection.median().clip(aoi);

// ---------------------------------------------------------------------------------------------------
// 3. NDBI Calculation and Visualization
// ---------------------------------------------------------------------------------------------------

// Landsat 8 Band Definitions (Collection 2 Surface Reflectance):
// NIR (Near-Infrared) = B5
// SWIR 1 (Short-Wave Infrared 1) = B6

var ndbi = composite.normalizedDifference(['B6', 'B5']).rename('NDBI');

// Define visualization parameters for NDBI
// Positive values (brighter) represent built-up areas.
var ndbiParams = {
  min: -0.5,
  max: 0.5,
  palette: ['0000FF', 'FFFFFF', 'FF0000'] // Blue (Water/Non-Built), White (Soil/Low Built), Red (High Built-up)
};

// ---------------------------------------------------------------------------------------------------
// 4. Display and Export
// ---------------------------------------------------------------------------------------------------

// Display the NDBI layer on the map
Map.addLayer(ndbi, ndbiParams, 'NDBI Built-up Index');

// Optional: Display a True Color Composite (B4, B3, B2) for context
var trueColorVis = {
  min: 0.0,
  max: 0.3, // Reflectance values are scaled 0-1
  bands: ['B4', 'B3', 'B2'],
};
Map.addLayer(composite, trueColorVis, 'True Color Composite');

// Optional: Export the NDBI image to Google Drive for use in QGIS
Export.image.toDrive({
  image: ndbi.multiply(10000).toInt16(), // Scale back up to save as Int16 (better for file size)
  description: 'NDBI_Bangalore_2023_Median',
  folder: 'GEE_Exports',
  scale: 30, // 30m resolution
  region: aoi.geometry(),
  maxPixels: 1e13
});
