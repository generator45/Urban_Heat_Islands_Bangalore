

var startDate = '2025-03-01'; // Target 2025 Pre-Monsoon
var endDate = '2025-05-31';
var L8_SR = 'LANDSAT/LC08/C02/T1_L2'; // Landsat 8/9 Surface Reflectance

var collection = ee.ImageCollection(L8_SR)
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', 20)); // Filter for less than 20% cloud cover

// 2. CLOUD MASKING FUNCTION
// Standard function to remove cloudy/shadowed pixels using the QA_PIXEL band.
function maskL8sr(image) {
    var qa = image.select('QA_PIXEL');
    var mask = qa.bitwiseAnd(4).eq(0)     // Remove cloud shadows (Bit 2)
                 .and(qa.bitwiseAnd(8).eq(0))    // Remove clouds (Bit 3)
                 .and(qa.bitwiseAnd(16).eq(0));  // Remove high confidence clouds (Bit 4)
    return image.updateMask(mask).clip(aoi);
}

var maskedCollection = collection.map(maskL8sr);

// 3. LST CALCULATION FUNCTION
// Calculates Brightness Temperature (BT), NDVI, Emissivity (EM), and final LST (Celsius).
function calculateLST(image) {
    // 3a. Brightness Temperature (BT) in Kelvin
    // ST_B10 is the thermal band, scaled to Kelvin in the L2 product.
    // The coefficients (0.00341802 and 149.0) apply the official scale factors.
    var thermal = image.select('ST_B10').multiply(0.00341802).add(149.0); // BT in Kelvin
    
    // 3b. NDVI (B5 is NIR, B4 is Red for Landsat 8/9)
    var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
    
    // 3c. Calculate Min/Max NDVI over the AOI for Emissivity calculation (Fix implemented)
    var stats = ndvi.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: aoi,
        scale: 30, // Must match data resolution
        bestEffort: true,
        maxPixels: 1e9 
    });

    var ndviMin = ee.Number(stats.get('NDVI_min'));
    var ndviMax = ee.Number(stats.get('NDVI_max'));
    
    // Convert the single ee.Number values back to a constant image for per-pixel math
    var ndviMinImage = ee.Image(ndviMin);
    var ndviMaxImage = ee.Image(ndviMax);

    // 3d. Proportion of Vegetation (PV) and Emissivity (EM)
    // Formula: PV = ((NDVI - NDVI_min) / (NDVI_max - NDVI_min))^2
    var pv = ndvi.subtract(ndviMinImage)
                 .divide(ndviMaxImage.subtract(ndviMinImage))
                 .pow(ee.Number(2))
                 .rename('PV');

    // Emissivity (Simplified formula: 0.004 * PV + 0.986)
    var emissivity = pv.multiply(0.004).add(0.986).rename('EM');

    // 3e. Final LST Calculation (in Celsius)
    // LST = BT / [1 + (lambda * BT / c2) * ln(emissivity)] - 273.15
    // Constants used: lambda * BT / c2 where lambda=10.9 µm (for Band 10), c2=14388 µm K
    var LST = thermal.expression(
      '(TB / (1 + (0.00115 * TB / 1.4388) * log(EM))) - 273.15', {
          'TB': thermal,
          'EM': emissivity
    }).rename('LST_C');

    return image.addBands(LST);
}

// 4. AGGREGATION AND VISUALIZATION
var lstCollection = maskedCollection.map(calculateLST);

// Calculate the Mean LST for the entire season
var meanLST = lstCollection.select('LST_C').mean().clip(aoi).rename('Mean_LST');

// Display the result on the map
Map.addLayer(meanLST, {min: 20, max: 40, palette: ['blue', 'yellow', 'red']}, 'Mean LST (Celsius)');
Map.centerObject(aoi, 10);

// 5. EXPORT TO GOOGLE DRIVE (GeoTIFF)
// Scale is set to 30 meters (native resolution) for maximum accuracy.
Export.image.toDrive({
  image: meanLST,
  description: 'Bangalore_Mean_LST_2025',
  folder: 'GEE_Exports_BGI',
  scale: 30, // 30m is the native resolution of Landsat LST
  region: aoi.geometry().bounds(),
  maxPixels: 1e13
});
