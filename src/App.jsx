import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// =====================================================
// OFFLINE RIDE-HAILING PWA - FRONTEND DEMO
// =====================================================

const DEFAULT_LOCATION = {
  lat: 30.3165,
  lng: 78.0322,
};

const VEHICLES = [
  { name: "Bike", emoji: "🏍️", price: 40 },
  { name: "Auto", emoji: "🛺", price: 70 },
  { name: "Mini Car", emoji: "🚗", price: 100 },
  { name: "Sedan", emoji: "🚘", price: 150 },
];

const STORAGE_KEYS = {
  rides: "offlineRides",
  riderFeedback: "riderFeedback",
  driverFeedback: "driverFeedback",
};

function loadData(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    window.dispatchEvent(
      new CustomEvent("ride-data-updated", { detail: { key } })
    );
  } catch (error) {
    console.error("Could not save data:", error);
  }
}

function createId() {
  return `RIDE-${Date.now().toString().slice(-8)}`;
}

function createOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function getVehicle(name) {
  return VEHICLES.find((vehicle) => vehicle.name === name) || VEHICLES[0];
}

function statusLabel(status) {
  const labels = {
    Requested: "Ride Requested",
    Accepted: "Ride Accepted",
    "Driver Arrived": "Driver Has Arrived",
    "Rider Arrived": "Rider Has Arrived",
    "In Progress": "Ride In Progress",
    Completed: "Ride Completed",
    Cancelled: "Ride Cancelled",
    Rejected: "Ride Rejected",
  };

  return labels[status] || status;
}

function statusColor(status) {
  const colors = {
    Requested: "bg-amber-100 text-amber-800",
    Accepted: "bg-blue-100 text-blue-800",
    "Driver Arrived": "bg-indigo-100 text-indigo-800",
    "Rider Arrived": "bg-purple-100 text-purple-800",
    "In Progress": "bg-green-100 text-green-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Cancelled: "bg-red-100 text-red-800",
    Rejected: "bg-red-100 text-red-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
}

const markerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 12);
    }
  }, [position?.lat, position?.lng, map]);

  return null;
}

function RideMap({ pickup, destination, driverLocation }) {
  const center = driverLocation || destination || pickup || DEFAULT_LOCATION;
  const points = [];

  if (pickup) points.push([pickup.lat, pickup.lng]);
  if (destination) points.push([destination.lat, destination.lng]);

  if (
    driverLocation &&
    (!pickup ||
      pickup.lat !== driverLocation.lat ||
      pickup.lng !== driverLocation.lng)
  ) {
    points.unshift([driverLocation.lat, driverLocation.lng]);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom
        style={{ height: "300px", width: "100%" }}
      >
        <RecenterMap position={center} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={markerIcon} />
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={markerIcon}
          />
        )}

        {driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={markerIcon}
          />
        )}

        {points.length >= 2 && <Polyline positions={points} />}
      </MapContainer>
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
  type = "button",
}) {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold transition ${
        disabled
          ? "cursor-not-allowed bg-gray-300 text-gray-600"
          : `${variants[variant] || variants.primary} cursor-pointer`
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  readOnly = false,
  maxLength,
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        maxLength={maxLength}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusColor(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

// =====================================================
// LOCATION SEARCH USING PHOTON GEOCODING
// =====================================================
// =====================================================
// LOCATION SEARCH USING PHOTON GEOCODING
// =====================================================

async function searchLocation(query, bias = DEFAULT_LOCATION) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    throw new Error("Please enter a location.");
  }

  const coordinateMatch = cleanQuery.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );

  if (coordinateMatch) {
    const lat = Number(coordinateMatch[1]);
    const lng = Number(coordinateMatch[2]);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return {
        coords: { lat, lng },
        label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
    throw new Error("Invalid latitude or longitude.");
  }

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();

  const normalizedQuery = normalize(cleanQuery);

  if (navigator.onLine) {
    const params = new URLSearchParams({
      q: cleanQuery,
      limit: "10",
      lang: "en",
      lat: String(bias?.lat ?? DEFAULT_LOCATION.lat),
      lon: String(bias?.lng ?? DEFAULT_LOCATION.lng),
    });

    let response;

    try {
      response = await fetch(
        `https://photon.komoot.io/api/?${params.toString()}`,
        { signal: AbortSignal.timeout(15000) }
      );
    } catch {
      throw new Error(
        "Location search failed. Check your internet connection and try again."
      );
    }

    if (!response.ok) {
      throw new Error("Location search is temporarily unavailable.");
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    if (!features.length) {
      throw new Error("Location not found. Try adding the city or area name.");
    }

    const scoredFeatures = features
      .map((feature) => {
        const p = feature.properties || {};

        const names = [
          p.name,
          p.street,
          p.locality,
          p.district,
          p.city,
          p.county,
          p.state,
        ]
          .filter(Boolean)
          .map(normalize);

        let score = 0;

        for (const name of names) {
          if (name === normalizedQuery) {
            score = Math.max(score, 100);
          } else if (name.startsWith(normalizedQuery + " ")) {
            score = Math.max(score, 80);
          } else if (name.includes(normalizedQuery)) {
            score = Math.max(score, 60);
          }
        }

        const coords = feature.geometry?.coordinates;
        let distance = Infinity;

        if (
          Array.isArray(coords) &&
          coords.length >= 2 &&
          Number.isFinite(Number(coords[0])) &&
          Number.isFinite(Number(coords[1]))
        ) {
          const lng = Number(coords[0]);
          const lat = Number(coords[1]);

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            distance = Math.hypot(
              lat - Number(bias?.lat ?? DEFAULT_LOCATION.lat),
              (lng - Number(bias?.lng ?? DEFAULT_LOCATION.lng)) *
                Math.cos((lat * Math.PI) / 180)
            );
          }
        }

        return { feature, score, distance };
      })
      .sort((a, b) => b.score - a.score || a.distance - b.distance);

    const selected = scoredFeatures[0]?.feature || features[0];

    if (!selected) {
      throw new Error(
        "No matching place found. Try entering the area and city name together."
      );
    }

    const coordinates = selected.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error("The location service returned invalid coordinates.");
    }

    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    const p = selected.properties || {};

    const label = [
      p.name,
      p.street,
      p.city || p.locality,
      p.state,
      p.country,
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ");

    return {
      coords: { lat, lng },
      label: label || cleanQuery,
    };
  }

 
  // ---- BADI OFFLINE LOCATIONS LIST (Dehradun ke 50+ Areas) ----
  const offlineLocations = [
    // Main Hubs & Markets
    { names: ["dehradun", "dehradun city"], label: "Dehradun City Center", lat: 30.3165, lng: 78.0322 },
    { names: ["clock tower", "ghanta ghar"], label: "Clock Tower, Dehradun", lat: 30.3255, lng: 78.0413 },
    { names: ["paltan bazar", "paltan bazaar"], label: "Paltan Bazaar, Dehradun", lat: 30.3245, lng: 78.0418 },
    { names: ["parade ground"], label: "Parade Ground, Dehradun", lat: 30.3302, lng: 78.0548 },
    { names: ["rajpur road"], label: "Rajpur Road, Dehradun", lat: 30.3350, lng: 78.0500 },
    { names: ["astley hall"], label: "Astley Hall, Dehradun", lat: 30.3275, lng: 78.0450 },
    { names: ["darshan lal chowk"], label: "Darshan Lal Chowk, Dehradun", lat: 30.3235, lng: 78.0425 },
    { names: ["karanpur", "karan pur"], label: "Karanpur, Dehradun", lat: 30.3330, lng: 78.0550 },
    { names: ["dalanwala"], label: "Dalanwala, Dehradun", lat: 30.3220, lng: 78.0550 },

    // Transport Hubs
    { names: ["isbt", "dehradun isbt", "bus stand"], label: "ISBT Dehradun", lat: 30.2868, lng: 78.0451 },
    { names: ["railway station", "dehradun railway station"], label: "Dehradun Railway Station", lat: 30.3256, lng: 78.0434 },
    { names: ["jolly grant airport", "dehradun airport"], label: "Jolly Grant Airport, Dehradun", lat: 30.1897, lng: 78.1800 },
    
    // Major Localities & Residential Areas
    { names: ["prem nagar"], label: "Prem Nagar, Dehradun", lat: 30.3160, lng: 77.9990 },
    { names: ["vasant vihar"], label: "Vasant Vihar, Dehradun", lat: 30.3200, lng: 78.0050 },
    { names: ["ballupur", "ballupur chowk"], label: "Ballupur, Dehradun", lat: 30.3400, lng: 78.0120 },
    { names: ["balliwala", "balliwala chowk"], label: "Balliwala, Dehradun", lat: 30.3250, lng: 78.0100 },
    { names: ["clement town"], label: "Clement Town, Dehradun", lat: 30.2660, lng: 78.0050 },
    { names: ["raipur"], label: "Raipur, Dehradun", lat: 30.3080, lng: 78.0900 },
    { names: ["doiwala"], label: "Doiwala, Dehradun", lat: 30.1650, lng: 78.1200 },
    { names: ["sahastradhara road"], label: "Sahastradhara Road, Dehradun", lat: 30.3450, lng: 78.0750 },
    { names: ["mussoorie diversion", "diversion"], label: "Mussoorie Diversion, Dehradun", lat: 30.3800, lng: 78.0750 },
    { names: ["jakhan"], label: "Jakhan, Dehradun", lat: 30.3650, lng: 78.0680 },
    { names: ["garhi cantt", "cantt"], label: "Garhi Cantt, Dehradun", lat: 30.3550, lng: 78.0280 },
    { names: ["kaulagarh"], label: "Kaulagarh, Dehradun", lat: 30.3480, lng: 78.0150 },
    { names: ["patel nagar"], label: "Patel Nagar, Dehradun", lat: 30.3050, lng: 78.0250 },
    { names: ["niranjanpur", "mandi"], label: "Niranjanpur Mandi, Dehradun", lat: 30.3000, lng: 78.0180 },
    { names: ["majra"], label: "Majra, Dehradun", lat: 30.2900, lng: 78.0150 },
    { names: ["subhash nagar"], label: "Subhash Nagar, Dehradun", lat: 30.2800, lng: 78.0050 },
    { names: ["dharmpur", "dharampur"], label: "Dharampur, Dehradun", lat: 30.3080, lng: 78.0480 },
    { names: ["ajabpur"], label: "Ajabpur Kalan, Dehradun", lat: 30.2950, lng: 78.0450 },
    { names: ["kedarpur"], label: "Kedarpur, Dehradun", lat: 30.2850, lng: 78.0400 },
    { names: ["guchupani"], label: "Guchupani, Dehradun", lat: 30.3700, lng: 78.0150 },

    // Universities & Colleges
    { names: ["graphic era", "graphic era university", "geu", "gehu"], label: "Graphic Era University, Dehradun", lat: 30.2672, lng: 78.0030 },
    { names: ["upes", "upes bidholi"], label: "UPES Bidholi Campus, Dehradun", lat: 30.4160, lng: 77.9670 },
    { names: ["upes kandoli"], label: "UPES Kandoli Campus, Dehradun", lat: 30.4050, lng: 77.9900 },
    { names: ["dit", "dit university"], label: "DIT University, Dehradun", lat: 30.3950, lng: 78.0750 },
    { names: ["bfit"], label: "BFIT Group of Institutions, Dehradun", lat: 30.3450, lng: 77.9650 },
    { names: ["dbit", "dev bhoomi"], label: "Dev Bhoomi Institute, Dehradun", lat: 30.3600, lng: 77.9250 },
    { names: ["law college", "lcd"], label: "Law College Dehradun", lat: 30.3350, lng: 77.9750 },
    { names: ["grd", "grd institute"], label: "GRD Institute, Dehradun", lat: 30.3550, lng: 78.0850 },

    // Malls & Shopping
    { names: ["pacific mall", "pacific mall dehradun"], label: "Pacific Mall, Dehradun", lat: 30.3705, lng: 78.0805 },
    { names: ["crossroads mall", "crossroads"], label: "Crossroads Mall, Dehradun", lat: 30.3230, lng: 78.0530 },
    { names: ["centrum mall"], label: "Centrum Mall, Dehradun", lat: 30.3400, lng: 78.0650 },
    { names: ["times square mall"], label: "Times Square Mall, Dehradun", lat: 30.3150, lng: 78.0550 },

    // Hospitals
    { names: ["synergy hospital", "synergy"], label: "Synergy Hospital, Dehradun", lat: 30.3300, lng: 78.0050 },
    { names: ["max hospital", "max dehradun"], label: "Max Super Speciality Hospital, Dehradun", lat: 30.3850, lng: 78.0850 },
    { names: ["cmi hospital", "cmi"], label: "CMI Hospital, Dehradun", lat: 30.3180, lng: 78.0480 },
    { names: ["doon hospital"], label: "Doon Hospital, Dehradun", lat: 30.3220, lng: 78.0420 },
    { names: ["mahant indiresh hospital", "smi hospital"], label: "Shri Mahant Indiresh Hospital", lat: 30.3000, lng: 78.0200 },

    // Tourist Spots
    { names: ["robbers cave", "guchhupani"], label: "Robber's Cave, Dehradun", lat: 30.3770, lng: 78.0600 },
    { names: ["sahastradhara"], label: "Sahastradhara, Dehradun", lat: 30.3870, lng: 78.1180 },
    { names: ["buddha temple", "mindrolling monastery"], label: "Buddha Temple, Clement Town", lat: 30.2640, lng: 78.0090 },
    { names: ["fri", "forest research institute"], label: "FRI Dehradun", lat: 30.3430, lng: 77.9980 },
    { names: ["tapkeshwar", "tapkeshwar temple"], label: "Tapkeshwar Temple, Dehradun", lat: 30.3520, lng: 78.0120 },
    { names: ["deer park", "malsi deer park"], label: "Malsi Deer Park, Dehradun", lat: 30.3900, lng: 78.0750 },
    { names: ["sahastradhara ropeway"], label: "Sahastradhara Ropeway", lat: 30.3890, lng: 78.1150 }
  ];
  const offlineMatch = offlineLocations.find((place) =>
    place.names.some((name) => normalize(name) === normalizedQuery)
  );

  if (offlineMatch) {
    return {
      coords: { lat: offlineMatch.lat, lng: offlineMatch.lng },
      label: offlineMatch.label,
    };
  }

  const randomOffsetLat = (Math.random() - 0.5) * 0.1;
  const randomOffsetLng = (Math.random() - 0.5) * 0.1;

  return {
    coords: {
      lat: DEFAULT_LOCATION.lat + randomOffsetLat,
      lng: DEFAULT_LOCATION.lng + randomOffsetLng,
    },
    label: cleanQuery,
  };
}

// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  const [screen, setScreen] = useState("role");
  const [role, setRole] = useState("Rider");
  const [page, setPage] = useState("book");
  const [online, setOnline] = useState(navigator.onLine);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [enteredLoginOtp, setEnteredLoginOtp] = useState("");

  const [pickupText, setPickupText] = useState("Dehradun");
  const [destinationText, setDestinationText] = useState("");

  const [pickup, setPickup] = useState(DEFAULT_LOCATION);
  const [destination, setDestination] = useState(null);

  const [pickupResolvedText, setPickupResolvedText] = useState("Dehradun");
  const [destinationResolvedText, setDestinationResolvedText] = useState("");

  const [pickupSearching, setPickupSearching] = useState(false);
  const [destinationSearching, setDestinationSearching] = useState(false);
  const [pickupError, setPickupError] = useState("");
  const [destinationError, setDestinationError] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState("Bike");
  const [rides, setRides] = useState(() => loadData(STORAGE_KEYS.rides, []));
  const [riderRideId, setRiderRideId] = useState("");
  const [acceptedRideId, setAcceptedRideId] = useState("");

  const [driverVehicle, setDriverVehicle] = useState("Bike");
  const [driverExperience, setDriverExperience] = useState("1");
  const [driverVehicleNumber, setDriverVehicleNumber] = useState("");
  const [driverAadhaar, setDriverAadhaar] = useState("");
  const [driverOtpInput, setDriverOtpInput] = useState("");
  const [riderOtpInput, setRiderOtpInput] = useState("");
  const [riderOtpOpen, setRiderOtpOpen] = useState(false);
  const [driverLocation, setDriverLocation] = useState(DEFAULT_LOCATION);

  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackText, setFeedbackText] = useState("");
  const [sosOpen, setSosOpen] = useState(false);
  const [notice, setNotice] = useState("");

  // ONLINE / OFFLINE STATUS

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  // LOAD LOCAL DATA

  useEffect(() => {
    const refreshRides = () => setRides(loadData(STORAGE_KEYS.rides, []));
    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEYS.rides) refreshRides();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("ride-data-updated", refreshRides);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("ride-data-updated", refreshRides);
    };
  }, []);

  // DERIVED DATA

  const currentRide = useMemo(() => {
    if (!riderRideId) return null;
    return rides.find((ride) => ride.id === riderRideId) || null;
  }, [rides, riderRideId]);

  const acceptedRide = useMemo(() => {
    if (!acceptedRideId) return null;
    return rides.find((ride) => ride.id === acceptedRideId) || null;
  }, [rides, acceptedRideId]);

  const driverRequests = useMemo(
    () =>
      rides.filter(
        (ride) => ride.status === "Requested" && ride.vehicle === driverVehicle
      ),
    [rides, driverVehicle]
  );

  const fare = getVehicle(selectedVehicle).price;

  // NOTICE

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  // LOGIN

  function chooseRole(nextRole) {
    setRole(nextRole);
    setScreen("login");
  }

  function startLogin(event) {
    event.preventDefault();

    if (!name.trim()) {
      showNotice("Please enter your name.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      showNotice("Enter a valid 10-digit phone number.");
      return;
    }

    if (role === "Driver") {
      if (!driverVehicleNumber.trim()) {
        showNotice("Enter your vehicle registration number.");
        return;
      }
      if (!/^[0-9]{12}$/.test(driverAadhaar)) {
        showNotice("Enter a valid 12-digit demo Aadhaar number.");
        return;
      }
    }

    const generatedOtp = createOtp();
    setLoginOtp(generatedOtp);
    setEnteredLoginOtp(generatedOtp);
    setScreen("login-otp");
  }

  function verifyLogin(event) {
    event.preventDefault();
    if (enteredLoginOtp !== loginOtp) {
      showNotice("Incorrect login OTP. Please try again.");
      return;
    }
    setScreen("app");
    setPage(role === "Rider" ? "book" : "requests");
    showNotice(`Welcome, ${name}!`);
  }

  function logout() {
    setScreen("role");
    setPage("book");
    setName("");
    setPhone("");
    setLoginOtp("");
    setEnteredLoginOtp("");
    setRiderRideId("");
    setAcceptedRideId("");
    setDriverOtpInput("");
  }

  // LOCATION SEARCH

  async function searchPickupLocation() {
    setPickupSearching(true);
    setPickupError("");
    try {
      const result = await searchLocation(pickupText, pickup);
      setPickup(result.coords);
      setPickupText(result.label);
      setPickupResolvedText(result.label);
      setPickupError("");
    } catch (error) {
      setPickupError(error.message || "Pickup location not found.");
    } finally {
      setPickupSearching(false);
    }
  }

  async function searchDestinationLocation() {
    setDestinationSearching(true);
    setDestinationError("");
    try {
      const result = await searchLocation(destinationText, pickup);
      setDestination(result.coords);
      setDestinationText(result.label);
      setDestinationResolvedText(result.label);
      setDestinationError("");
    } catch (error) {
      setDestinationError(error.message || "Destination location not found.");
    } finally {
      setDestinationSearching(false);
    }
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      showNotice("GPS is not supported by this browser.");
      return;
    }
    showNotice("Getting your current GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const label = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        setPickup(coords);
        setPickupText(label);
        setPickupResolvedText(label);
        setPickupError("");
        showNotice("GPS location captured successfully.");
      },
      (error) => {
        // FIX: अगर GPS फेल हो जाए (परमिशन न होने पर), तो डिफ़ॉल्ट पर अटकने के बजाय एक Mock (नया) लोकेशन बना दे।
        showNotice("Real GPS unavailable. Using mock GPS location for demo.");
        const mockLat = DEFAULT_LOCATION.lat + (Math.random() - 0.5) * 0.01;
        const mockLng = DEFAULT_LOCATION.lng + (Math.random() - 0.5) * 0.01;
        const coords = { lat: mockLat, lng: mockLng };
        const label = `${mockLat.toFixed(6)}, ${mockLng.toFixed(6)}`;
        
        setPickup(coords);
        setPickupText(label);
        setPickupResolvedText(label);
        setPickupError("");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  // RIDE DATA UPDATE

  function updateRide(rideId, updates) {
    const allRides = loadData(STORAGE_KEYS.rides, []);
    const updatedRides = allRides.map((ride) =>
      ride.id === rideId
        ? { ...ride, ...updates, updatedAt: new Date().toISOString() }
        : ride
    );
    saveData(STORAGE_KEYS.rides, updatedRides);
    setRides(updatedRides);
    return updatedRides.find((ride) => ride.id === rideId);
  }

  // CREATE RIDE

  function createRide() {
    if (!name.trim() || !/^[0-9]{10}$/.test(phone)) {
      showNotice("Please log in with a valid 10-digit phone number.");
      return null;
    }
    if (!pickupText.trim() || !destinationText.trim()) {
      showNotice("Please enter both pickup and destination locations.");
      return null;
    }
    if (pickupResolvedText !== pickupText.trim()) {
      showNotice("Search and confirm your pickup location first.");
      return null;
    }
    if (!destination || destinationResolvedText !== destinationText.trim()) {
      showNotice("Search and confirm your destination first.");
      return null;
    }
    if (
      currentRide &&
      [
        "Requested",
        "Accepted",
        "Driver Arrived",
        "Rider Arrived",
        "In Progress",
      ].includes(currentRide.status)
    ) {
      return currentRide;
    }

    const ride = {
      id: createId(),
      riderName: name,
      riderPhone: phone,
      pickupText: pickupText.trim(),
      destinationText: destinationText.trim(),
      pickup: { ...pickup },
      destination: { ...destination },
      vehicle: selectedVehicle,
      fare,
      otp: createOtp(),
      status: "Requested",
      driverName: "",
      driverPhone: "",
      driverVehicle: "",
      driverVehicleNumber: "",
      driverExperience: "",
      driverLocation: null,
      riderArrived: false,
      driverArrived: false,
      rejectionReason: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allRides = loadData(STORAGE_KEYS.rides, []);
    const updatedRides = [ride, ...allRides];
    saveData(STORAGE_KEYS.rides, updatedRides);
    setRides(updatedRides);
    setRiderRideId(ride.id);
    setPage("tracking");
    return ride;
  }

  function bookRide() {
    const ride = createRide();
    if (!ride) return;
    setPage("tracking");
    showNotice("Ride request saved on this device.");
  }

  // --- NEW SMS SIMULATION FUNCTIONS ---

 // --- NEW SMS SIMULATION FUNCTIONS ---

  function simulateIncomingSMSResponse() {
    
    const vehicleType = typeof selectedVehicle !== 'undefined' ? selectedVehicle : "Bike";

    const dummyDriver = {
      name: "Rajesh Kumar",
      phone: "9876543210",
      vehicleNo: "UK07AB1234",
      vehicle: vehicleType
    };

    alert(
      "📩 NEW SMS RECEIVED FROM DISPATCH\n\n" +
      "✅ RIDE ACCEPTED\n" +
      `Driver: ${dummyDriver.name}\n` +
      `Phone: ${dummyDriver.phone}\n` +
      `Vehicle: ${dummyDriver.vehicle}\n` +
      `Plate No: ${dummyDriver.vehicleNo}\n\n` +
      "Driver is arriving at your coordinates."
    );
  }
  // --- UPDATED SMS FUNCTION (WITH OTP) ---
  function sendRideSMS() {
    let ride = currentRide;

    // Agar ride abhi book nahi hui hai, toh pehle create karein taaki OTP generate ho
    if (!ride) {
      ride = createRide();
      // Agar location waghera fill nahi hai, toh wahi ruk jayega
      if (!ride) return; 
    }

    const message = [
      "OFFLINE RIDE REQUEST",
      `Ride ID: ${ride.id}`,
      `Rider: ${ride.riderName}`,
      `Rider Phone: ${ride.riderPhone}`,
      `Pickup: ${ride.pickupText}`,
      `Pickup Coordinates: ${ride.pickup.lat.toFixed(5)}, ${ride.pickup.lng.toFixed(5)}`,
      `Destination: ${ride.destinationText}`,
      `Destination Coordinates: ${ride.destination.lat.toFixed(5)}, ${ride.destination.lng.toFixed(5)}`,
      `Vehicle: ${ride.vehicle}`,
      `Fare: Rs. ${ride.fare}`,
      `Ride OTP: ${ride.otp}`, // <-- Yahan OTP add kar diya gaya hai!
      "",
      "Please contact the rider to confirm this request."
    ].join("\n");

    // SMS app open karega
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    
    // Demo popup
    showNotice("SMS request initiated. Waiting for dispatch response...");
    setTimeout(() => {
      simulateIncomingSMSResponse();
    }, 6000);
  }
  // DRIVER ACCEPT / REJECT

  function acceptRide(ride) {
    if (!online) {
      showNotice(
        "Accepting rides requires a shared connection. SMS can be used to contact the rider."
      );
      return;
    }
    if (ride.vehicle !== driverVehicle) {
      showNotice("This request is for a different vehicle.");
      return;
    }
    if (ride.status !== "Requested") {
      showNotice("This ride is no longer available.");
      return;
    }

    const updated = updateRide(ride.id, {
      status: "Accepted",
      driverName: name,
      driverPhone: phone,
      driverVehicle,
      driverVehicleNumber,
      driverExperience,
      driverLocation: { ...driverLocation },
      acceptedAt: new Date().toISOString(),
    });

    if (updated) {
      setAcceptedRideId(ride.id);
      setDriverOtpInput("");
      setPage("driver-ride");
      showNotice("Ride accepted in this browser's local demo.");
    }
  }

  function rejectRide(ride) {
    if (!online) {
      showNotice("Rejecting a shared ride requires a connection.");
      return;
    }
    const reason =
      window.prompt(
        "Enter the reason for rejecting this ride (optional):",
        "Unavailable"
      ) || "Driver unavailable";
    updateRide(ride.id, {
      status: "Rejected",
      rejectedBy: name,
      rejectionReason: reason,
    });
    showNotice("Ride marked as rejected.");
  }

  // ARRIVAL BUTTONS

  function driverHasArrived(ride) {
    if (!ride || ride.status !== "Accepted") {
      showNotice("Accept the ride first.");
      return;
    }
    updateRide(ride.id, {
      status: "Driver Arrived",
      driverArrived: true,
      driverArrivedAt: new Date().toISOString(),
      driverLocation: { ...ride.pickup },
    });
    showNotice("Driver arrival marked.");
  }

  // ---- FIX: Button logic free for rider demo ----
  function riderHasArrived(ride) {
    if (!ride) return;
    setRiderOtpInput("");
    setRiderOtpOpen(true);
  }

  // ---- FIX: Start tracking directly ----
  function verifyRiderOtp(ride) {
    if (!ride) return;
    if (riderOtpInput.trim() !== String(ride.otp)) {
      showNotice("Incorrect ride OTP. Please try again.");
      return;
    }

    updateRide(ride.id, {
      status: "In Progress",
      riderArrived: true,
      driverLocation: { ...ride.pickup },
      rideStartedAt: new Date().toISOString(),
    });

    startRideTracking(ride);
    setRiderOtpInput("");
    setRiderOtpOpen(false);
    showNotice("OTP verified. Ride tracking started!");
  }

  function startRideTracking(ride) {
    if (!ride?.pickup || !ride?.destination) return;
    const steps = 30;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const driverLocation = {
        lat:
          ride.pickup.lat +
          (ride.destination.lat - ride.pickup.lat) * progress,
        lng:
          ride.pickup.lng +
          (ride.destination.lng - ride.pickup.lng) * progress,
      };
      updateRide(ride.id, { driverLocation });
      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 1000);
  }

  // OTP VERIFICATION (DRIVER SIDE)

  function verifyRideOtp(ride) {
    if (!ride) return;
    if (!ride.driverArrived) {
      showNotice("Please confirm driver arrival first.");
      return;
    }
    if (driverOtpInput.trim() !== String(ride.otp)) {
      showNotice("Incorrect ride OTP. Please try again.");
      return;
    }

    updateRide(ride.id, {
      status: "In Progress",
      riderArrived: true,
      rideStartedAt: new Date().toISOString(),
    });

    startRideTracking(ride);
    setDriverOtpInput("");
    showNotice("OTP verified. Ride started!");
  }

  // DRIVER LOCATION / TRIP

  function moveDriverLocation(ride) {
    if (!ride?.destination || !ride?.pickup) {
      showNotice("Ride coordinates are unavailable.");
      return;
    }
    const current = ride.driverLocation || ride.pickup;
    const next = {
      lat: current.lat + (ride.destination.lat - current.lat) * 0.25,
      lng: current.lng + (ride.destination.lng - current.lng) * 0.25,
    };
    setDriverLocation(next);
    updateRide(ride.id, { driverLocation: next });
    showNotice("Demo driver location updated.");
  }

  function finishRide(ride) {
    if (!ride || ride.status !== "In Progress") {
      showNotice("Start the ride before completing it.");
      return;
    }
    updateRide(ride.id, {
      status: "Completed",
      completedAt: new Date().toISOString(),
    });
    setAcceptedRideId("");
    setPage("driver-feedback");
    showNotice("Ride completed.");
  }

  // ---- FIX: Ride completed handler goes to feedback ----
  function riderFinishRide(ride) {
    if (!ride || ride.status !== "In Progress") {
      showNotice("Ride must be in progress to complete.");
      return;
    }
    updateRide(ride.id, {
      status: "Completed",
      completedAt: new Date().toISOString(),
    });
    setPage("rider-feedback");
    showNotice("Ride completed. Please submit feedback.");
  }

  function cancelRide(ride) {
    if (!ride) return;
    if (["Completed", "Cancelled", "Rejected"].includes(ride.status)) {
      showNotice("This ride cannot be cancelled now.");
      return;
    }
    updateRide(ride.id, {
      status: "Cancelled",
      cancelledBy: role,
      cancelledAt: new Date().toISOString(),
    });
    setAcceptedRideId("");
    showNotice("Ride cancelled.");
  }

  // SOS

  function triggerSOS() {
    setSosOpen(true);
  }

  function confirmSOS() {
    setSosOpen(false);
    const ride = currentRide;
    const sosRecord = {
      id: `SOS-${Date.now()}`,
      riderName: name,
      riderPhone: phone,
      rideId: ride?.id || "",
      pickup: ride?.pickup || pickup,
      timestamp: new Date().toISOString(),
      status: "SOS demo triggered",
    };
    const allAlerts = loadData("rideSOSAlerts", []);
    saveData("rideSOSAlerts", [sosRecord, ...allAlerts]);
    alert(
      "SOS demo alert recorded on this device.\n\nNo emergency service has been contacted. A real deployment needs an emergency communication service."
    );
  }

  // FEEDBACK

  function saveFeedback() {
    if (!feedbackText.trim()) {
      showNotice("Please enter your feedback.");
      return;
    }
    const feedback = {
      id: `FB-${Date.now()}`,
      rideId: currentRide?.id || acceptedRide?.id || "",
      name,
      phone,
      role,
      rating: Number(feedbackRating),
      message: feedbackText.trim(),
      createdAt: new Date().toISOString(),
    };
    const key =
      role === "Rider"
        ? STORAGE_KEYS.riderFeedback
        : STORAGE_KEYS.driverFeedback;
    const existing = loadData(key, []);
    saveData(key, [feedback, ...existing]);
    setFeedbackText("");
    setFeedbackRating("5");
    showNotice("Feedback saved on this device.");
  }

  const riderFeedbackList = loadData(STORAGE_KEYS.riderFeedback, []);
  const driverFeedbackList = loadData(STORAGE_KEYS.driverFeedback, []);

  // NAVIGATION

  function navigate(nextPage) {
    setPage(nextPage);
  }

  function openNavigation(ride) {
    if (!ride?.destination) {
      showNotice("Destination coordinates are unavailable.");
      return;
    }
    const { lat, lng } = ride.destination;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ROLE SELECTION

  if (screen === "role") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-800 to-slate-900 p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-4xl">
              🚕
            </div>
            <h1 className="text-3xl font-black text-gray-900">
              Ride<span className="text-indigo-600">Offline</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Offline Ride-Hailing PWA & Cellular Dispatch System
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => chooseRole("Rider")}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-indigo-100 p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
            >
              <span className="text-4xl">🧍</span>
              <span>
                <span className="block font-bold text-gray-900">
                  Continue as Rider
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Book and track a ride
                </span>
              </span>
            </button>

            <button
              onClick={() => chooseRole("Driver")}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
            >
              <span className="text-4xl">🚗</span>
              <span>
                <span className="block font-bold text-gray-900">
                  Continue as Driver
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  View and manage ride requests
                </span>
              </span>
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            Frontend demo: login OTP, rides and feedback are stored locally.
            SMS and cross-device synchronization need additional services.
          </div>
        </div>
      </div>
    );
  }

  // LOGIN

  if (screen === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-5">
        <form
          onSubmit={startLogin}
          className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setScreen("role")}
            className="text-sm font-semibold text-indigo-600"
          >
            ← Back
          </button>

          <div>
            <h1 className="text-2xl font-black text-gray-900">{role} Login</h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your details to continue.
            </p>
          </div>

          <Field
            label="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            required
          />

          <Field
            label="Phone Number"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit mobile number"
            type="tel"
            maxLength={10}
            required
          />

          {phone.length > 0 && phone.length < 10 && (
            <p className="text-sm text-red-600">
              Please enter all 10 digits of your phone number.
            </p>
          )}

          {role === "Driver" && (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Vehicle Type
                </span>
                <select
                  value={driverVehicle}
                  onChange={(event) => setDriverVehicle(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                >
                  {VEHICLES.map((vehicle) => (
                    <option key={vehicle.name} value={vehicle.name}>
                      {vehicle.emoji} {vehicle.name}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Vehicle Registration Number"
                value={driverVehicleNumber}
                onChange={(event) => setDriverVehicleNumber(event.target.value.toUpperCase())}
                placeholder="e.g. UK07AB1234"
                required
              />

              <Field
                label="Aadhaar Number (Demo Only)"
                value={driverAadhaar}
                onChange={(event) =>
                  setDriverAadhaar(event.target.value.replace(/\D/g, "").slice(0, 12))
                }
                placeholder="Enter 12-digit demo number"
                required
              />

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Driving Experience
                </span>
                <select
                  value={driverExperience}
                  onChange={(event) => setDriverExperience(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                >
                  <option value="0">Less than 1 year</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </label>
            </>
          )}

          <Button type="submit" className="w-full">
            Generate Demo OTP
          </Button>

          <p className="text-xs leading-5 text-gray-500">
            Demo only: this generates an OTP inside the app. It does not send
            an SMS to your phone.
          </p>
        </form>
      </div>
    );
  }

  // LOGIN OTP

  if (screen === "login-otp") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-5">
        <form
          onSubmit={verifyLogin}
          className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-xl"
        >
          <h1 className="text-2xl font-black text-gray-900">Verify Demo OTP</h1>

          <p className="text-sm leading-6 text-gray-500">
            Your demo login OTP is displayed below and automatically entered
            into the input field.
          </p>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-700">
              Your Demo Login OTP
            </p>
            <p className="mt-2 text-3xl font-black tracking-widest text-indigo-900">
              {loginOtp}
            </p>
            <p className="mt-2 text-xs text-indigo-700">
              Demo OTP only. No SMS has been sent.
            </p>
          </div>

          <Field
            label="Login OTP"
            value={enteredLoginOtp}
            onChange={(event) =>
              setEnteredLoginOtp(
                event.target.value.replace(/\D/g, "").slice(0, 4)
              )
            }
            placeholder="Enter 4-digit OTP"
            maxLength={4}
            required
          />

          <Button type="submit" className="w-full">
            Verify & Continue
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setScreen("login")}
          >
            Back to Login
          </Button>
        </form>
      </div>
    );
  }

  // MAIN APP

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <button
            onClick={() => navigate(role === "Rider" ? "book" : "requests")}
            className="text-left"
          >
            <div className="text-lg font-black text-indigo-700">
              🚕 RideOffline
            </div>
            <div className="text-xs text-gray-500">Offline Ride-Hailing PWA</div>
          </button>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-2 text-xs font-bold ${
                online
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {online ? "● Online" : "● Offline"}
            </span>

            <button
              onClick={logout}
              className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold hover:bg-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="fixed left-1/2 top-20 z-[100] w-[90%] max-w-lg -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl">
          {notice}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Logged in as {role}
            </p>
            <h1 className="mt-1 text-xl font-black">Hello, {name} 👋</h1>
            <p className="mt-1 text-sm text-gray-500">Phone: {phone}</p>
          </div>

          {role === "Driver" && (
            <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm">
              <div className="font-bold text-indigo-900">{driverVehicle} Driver</div>
              <div className="mt-1 text-xs text-indigo-700">
                Vehicle: {driverVehicleNumber}
              </div>
            </div>
          )}
        </div>

        {role === "Rider" && (
          <nav className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={page === "book" ? "primary" : "secondary"}
              onClick={() => navigate("book")}
            >
              Book Ride
            </Button>
            <Button
              variant={page === "tracking" ? "primary" : "secondary"}
              onClick={() => navigate("tracking")}
            >
              Ride Tracking
            </Button>
            <Button
              variant={page === "rider-feedback" ? "primary" : "secondary"}
              onClick={() => navigate("rider-feedback")}
            >
              Feedback
            </Button>
          </nav>
        )}

        {role === "Driver" && (
          <nav className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={page === "requests" ? "primary" : "secondary"}
              onClick={() => navigate("requests")}
            >
              Ride Requests
            </Button>
            <Button
              variant={page === "driver-ride" ? "primary" : "secondary"}
              onClick={() => navigate("driver-ride")}
            >
              My Current Ride
            </Button>
            <Button
              variant={page === "driver-feedback" ? "primary" : "secondary"}
              onClick={() => navigate("driver-feedback")}
            >
              Feedback
            </Button>
          </nav>
        )}

        {/* RIDER BOOKING */}

        {role === "Rider" && page === "book" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="Book Your Ride"
                subtitle="Enter pickup and destination details."
              />

              <div className="space-y-5">
                <Field
                  label="Pickup Location"
                  value={pickupText}
                  onChange={(event) => {
                    setPickupText(event.target.value);
                    setPickupResolvedText("");
                    setPickupError("");
                  }}
                  placeholder="Enter pickup location"
                  required
                />

                <Button
                  onClick={searchPickupLocation}
                  disabled={false}
                  className="w-full"
                >
                  {pickupSearching
                    ? "Searching Pickup..."
                    : "🔎 Search Pickup Location"}
                </Button>

                {pickupError && (
                  <p role="alert" className="text-sm text-red-600">
                    {pickupError}
                  </p>
                )}

                <Button
                  variant="secondary"
                  onClick={getCurrentLocation}
                  className="w-full"
                >
                  📍 Use My Current Location
                </Button>

                {pickup && (
                  <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                    <div className="font-bold">Pickup Coordinates</div>
                    <div className="mt-1 break-all">
                      {pickup.lat.toFixed(6)}, {pickup.lng.toFixed(6)}
                    </div>
                    <p className="mt-2 font-semibold">
                      {pickupResolvedText === pickupText.trim()
                        ? "✓ Pickup location confirmed"
                        : "Search the edited pickup before booking"}
                    </p>
                  </div>
                )}

                <Field
                  label="Destination"
                  value={destinationText}
                  onChange={(event) => {
                    setDestinationText(event.target.value);
                    setDestinationResolvedText("");
                    setDestination(null);
                    setDestinationError("");
                  }}
                  placeholder="Offline: latitude, longitude"
                  required
                />

                <Button
                  onClick={searchDestinationLocation}
                  disabled={destinationSearching}
                  className="w-full"
                >
                  {destinationSearching
                    ? "Searching Destination..."
                    : "🔎 Search Destination"}
                </Button>

                {destinationError && (
                  <p role="alert" className="text-sm text-red-600">
                    {destinationError}
                  </p>
                )}

                {destination && (
                  <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                    <div className="font-bold">Destination Coordinates</div>
                    <div className="mt-1 break-all">
                      {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                    </div>
                    <p className="mt-2 font-semibold">
                      ✓ Destination location confirmed
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-sm font-bold text-gray-800">
                    Select Vehicle
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {VEHICLES.map((vehicle) => (
                      <button
                        key={vehicle.name}
                        onClick={() => setSelectedVehicle(vehicle.name)}
                        className={`rounded-2xl border-2 p-4 text-left transition ${
                          selectedVehicle === vehicle.name
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <div className="text-3xl">{vehicle.emoji}</div>
                        <div className="mt-2 font-bold">{vehicle.name}</div>
                        <div className="mt-1 text-sm text-gray-500">
                          ₹{vehicle.price} demo fare
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50 p-4">
                  <div className="text-sm text-indigo-800">Estimated demo fare</div>
                  <div className="mt-1 text-3xl font-black text-indigo-900">
                    ₹{fare}
                  </div>
                  <div className="mt-1 text-xs text-indigo-700">
                    Fixed demo fare, not a live distance-based calculation.
                  </div>
                </div>

                <Button
                  onClick={bookRide}
                  className="w-full"
                  disabled={pickupSearching || destinationSearching}
                >
                  🚕 Request Ride
                </Button>

                <Button
                  variant="success"
                  onClick={sendRideSMS}
                  className="w-full"
                  disabled={
                    pickupSearching ||
                    destinationSearching ||
                    pickupResolvedText !== pickupText.trim() ||
                    !destination ||
                    destinationResolvedText !== destinationText.trim()
                  }
                >
                  📩 Request Ride via SMS
                </Button>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <strong>Offline SMS:</strong> This button prepares the ride
                  details and opens the SMS composer on a compatible device.
                  Review the message and tap Send. The app cannot send an SMS
                  silently.
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="Pickup Map"
                subtitle="Markers use the coordinates resolved by location search."
              />

              <RideMap
                pickup={pickup}
                destination={destination}
                driverLocation={null}
              />

              <div className="rounded-xl bg-gray-50 p-4 text-sm">
                <div className="font-bold">Pickup</div>
                <div className="mt-1 break-all text-gray-600">
                  {pickupText || "Not selected"}
                </div>
                <div className="mt-4 font-bold">Destination</div>
                <div className="mt-1 break-all text-gray-600">
                  {destinationText || "Not selected"}
                </div>
              </div>

              <p className="text-xs leading-5 text-gray-500">
                Place search uses the online Photon geocoding service. Map
                tiles use OpenStreetMap. Neither online search nor online map
                tiles are guaranteed to work offline. Offline tiles and offline
                address search are separate features.
              </p>
            </section>
          </div>
        )}

        {/* RIDER TRACKING */}

        {role === "Rider" && page === "tracking" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="Ride Tracking"
                subtitle="Your ride information and arrival status."
              />

              {!currentRide ? (
                <EmptyState message="No active ride found. Book a ride first." />
              ) : (
                <>
                  <div className="rounded-2xl bg-indigo-50 p-5">
                    <div className="text-sm text-indigo-700">Your Ride ID</div>
                    <div className="mt-1 break-all text-xl font-black text-indigo-950">
                      {currentRide.id}
                    </div>
                    <div className="mt-4">
                      <StatusBadge status={currentRide.status} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="text-sm font-semibold text-green-800">
                      Your Ride OTP
                    </div>
                    <div className="mt-1 text-4xl font-black tracking-widest text-green-900">
                      {currentRide.otp}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-green-800">
                      Show this OTP to the driver when both of you have arrived.
                      This is a demo OTP; it has not been sent by SMS.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 p-4">
                    <div>
                      <div className="text-xs font-semibold uppercase text-gray-500">
                        Pickup
                      </div>
                      <div className="mt-1 font-semibold">{currentRide.pickupText}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase text-gray-500">
                        Destination
                      </div>
                      <div className="mt-1 font-semibold">
                        {currentRide.destinationText}
                      </div>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-3">
                      <div>
                        <div className="text-xs text-gray-500">Vehicle</div>
                        <div className="mt-1 font-bold">
                          {getVehicle(currentRide.vehicle).emoji}{" "}
                          {currentRide.vehicle}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Fare</div>
                        <div className="mt-1 font-bold">₹{currentRide.fare}</div>
                      </div>
                    </div>
                  </div>

                  {currentRide.driverName && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <h3 className="font-bold text-blue-950">Your Driver</h3>
                      <div className="mt-3 space-y-2 text-sm text-blue-900">
                        <div><strong>Name:</strong> {currentRide.driverName}</div>
                        <div><strong>Phone:</strong> {currentRide.driverPhone}</div>
                        <div><strong>Vehicle:</strong> {currentRide.driverVehicle}</div>
                        <div><strong>Registration:</strong> {currentRide.driverVehicleNumber}</div>
                        <div><strong>Experience:</strong> {currentRide.driverExperience} year(s)</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 rounded-2xl border border-gray-200 p-4">
                    <h3 className="font-bold">Arrival Confirmation</h3>

                    {/* ---- FIX: BUTTON IS NOW ALWAYS CLICKABLE FOR RIDER DEMO ---- */}
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => riderHasArrived(currentRide)}
                      disabled={currentRide.riderArrived} // Only disabled if already clicked
                    >
                      📍 Rider Has Arrived
                    </Button>
                    
                    {riderOtpOpen && (
                      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                        <h3 className="font-bold text-green-950">
                          Verify Ride OTP
                        </h3>

                        <p className="mt-2 text-sm text-green-800">
                          Enter the 4-digit OTP provided by the driver to start ride tracking.
                        </p>

                        <Field
                          label="Enter Ride OTP"
                          value={riderOtpInput}
                          onChange={(event) =>
                            setRiderOtpInput(
                              event.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="Enter 4-digit OTP"
                          maxLength={4}
                        />

                        <Button
                          variant="success"
                          className="mt-4 w-full"
                          onClick={() => verifyRiderOtp(currentRide)}
                          disabled={riderOtpInput.length !== 4}
                        >
                          Verify OTP & Start Tracking
                        </Button>

                        <Button
                          variant="secondary"
                          className="mt-2 w-full"
                          onClick={() => setRiderOtpOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {currentRide.status === "Rejected" && (
                      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                        <strong>Ride rejected.</strong>
                        <div className="mt-1">
                          Reason: {currentRide.rejectionReason || "Driver unavailable"}
                        </div>
                      </div>
                    )}

                    {currentRide.status === "Cancelled" && (
                      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                        This ride has been cancelled.
                      </div>
                    )}

                    {currentRide.status === "Completed" && (
                      <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                        Your ride has been completed.
                      </div>
                    )}
                  </div>

                  {/* ---- FIX: RIDE COMPLETED BUTTON (OPENS FEEDBACK) ---- */}
                  {currentRide.status === "In Progress" && (
                    <Button
                      variant="success"
                      onClick={() => riderFinishRide(currentRide)}
                      className="w-full mt-3"
                    >
                      🏁 Ride Has Completed
                    </Button>
                  )}

                  <Button variant="success" onClick={sendRideSMS} className="w-full">
                    📩 Send Ride Details by SMS
                  </Button>

                  <Button variant="danger" onClick={triggerSOS} className="w-full">
                    🆘 Emergency SOS
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => openNavigation(currentRide)}
                    className="w-full"
                  >
                    🗺️ Open Destination in Maps
                  </Button>

                  {!["Completed", "Cancelled", "Rejected"].includes(currentRide.status) && (
                    <Button variant="danger" onClick={() => cancelRide(currentRide)} className="w-full">
                      Cancel Ride
                    </Button>
                  )}

                  <Button variant="secondary" onClick={() => navigate("rider-feedback")} className="w-full">
                    Give Feedback
                  </Button>
                </>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle title="Ride Map" subtitle="Pickup, destination and available driver coordinates." />

              {currentRide ? (
                <>
                  <RideMap pickup={currentRide.pickup} destination={currentRide.destination} driverLocation={currentRide.driverLocation} />

                  <div className="rounded-xl bg-gray-50 p-4 text-sm">
                    <div className="font-bold">Current Ride Status</div>
                    <div className="mt-2"><StatusBadge status={currentRide.status} /></div>
                    {currentRide.driverLocation && (
                      <div className="mt-3 break-all text-gray-600">
                        Driver coordinates: {currentRide.driverLocation.lat.toFixed(6)}, {currentRide.driverLocation.lng.toFixed(6)}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState message="Book a ride to view the ride map." />
              )}

              <p className="text-xs leading-5 text-gray-500">
                Live driver GPS updates are not connected to a real driver device in this frontend-only version.
              </p>
            </section>
          </div>
        )}

        {/* DRIVER REQUESTS */}

        {role === "Driver" && page === "requests" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <SectionTitle title="Available Ride Requests" subtitle={`Requests for your selected vehicle: ${driverVehicle}`} />

            {!online && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                You are offline. Existing requests saved on this device can still be viewed, but Accept/Reject is disabled. Riders can use the SMS option to contact a driver without internet.
              </div>
            )}

            {driverRequests.length === 0 ? (
              <EmptyState message="No matching ride requests are available in this browser's local data." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {driverRequests.map((ride) => (
                  <article key={ride.id} className="rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">{ride.id}</div>
                        <div className="mt-1 text-sm text-gray-500">{formatDate(ride.createdAt)}</div>
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div><strong>Rider:</strong> {ride.riderName}</div>
                      <div><strong>Phone:</strong> {ride.riderPhone}</div>
                      <div><strong>Pickup:</strong> {ride.pickupText}</div>
                      <div><strong>Destination:</strong> {ride.destinationText}</div>
                      <div><strong>Vehicle:</strong> {ride.vehicle}</div>
                      <div><strong>Fare:</strong> ₹{ride.fare}</div>
                      <div className="break-all text-xs text-gray-500">Pickup coordinates: {ride.pickup.lat}, {ride.pickup.lng}</div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Button variant="success" onClick={() => acceptRide(ride)} disabled={!online || ride.status !== "Requested"}>
                        Accept
                      </Button>
                      <Button variant="danger" onClick={() => rejectRide(ride)} disabled={!online || ride.status !== "Requested"}>
                        Reject
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-600">
              <strong>Demo limitation:</strong> This request list uses local browser storage. It is not a real dispatch service and cannot deliver requests from a different phone automatically.
            </div>
          </section>
        )}

        {/* DRIVER CURRENT RIDE */}

        {role === "Driver" && page === "driver-ride" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle title="My Current Ride" subtitle="Manage pickup, arrival and OTP verification." />

              {!acceptedRide ? (
                <EmptyState message="No ride selected. Open Ride Requests and accept a request first." />
              ) : (
                <>
                  <div className="rounded-2xl bg-indigo-50 p-5">
                    <div className="text-sm text-indigo-700">Ride ID</div>
                    <div className="mt-1 break-all text-xl font-black text-indigo-950">{acceptedRide.id}</div>
                    <div className="mt-4"><StatusBadge status={acceptedRide.status} /></div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-gray-200 p-4 text-sm">
                    <div><strong>Rider:</strong> {acceptedRide.riderName}</div>
                    <div><strong>Phone:</strong> {acceptedRide.riderPhone}</div>
                    <div><strong>Pickup:</strong> {acceptedRide.pickupText}</div>
                    <div><strong>Destination:</strong> {acceptedRide.destinationText}</div>
                    <div><strong>Vehicle:</strong> {acceptedRide.vehicle}</div>
                    <div><strong>Fare:</strong> ₹{acceptedRide.fare}</div>
                  </div>

                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <h3 className="font-bold text-indigo-950">Pickup Confirmation</h3>
                    <p className="mt-2 text-sm leading-6 text-indigo-800">When you reach the pickup point, press the button below.</p>

                    <Button variant="success" className="mt-4 w-full" onClick={() => driverHasArrived(acceptedRide)} disabled={acceptedRide.status !== "Accepted" || acceptedRide.driverArrived}>
                      📍 Driver Has Arrived
                    </Button>

                    <div className="mt-3 text-sm text-indigo-900">
                      {acceptedRide.driverArrived ? "✅ Driver arrival confirmed." : "Waiting for driver arrival confirmation."}
                    </div>
                    <div className="mt-3 text-sm text-indigo-900">
                      {acceptedRide.riderArrived ? "✅ Rider has also arrived." : "⏳ Waiting for rider arrival confirmation."}
                    </div>
                  </div>

                  {acceptedRide.driverArrived && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                      <h3 className="font-bold text-green-950">
                        Verify Rider OTP
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-green-800">
                        Demo mode: Use the OTP shown below to verify the ride.
                      </p>

                      <div className="mt-4 rounded-xl border border-green-300 bg-white p-4 text-center">
                        <p className="text-sm font-medium text-gray-600">
                          Demo Ride OTP
                        </p>
                        <p className="mt-1 text-3xl font-black tracking-[0.3em] text-green-800">
                          {acceptedRide.otp}
                        </p>
                      </div>

                      <div className="mt-4">
                        <Field
                          label="Enter Ride OTP"
                          value={driverOtpInput}
                          onChange={(event) =>
                            setDriverOtpInput(
                              event.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="Enter 4-digit OTP"
                          maxLength={4}
                        />
                      </div>

                      <Button
                        variant="success"
                        className="mt-4 w-full"
                        onClick={() => verifyRideOtp(acceptedRide)}
                        disabled={
                          driverOtpInput.length !== 4 ||
                          acceptedRide.status === "In Progress" ||
                          acceptedRide.status === "Completed"
                        }
                      >
                        Verify OTP & Start Ride
                      </Button>
                    </div>
                  )}

                  {acceptedRide.status === "In Progress" && (
                    <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                      <h3 className="font-bold text-green-950">Ride in Progress</h3>
                      <p className="text-sm leading-6 text-green-800">Use the demo location button to move the driver marker toward the destination.</p>
                      <Button variant="secondary" className="w-full" onClick={() => moveDriverLocation(acceptedRide)}>
                        📍 Update Demo Driver Location
                      </Button>
                      <Button variant="success" className="w-full" onClick={() => finishRide(acceptedRide)}>
                        Complete Ride
                      </Button>
                    </div>
                  )}

                  {acceptedRide.status === "Completed" && (
                    <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">This ride is completed.</div>
                  )}

                  {acceptedRide.status !== "Completed" && acceptedRide.status !== "Cancelled" && (
                    <Button variant="danger" className="w-full" onClick={() => cancelRide(acceptedRide)}>
                      Cancel Ride
                    </Button>
                  )}

                  <Button variant="secondary" className="w-full" onClick={() => openNavigation(acceptedRide)}>
                    🗺️ Open Destination in Maps
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => navigate("driver-feedback")}>
                    Give Feedback
                  </Button>
                </>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <SectionTitle title="Driver Map" subtitle="Pickup, destination and demo driver location." />

              {acceptedRide ? (
                <>
                  <RideMap pickup={acceptedRide.pickup} destination={acceptedRide.destination} driverLocation={acceptedRide.driverLocation} />
                  <div className="rounded-xl bg-gray-50 p-4 text-sm">
                    <div className="font-bold">Status</div>
                    <div className="mt-2"><StatusBadge status={acceptedRide.status} /></div>
                    <div className="mt-3 text-gray-600">Rider arrival: {acceptedRide.riderArrived ? "Confirmed" : "Pending"}</div>
                    <div className="mt-1 text-gray-600">Driver arrival: {acceptedRide.driverArrived ? "Confirmed" : "Pending"}</div>
                  </div>
                </>
              ) : (
                <EmptyState message="Accept a ride to display the map." />
              )}

              <p className="text-xs leading-5 text-gray-500">
                Map tiles require internet unless an offline tile source is configured. Driver movement here is simulated, not live GPS tracking.
              </p>
            </section>
          </div>
        )}

        {/* RIDER FEEDBACK */}

        {role === "Rider" && page === "rider-feedback" && (
          <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Rider Feedback" subtitle="Share your experience with the ride." />

            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Rating</span>
                <select value={feedbackRating} onChange={(event) => setFeedbackRating(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Average</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Very Poor</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Your Feedback</span>
                <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder="Write your feedback here..." rows={5} className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-indigo-500" />
              </label>

              <Button onClick={saveFeedback} className="w-full">Submit Feedback</Button>
            </div>

            <div className="mt-8">
              <h3 className="mb-3 font-bold">Previously Saved Feedback</h3>

              {riderFeedbackList.length === 0 ? (
                <EmptyState message="No feedback saved yet." />
              ) : (
                <div className="space-y-3">
                  {riderFeedbackList.map((feedback) => (
                    <article key={feedback.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex justify-between gap-3">
                        <strong>{feedback.name}</strong>
                        <span>⭐ {feedback.rating}/5</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{feedback.message}</p>
                      <p className="mt-2 text-xs text-gray-500">{formatDate(feedback.createdAt)}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* DRIVER FEEDBACK */}

        {role === "Driver" && page === "driver-feedback" && (
          <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Driver Feedback" subtitle="Save your feedback about the ride experience." />

            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Rating</span>
                <select value={feedbackRating} onChange={(event) => setFeedbackRating(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3">
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Average</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Very Poor</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Your Feedback</span>
                <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder="Write your feedback here..." rows={5} className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-indigo-500" />
              </label>

              <Button onClick={saveFeedback} className="w-full">Submit Feedback</Button>
            </div>

            <div className="mt-8">
              <h3 className="mb-3 font-bold">Previously Saved Feedback</h3>

              {driverFeedbackList.length === 0 ? (
                <EmptyState message="No feedback saved yet." />
              ) : (
                <div className="space-y-3">
                  {driverFeedbackList.map((feedback) => (
                    <article key={feedback.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex justify-between gap-3">
                        <strong>{feedback.name}</strong>
                        <span>⭐ {feedback.rating}/5</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{feedback.message}</p>
                      <p className="mt-2 text-xs text-gray-500">{formatDate(feedback.createdAt)}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* FOOTER */}

        <footer className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 text-xs leading-6 text-gray-500">
          <strong className="text-gray-700">Offline Ride-Hailing PWA — Frontend Demo</strong>
          <p className="mt-2">
            Ride requests, OTP verification, arrival flags, SOS demo records and
            feedback are stored locally in the browser. This version does not
            connect to a backend, dispatch server, SMS gateway or real emergency
            service.
          </p>
          <p>
            Online maps and place searches require internet. For real
            cross-device ride updates, actual SMS delivery, secure OTP
            verification and live GPS tracking, additional services are needed.
          </p>
        </footer>
      </main>

      {/* SOS MODAL */}

      {sosOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-4xl">
                🆘
              </div>
              <h2 className="mt-4 text-2xl font-black text-gray-900">Emergency SOS</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                This demo records an SOS alert on this device. It does not
                contact police, emergency services or another phone.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setSosOpen(false)}>
                Go Back
              </Button>
              <Button variant="danger" onClick={confirmSOS}>
                Confirm SOS
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}