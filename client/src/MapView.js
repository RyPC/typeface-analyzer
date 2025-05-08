import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Box } from "@chakra-ui/react";
import orangeCountyData from "./data/orange_county.geojson";

// Replace with your Mapbox access token
mapboxgl.accessToken =
    "pk.eyJ1IjoicnlwYyIsImEiOiJjbWFmNms0eGgwMmVpMmlweWllcTdiMnNkIn0.cu50O9h4v_znUop-pSXOqQ";

export default function MapView({
    data,
    feature,
    subFeature,
    view,
    processedData,
}) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapData, setMapData] = useState(null);
    const [geoJsonData, setGeoJsonData] = useState(null);
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
        fetch(orangeCountyData)
            .then((response) => response.json())
            .then((data) => {
                console.log("Loaded GeoJSON:", data);
                setGeoJsonData(data);
            })
            .catch((error) => console.error("Error loading GeoJSON:", error));
    }, []);

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
        if (!map.current || !data || !geoJsonData) {
            console.log("Early return conditions:", {
                hasMap: !!map.current,
                hasData: !!data,
                hasGeoJson: !!geoJsonData,
                view,
            });
            return;
        }

        // If we don't have feature or subFeature yet, use the first available options
        const currentFeature = feature || "typeface";
        const currentSubFeature =
            subFeature || processedData?.typefaceData?.[0]?.typeface;

        if (!currentFeature || !currentSubFeature) {
            console.log("No feature or subfeature selected yet");
            return;
        }

        // Process data for the selected feature
        const processData = () => {
            const cityData = {};

            data.forEach((photo) => {
                const city = photo.municipality;
                if (!cityData[city]) {
                    cityData[city] = {
                        total: 0,
                        selected: 0,
                    };
                }

                photo.substrates.forEach((substrate) => {
                    substrate.typefaces.forEach((tf) => {
                        cityData[city].total++;

                        switch (currentFeature) {
                            case "typeface":
                                if (
                                    tf.typefaceStyle.includes(currentSubFeature)
                                ) {
                                    cityData[city].selected++;
                                }
                                break;
                            case "lettering":
                                if (
                                    tf.letteringOntology.includes(
                                        currentSubFeature
                                    )
                                ) {
                                    cityData[city].selected++;
                                }
                                break;
                            case "message":
                                if (
                                    tf.messageFunction.includes(
                                        currentSubFeature
                                    )
                                ) {
                                    cityData[city].selected++;
                                }
                                break;
                            case "placement":
                                if (substrate.placement === currentSubFeature) {
                                    cityData[city].selected++;
                                }
                                break;
                            case "covid":
                                if (
                                    (currentSubFeature === "COVID-Related" &&
                                        tf.covidRelated) ||
                                    (currentSubFeature === "Non-COVID" &&
                                        !tf.covidRelated)
                                ) {
                                    cityData[city].selected++;
                                }
                                break;
                            default:
                                break;
                        }
                    });
                });
            });

            return cityData;
        };

        const cityData = processData();
        setMapData(cityData);

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
                    const matchingCity = Object.keys(cityData).find(
                        (dataCity) =>
                            normalizeCityName(dataCity) === normalizedGeoName
                    );

                    const cityStats = matchingCity
                        ? cityData[matchingCity]
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
                        },
                    };
                }),
            };

            // Update the source data
            source.setData(updatedData);

            // Update the fill color based on proportion
            map.current.setPaintProperty("county-fill", "fill-color", [
                "case",
                ["==", ["get", "proportion"], 0],
                "#cccccc", // Gray for cities with no data
                [
                    "interpolate",
                    ["linear"],
                    ["get", "proportion"],
                    0,
                    "#f7f7f7",
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
                const matchingCity = Object.keys(cityData).find(
                    (dataCity) =>
                        normalizeCityName(dataCity) === normalizedGeoName
                );

                const cityStats = matchingCity
                    ? cityData[matchingCity]
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
    }, [data, feature, subFeature, geoJsonData, view, processedData]);

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
