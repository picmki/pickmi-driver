import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Shadows } from '../../theme/colors';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface FreeMapViewProps {
  pickupCoords?: LocationCoords | null;
  dropCoords?: LocationCoords | null;
  pickupLabel?: string;
  dropLabel?: string;
  isOnline?: boolean;
  style?: any;
}

// Default driver mock location: Indiranagar, Bangalore
const DEFAULT_COORDS: LocationCoords = {
  latitude: 12.9784,
  longitude: 77.6408,
};

export const FreeMapView: React.FC<FreeMapViewProps> = ({
  pickupCoords,
  dropCoords,
  pickupLabel = 'Pickup',
  dropLabel = 'Drop',
  isOnline = true,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [driverCoords, setDriverCoords] = useState<LocationCoords>(DEFAULT_COORDS);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc?.coords) {
            setDriverCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      } catch (err) {
        // Safe mock coordinates fallback
      }
    })();
  }, []);

  const centerOnDriver = () => {
    if (webViewRef.current) {
      const script = `
        if (window.map) {
          window.map.flyTo([${driverCoords.latitude}, ${driverCoords.longitude}], 15, { duration: 1.0 });
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const centerOnRoute = () => {
    if (webViewRef.current && pickupCoords && dropCoords) {
      const script = `
        if (window.fitRouteBounds) {
          window.fitRouteBounds();
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // Apple Maps aesthetic Leaflet HTML (100% Free, NO Watermark, NO API Key)
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * {
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
          }
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #F2F2F7;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
          }
          
          /* Apple Maps style pulsing Location Puck */
          .apple-puck-container {
            position: relative;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .apple-puck-halo {
            position: absolute;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            background: ${isOnline ? 'rgba(0, 122, 255, 0.22)' : 'rgba(142, 142, 147, 0.18)'};
            animation: appleRadar 2.2s infinite ease-out;
          }
          .apple-puck-dot {
            width: 26px;
            height: 26px;
            background: ${isOnline ? '#007AFF' : '#8E8E93'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0, 122, 255, 0.45);
            border: 3.5px solid #FFFFFF;
            position: relative;
            z-index: 2;
          }
          .apple-puck-dot svg {
            width: 14px;
            height: 14px;
            fill: #FFFFFF;
          }
          @keyframes appleRadar {
            0% { transform: scale(0.5); opacity: 0.9; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          /* Apple Maps Route Pins */
          .apple-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            padding: 6px 10px;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 14px rgba(0,0,0,0.22);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
          }
          .apple-pin-pickup {
            background-color: #34C759;
          }
          .apple-pin-drop {
            background-color: #FF3B30;
          }
          
          .leaflet-control-attribution {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const driverLat = ${driverCoords.latitude};
          const driverLng = ${driverCoords.longitude};
          const hasPickup = ${Boolean(pickupCoords)};
          const hasDrop = ${Boolean(dropCoords)};
          const pickupLat = ${pickupCoords?.latitude || 0};
          const pickupLng = ${pickupCoords?.longitude || 0};
          const dropLat = ${dropCoords?.latitude || 0};
          const dropLng = ${dropCoords?.longitude || 0};

          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            fadeAnimation: true
          }).setView([driverLat, driverLng], 15);
          window.map = map;

          // Free OpenStreetMap Tile Layer (100% Free, NO API Key, NO Watermark)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(map);

          // Apple Maps style car navigation marker
          const carSvg = '<svg viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>';
          const puckHtml = '<div class="apple-puck-container"><div class="apple-puck-halo"></div><div class="apple-puck-dot">' + carSvg + '</div></div>';
          
          const puckIcon = L.divIcon({
            html: puckHtml,
            className: '',
            iconSize: [48, 48],
            iconAnchor: [24, 24]
          });

          L.marker([driverLat, driverLng], { icon: puckIcon }).addTo(map);

          // Add Pickup & Drop markers if trip is active
          const bounds = [];
          bounds.push([driverLat, driverLng]);

          if (hasPickup) {
            const pickupIcon = L.divIcon({
              html: '<div class="apple-pin apple-pin-pickup">● Pickup</div>',
              className: '',
              iconSize: [80, 32],
              iconAnchor: [40, 16]
            });
            L.marker([pickupLat, pickupLng], { icon: pickupIcon }).addTo(map);
            bounds.push([pickupLat, pickupLng]);
          }

          if (hasDrop) {
            const dropIcon = L.divIcon({
              html: '<div class="apple-pin apple-pin-drop">■ Drop</div>',
              className: '',
              iconSize: [70, 32],
              iconAnchor: [35, 16]
            });
            L.marker([dropLat, dropLng], { icon: dropIcon }).addTo(map);
            bounds.push([dropLat, dropLng]);
          }

          if (hasPickup && hasDrop) {
            L.polyline([
              [pickupLat, pickupLng],
              [driverLat, driverLng],
              [dropLat, dropLng]
            ], {
              color: '#007AFF',
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
          }

          window.fitRouteBounds = function() {
            if (bounds.length > 1) {
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            } else {
              map.setView([driverLat, driverLng], 15);
            }
          };

          if (hasPickup || hasDrop) {
            window.fitRouteBounds();
          }

          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={leafletHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="PickMi Driver Map"
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.map}
          scrollEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}

      {/* Apple style Frosted Glass Floating GPS Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={[styles.floatingButton, Shadows.md]}
          onPress={centerOnDriver}
          activeOpacity={0.7}
          accessibilityLabel="Recenter on location"
        >
          <Ionicons name="navigate" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {pickupCoords && dropCoords && (
          <TouchableOpacity
            style={[styles.floatingButton, Shadows.md, { marginTop: 10 }]}
            onPress={centerOnRoute}
            activeOpacity={0.7}
            accessibilityLabel="Fit entire trip route"
          >
            <Ionicons name="git-branch" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 20,
    zIndex: 10,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
});
