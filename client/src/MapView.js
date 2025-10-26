import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Box } from "@chakra-ui/react";
import {
    TYPEFACE_STYLES,
    LETTERING_ONTOLOGIES,
    PLACEMENTS,
    MESSAGE_FUNCTIONS,
} from "./constants";

// Replace with your Mapbox access token
mapboxgl.accessToken =
    "pk.eyJ1IjoicnlwYyIsImEiOiJjbWFmNms0eGgwMmVpMmlweWllcTdiMnNkIn0.cu50O9h4v_znUop-pSXOqQ";

const API_URL = process.env.REACT_APP_API_URL;

// Helper function to get default subFeature based on feature
const getDefaultSubFeature = (feature) => {
    switch (feature) {
        case "typeface":
            return TYPEFACE_STYLES[0];
        case "lettering":
            return LETTERING_ONTOLOGIES[0];
        case "message":
            return MESSAGE_FUNCTIONS[0];
        case "placement":
            return PLACEMENTS[0];
        case "covid":
            return "COVID-Related";
        default:
            return null;
    }
};

export default function MapView({ feature, subFeature, view }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapData, setMapData] = useState(null);
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const popup = useRef(null);

    // Initialize popup
    useEffect(() => {
        if (!popup.current) {
            popup.current = new mapboxgl.Popup({
                offset: 25,
                closeButton: false,
                closeOnClick: false,
            });
        }
    }, []);

    // Load GeoJSON data
    useEffect(() => {
        fetch("/orange_county.geojson")
            .then((response) => response.json())
            .then((data) => {
                setGeoJsonData(data);
            })
            .catch((error) => console.error("Error loading GeoJSON:", error));
    }, []);

    // Fetch map data when feature or subFeature changes
    useEffect(() => {
        const fetchMapData = async () => {
            // If no subFeature is selected, use the default for the current feature
            const currentSubFeature =
                subFeature || getDefaultSubFeature(feature);
            if (!feature || !currentSubFeature) return;

            setIsLoading(true);
            try {
                const url = `${API_URL}/api/map-data?feature=${feature}&subFeature=${currentSubFeature}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setMapData(data);
            } catch (error) {
                console.error("Error fetching map data:", error);
                setMapData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMapData();
    }, [feature, subFeature]);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/light-v11",
            center: [-117.8, 33.7], // Orange County center
            zoom: 9,
        });
    }, []);

    // Add source and layers when GeoJSON is loaded
    useEffect(() => {
        if (!map.current || !geoJsonData) return;

        // Remove existing source and layers if they exist
        if (map.current.getSource("orange-county")) {
            if (map.current.getLayer("county-fill")) {
                map.current.removeLayer("county-fill");
            }
            if (map.current.getLayer("county-outline")) {
                map.current.removeLayer("county-outline");
            }
            if (map.current.getLayer("county-labels")) {
                map.current.removeLayer("county-labels");
            }
            map.current.removeSource("orange-county");
        }

        // Add the Orange County GeoJSON source
        map.current.addSource("orange-county", {
            type: "geojson",
            data: geoJsonData,
        });

        // Add the fill layer
        map.current.addLayer({
            id: "county-fill",
            type: "fill",
            source: "orange-county",
            paint: {
                "fill-color": "#627C85",
                "fill-opacity": 0.7,
            },
        });

        // Add the outline layer
        map.current.addLayer({
            id: "county-outline",
            type: "line",
            source: "orange-county",
            paint: {
                "line-color": "#000",
                "line-width": 1,
            },
        });

        // Add the labels layer
        map.current.addLayer({
            id: "county-labels",
            type: "symbol",
            source: "orange-county",
            layout: {
                "text-field": ["get", "CITY"],
                "text-size": 12,
                "text-anchor": "center",
                "text-allow-overlap": false,
                "text-ignore-placement": false,
            },
            paint: {
                "text-color": "#000000",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1,
                "text-halo-blur": 1,
            },
        });
    }, [geoJsonData]);

    const normalizeCityName = (name) => {
        if (!name) return "";
        return name.trim().toLowerCase();
    };

    useEffect(() => {
        if (!map.current || !mapData || !geoJsonData) {
            console.log("Early return conditions:", {
                hasMap: !!map.current,
                hasData: !!mapData,
                hasGeoJson: !!geoJsonData,
                view,
            });
            return;
        }

        const source = map.current.getSource("orange-county");
        if (source) {
            // Create a new GeoJSON with the data
            const updatedData = {
                type: "FeatureCollection",
                features: geoJsonData.features.map((feature) => {
                    const cityName =
                        feature.properties.CITY ||
                        feature.properties.JURISDICTI;

                    // Try to find a matching city name
                    const normalizedGeoName = normalizeCityName(cityName);
                    const matchingCity = Object.keys(mapData).find(
                        (dataCity) =>
                            normalizeCityName(dataCity) === normalizedGeoName
                    );

                    const cityStats = matchingCity
                        ? mapData[matchingCity]
                        : { total: 0, selected: 0 };
                    const proportion =
                        cityStats.total > 0
                            ? cityStats.selected / cityStats.total
                            : 0;

                    return {
                        ...feature,
                        properties: {
                            ...feature.properties,
                            proportion: proportion,
                            total: cityStats.total,
                        },
                    };
                }),
            };

            // Update the source data
            source.setData(updatedData);

            // Update the fill color based on proportion
            map.current.setPaintProperty("county-fill", "fill-color", [
                "case",
                ["==", ["get", "total"], 0],
                "#cccccc", // Gray for cities with no data collection
                [
                    "interpolate",
                    ["linear"],
                    ["get", "proportion"],
                    0,
                    "#ffffff", // White for cities with data but 0 proportion
                    0.25,
                    "#ffeda0",
                    0.5,
                    "#feb24c",
                    0.75,
                    "#f03b20",
                    1,
                    "#bd0026",
                ],
            ]);

            // Remove existing event listeners
            map.current.off("mousemove", "county-fill");
            map.current.off("mouseleave", "county-fill");

            // Add hover effect to show data
            map.current.on("mousemove", "county-fill", (e) => {
                if (!e.features || !e.features.length) return;

                const cityName =
                    e.features[0].properties.CITY ||
                    e.features[0].properties.JURISDICTI;

                // Find the matching city name in our data
                const normalizedGeoName = normalizeCityName(cityName);
                const matchingCity = Object.keys(mapData).find(
                    (dataCity) =>
                        normalizeCityName(dataCity) === normalizedGeoName
                );

                const cityStats = matchingCity
                    ? mapData[matchingCity]
                    : { total: 0, selected: 0 };
                const proportion =
                    cityStats.total > 0
                        ? cityStats.selected / cityStats.total
                        : 0;

                // Create popup content
                const content = `
                    <div style="padding: 10px;">
                        <h3 style="margin: 0 0 5px 0; font-size: 14px;">${cityName}</h3>
                        <p style="margin: 0; font-size: 12px;">
                            ${Math.round(proportion * 100)}% (${
                    cityStats.selected
                } of ${cityStats.total})
                        </p>
                    </div>
                `;

                // Update popup
                popup.current
                    .setLngLat(e.lngLat)
                    .setHTML(content)
                    .addTo(map.current);
            });

            // Remove popup when mouse leaves the area
            map.current.on("mouseleave", "county-fill", () => {
                if (popup.current) {
                    popup.current.remove();
                }
            });
        }
    }, [mapData, geoJsonData, view]);

    return (
        <Box
            ref={mapContainer}
            w="100%"
            h="100%"
            borderRadius="xl"
            overflow="hidden"
        />
    );
}
