
var startDate = '2024-03-01'; // Target 2024 Pre-Monsoon
var endDate = '2024-05-31';
var L8_SR = 'LANDSAT/LC08/C02/T1_L2'; // Landsat 8/9 Surface Reflectance

// Load, filter, and apply initial cloud filter
var collection = ee.ImageCollection(L8_SR)
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', 20)); 

// Standard function to remove cloudy/shadowed pixels
function maskL8sr(image) {
    var qa = image.select('QA_PIXEL');
    var mask = qa.bitwiseAnd(4).eq(0)     // Remove cloud shadows
                 .and(qa.bitwiseAnd(8).eq(0))    // Remove clouds
                 .and(qa.bitwiseAnd(16).eq(0));  // Remove high confidence clouds
    return image.updateMask(mask).clip(aoi);
}

var maskedCollection = collection.map(maskL8sr);


// Function to add an NDVI band to each image in the collection
function calculateNDVI(image) {
    // NDVI = (NIR - Red) / (NIR + Red)
    // Landsat 8/9 Bands: NIR is B5, Red is B4
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
    
    // The L2 product bands need scaling; the NDVI result is scaled 0-1 here.
    return image.addBands(ndvi.toFloat()); 
}

var ndviCollection = maskedCollection.map(calculateNDVI);


// Calculate the Mean NDVI for the entire season
var meanNDVI = ndviCollection.select('NDVI').mean().clip(aoi).rename('Mean_NDVI');

// Define visualization parameters (standard colors for NDVI)
var ndviVis = {
  min: 0.0,
  max: 0.8,
  palette: [
    'FFFFFF', // Bare soil/Water (White/Grey)
    'CE7E45', // Sparse Vegetation (Browns)
    'DF923D', 
    'F1B555', 
    '99B718', // Medium Vegetation (Greens)
    '74A901', 
    '056201', // Dense Vegetation (Dark Greens)
    '004C00', 
  ]
};

// Display the result on the map
Map.addLayer(meanNDVI, ndviVis, 'Mean NDVI (Step 0.3)');

// Export to Google Drive (GeoTIFF)
// Crucial: Set scale to 30m to match the LST output resolution.
Export.image.toDrive({
  image: meanNDVI,
  description: 'Bangalore_Mean_NDVI_2025',
  folder: 'GEE_Exports_BGI',
  scale: 30, // Landsat native resolution
  region: aoi.geometry().bounds(),
  maxPixels: 1e13
});
