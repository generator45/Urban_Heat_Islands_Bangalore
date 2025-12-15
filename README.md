# Optimal Map for Blue-Green Infrastructure (BGI) in Bangalore Hotspots

**Project Team:** Parv Sharma, Jayesh Pandit, Paritosh Tiwari, Shivam Pandya, Krish Kathiria

This project aims to develop a geospatial Multi-Criteria Analysis (MCA) model to calculate the optimal siting score for new Blue-Green Infrastructure (BGI) deployment across wards in Bangalore. The focus is on mitigating the Urban Heat Island (UHI) effect and prioritizing resources toward the most vulnerable populations.

## What is Blue-Green Infrastructure (BGI)?

Blue-Green Infrastructure (BGI) is a modern, holistic, and sustainable approach to urban planning that explicitly integrates nature and natural processes into the built environment. It involves strategically planned networks of **Blue Elements** (water management systems) and **Green Elements** (vegetated areas). The goal is to move away from relying only on traditional "grey" infrastructure toward solutions that mimic nature and provide multiple benefits simultaneously.

## Problem Statement: Optimal Siting Map

The optimal score for a ward is calculated by dividing the problem into four different layers (L1, L2, L3) and a Constraint layer (C).

### Suitability Score Formula
$$
\text{Suitability Score} = (W_{1} \cdot L_{1} + W_{2} \cdot L_{2} + W_{3} \cdot L_{3}) \cdot C
$$

| Layer ID | Description | Weight ($W$) | Justification |
| :--- | :--- | :--- | :--- |
| $L_1$ | UHI Intensity (Hazard Layer) | 0.40 (40%) | High Priority. Identifies the physical driver of the problem (high heat). |
| $L_2$ | Heat Vulnerability Index (Impact Layer) | 0.45 (45%) | Highest Priority. Directly targets vulnerable populations (social equity). |
| $L_3$ | BGI Cooling Potential (Benefit Layer) | 0.15 (15%) | Context/Feasibility factor (land cover, proximity). |
| $C$ | Land Availability (Constraint Layer) | N/A | Isolates suitable, currently unused wasteland for BGI deployment. |

## Methodology & Technical Implementation

The project utilized Remote Sensing and Geospatial Analysis techniques for layer generation:

1.  **Layer 1: UHI Intensity ($L_1$)**: Land Surface Temperature (LST) data was acquired via **Google Earth Engine (GEE)** to calculate UHII by subtracting the average LST of the peri-urban reference area.
2.  **Layer 2: Heat Vulnerability Index ($L_2$)**: Computed as a weighted average of normalized socio-economic indicators, including Population Density and Poverty Percentage.
3.  **Layer 3: BGI Cooling Potential ($L_3$)**: Calculated from the average of classified **NDVI score**, **Impervious score**, and **Distance from Lake score**.
4.  **Constraint Layer ($C$)**: The Land Use Land Cover (LULC) map was obtained via Web Map Service (WMS) on **QGIS** from **BHUVAN**. Unused wasteland classes were extracted and a **binary mask** was applied to isolate suitable areas.

## Technologies Used

* **Geospatial Processing:** Google Earth Engine (GEE)
* **GIS Software:** QGIS
* **Data Sources:** Satellite Imagery (LST, NDVI), BHUVAN LULC, Ward-wise Socio-Economic Data

