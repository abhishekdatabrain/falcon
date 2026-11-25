# Flutter Team Integration Guide: Live Driver Tracking & Google Maps

**Service**: Falcon Fresh E-Commerce Backend  
**Base URL**: `https://api.saqrcart.com/api/v1` (Local: `http://localhost:5001/api/v1`)  
**WebSocket URL**: `wss://api.saqrcart.com` (Local: `ws://localhost:5001`)  
**Version**: 1.1.0  
**Target Clients**: Falcon Driver App (Flutter) & Falcon Customer App (Flutter)

---

## 1. Authentication & Headers

All APIs require standard JWT Bearer authentication. When authenticating from Flutter, pass the token in the `Authorization` header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

---

## 2. Driver Telemetry Update API (Driver App)

Drivers emit live GPS snapshots while actively delivering orders.

* **Endpoint**: `POST /api/v1/drivers/location`
* **Alternative Alias**: `POST /api/v1/drivers/gps-location`
* **Access**: Authenticated `DRIVER` role only

### 2.1 Request Payload

```json
{
  "driver_id": "9a23a377-2380-4492-9c21-2e12d817c2c2",
  "order_id": "b3e0c055-6b2a-4db3-8f0a-7bb1de4d6e91",
  "latitude": 21.422487,
  "longitude": 39.826206,
  "accuracy": 4.5,
  "heading": 85.0,
  "speed": 12.4,
  "timestamp": "2026-11-24T22:25:00.000Z"
}
```

#### Field Specifications:
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `driver_id` | String (UUID) | Optional | Driver ID. Must match authenticated user if provided. |
| `order_id` | String (UUID) | Optional | Order currently being delivered. |
| `latitude` | Double | **Yes** | WGS84 GPS latitude (-90 to +90). |
| `longitude` | Double | **Yes** | WGS84 GPS longitude (-180 to +180). |
| `accuracy` | Double | Optional | GPS horizontal accuracy in meters (recommended < 15m). |
| `heading` | Double | Optional | Heading/bearing in degrees (0.0 to 360.0). |
| `speed` | Double | Optional | Current speed in meters/second or km/h. |
| `timestamp`| String (ISO) | Optional | UTC timestamp from device GPS clock. |

### 2.2 Response (`200 OK`)

```json
{
  "success": true,
  "message": "Driver live location updated successfully",
  "data": {
    "locationLog": {
      "id": "c1f72a91-4567-4e12-89ab-0123456789ab",
      "order_id": "b3e0c055-6b2a-4db3-8f0a-7bb1de4d6e91",
      "driver_id": "9a23a377-2380-4492-9c21-2e12d817c2c2",
      "latitude": 21.422487,
      "longitude": 39.826206,
      "speed": 12.4,
      "heading": 85.0,
      "accuracy": 4.5,
      "eta_minutes": 14,
      "distance_km": 4.8,
      "distance_text": "4.8 km",
      "duration_seconds": 840,
      "polyline": "m`~eF_v~pE...",
      "timestamp": "2026-11-24T22:25:00.000Z",
      "is_active_delivery": true
    }
  }
}
```

### 2.3 Flutter Driver Telemetry Recommendation
* **Frequency**: Emit every **3 to 5 seconds** when moving (`speed > 1.5 m/s`).
* **Distance Filter**: Omit sending if moved `< 5 meters` while idle to preserve battery.

---

## 3. Customer Live Driver Tracking API (Customer App)

Called on initial screen load of the **Order Live Tracking** screen.

* **Endpoint**: `GET /api/v1/orders/:orderId/live-tracking`
* **Alternative Alias**: `GET /api/v1/orders/:orderId/driver-location`
* **Access**: Authenticated `CUSTOMER` (only order owner) or `ADMIN`

### 3.1 Response When Out for Delivery (`200 OK`)

```json
{
  "success": true,
  "message": "Live driver tracking retrieved successfully",
  "data": {
    "tracking": {
      "order_id": "b3e0c055-6b2a-4db3-8f0a-7bb1de4d6e91",
      "order_number": "ORD-20261124-0012",
      "order_status": "OUT_FOR_DELIVERY",
      "can_track_driver": true,
      "tracking_message": null,
      "destination": {
        "full_name": "Ahmed Al-Harbi",
        "address_line": "Al Naseem District, Building 4",
        "city": "Makkah",
        "area": "Al Naseem",
        "postal_code": "24242",
        "latitude": 21.413333,
        "longitude": 39.893333
      },
      "driver": {
        "id": "9a23a377-2380-4492-9c21-2e12d817c2c2",
        "name": "Ibrahim Driver",
        "phone": "+966500000002",
        "vehicle_type": "Motorcycle",
        "vehicle_number": "KSA 4589",
        "profile_image": "/uploads/drivers/ibrahim.png",
        "rating": 4.9
      },
      "live_location": {
        "latitude": 21.422487,
        "longitude": 39.826206,
        "heading": 85.0,
        "speed": 12.4,
        "accuracy": 4.5,
        "updated_at": "2026-11-24T22:25:00.000Z"
      },
      "route_info": {
        "eta_minutes": 14,
        "distance_meters": 4820,
        "distance_km": 4.8,
        "distance_text": "4.8 km",
        "duration_seconds": 840,
        "polyline": "m`~eF_v~pE..."
      }
    }
  }
}
```

### 3.2 Response When Not Yet Out for Delivery (`can_track_driver: false`)

If the order is still `CONFIRMED`, `PROCESSING`, or `PACKED`, driver coordinates are masked:

```json
{
  "success": true,
  "message": "Live driver tracking retrieved successfully",
  "data": {
    "tracking": {
      "order_id": "b3e0c055-6b2a-4db3-8f0a-7bb1de4d6e91",
      "order_number": "ORD-20261124-0012",
      "order_status": "PROCESSING",
      "can_track_driver": false,
      "tracking_message": "Live driver tracking will be available once your order is out for delivery.",
      "destination": {
        "full_name": "Ahmed Al-Harbi",
        "latitude": 21.413333,
        "longitude": 39.893333
      },
      "driver": null,
      "live_location": null,
      "route_info": null
    }
  }
}
```

---

## 4. Real-Time Socket.IO Integration (Flutter)

Use the official `socket_io_client: ^3.0.2` package in Flutter.

### 4.1 Connection Setup & Room Joining

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class LiveTrackingService {
  late IO.Socket socket;

  void connect(String token, String orderId) {
    socket = IO.io('https://api.saqrcart.com', IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .setAuth({'token': token}) // Bearer JWT token
      .build());

    socket.connect();

    socket.onConnect((_) {
      print('Socket connected: ${socket.id}');
      // Join the specific order tracking room
      socket.emit('join_order_room', {'orderId': orderId});
    });

    // Listen for live driver movement updates
    socket.on('driver_location_update', (data) {
      _handleLocationUpdate(data);
    });

    socket.on('disconnect', (_) => print('Socket disconnected'));
  }

  void _handleLocationUpdate(dynamic data) {
    final double lat = (data['latitude'] as num).toDouble();
    final double lng = (data['longitude'] as num).toDouble();
    final double heading = ((data['heading'] ?? 0) as num).toDouble();
    final int? etaMinutes = data['eta_minutes'];
    final String? distanceText = data['distance_text'];
    final String? polyline = data['polyline'];

    // Update your Map Controller, animate marker, update ETA badge
  }

  void dispose(String orderId) {
    socket.emit('leave_order_room', {'orderId': orderId});
    socket.disconnect();
  }
}
```

---

## 5. Google Maps in Flutter: Best Practices

1. **Polyline Rendering**:
   When `route_info.polyline` is received, decode it using `flutter_polyline_points` and assign it to `GoogleMap.polylines`.
2. **Smooth Marker Animation**:
   Animate the marker position over ~1.5 seconds between coordinates using `Tween<LatLng>` to ensure buttery smooth movement without jumping.
3. **Marker Rotation (Heading)**:
   Set `Marker(rotation: heading)` so the delivery vehicle points in the actual direction of travel.
