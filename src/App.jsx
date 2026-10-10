
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209 };

const makeIcon = (type, color) => {
  const icons = {
    pickup: `<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    car: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 2-5h10l2 5"/><path d="M3 11h18v8H3z"/><path d="M3 15h18"/><circle cx="7" cy="19" r="1.5" fill="${color}"/><circle cx="17" cy="19" r="1.5" fill="${color}"/></svg>`,
    person: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>`,
    destination: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="m5 4 14 0-4 4 4 4H5"/></svg>`,
  };

  return L.divIcon({
    html: `<div style="width:42px;height:42px;background:#fff;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px #0002">${icons[type]}</div>`,
    className: "",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const pickupIcon = makeIcon("pickup", "#173B76");
const driverIcon = makeIcon("car", "#173B76");
const passengerIcon = makeIcon("person", "#173B76");
const destinationIcon = makeIcon("destination", "#173B76");

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView([position.lat, position.lng], 15);
  }, [map, position.lat, position.lng]);

  return null;
}

function RideMap({ pickup, destination, driver, rideStarted, tracking }) {
  const center = pickup || DEFAULT_LOCATION;

  return (
    <div className="h-80 w-full overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <RecenterMap position={center} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
        )}

        {destination && pickup && (
          <>
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            />

            {/* Blue line between pickup and destination */}
            <Polyline
              positions={[
                [pickup.lat, pickup.lng],
                [destination.lat, destination.lng],
              ]}
              pathOptions={{
                color: "#2563eb",
                weight: 5,
                opacity: 0.9,
              }}
            />
          </>
        )}

        {driver && !rideStarted && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />
        )}

        {rideStarted && tracking && (
          <Marker
            position={[tracking.lat, tracking.lng]}
            icon={passengerIcon}
          />
        )}
      </MapContainer>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState("");

  const [pickupText, setPickupText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [pickup, setPickup] = useState(DEFAULT_LOCATION);
  const [destination, setDestination] = useState(null);

  const [driver, setDriver] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [rideBooked, setRideBooked] = useState(false);
  const [driverArrived, setDriverArrived] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const [rideFinished, setRideFinished] = useState(false);
  const [rideOtp, setRideOtp] = useState("");
  const [enteredRideOtp, setEnteredRideOtp] = useState("");
  const [status, setStatus] = useState("Book a ride to get started.");
  const [page, setPage] = useState("booking");
  const [locationLoading, setLocationLoading] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onlineHandler = () => setOffline(false);
    const offlineHandler = () => setOffline(true);

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  // Driver moves towards pickup.
  useEffect(() => {
    if (!rideBooked || driverArrived || rideStarted || !driver) return;

    const timer = setInterval(() => {
      setDriver((previous) => {
        if (!previous) return previous;

        const dx = pickup.lat - previous.lat;
        const dy = pickup.lng - previous.lng;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.0007) return pickup;

        return {
          lat: previous.lat + dx * 0.12,
          lng: previous.lng + dy * 0.12,
        };
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [rideBooked, driverArrived, rideStarted, driver, pickup]);

  // Passenger marker moves towards destination.
  useEffect(() => {
    if (!rideStarted || rideFinished || !tracking || !destination) return;

    const timer = setInterval(() => {
      setTracking((previous) => {
        if (!previous) return previous;

        const dx = destination.lat - previous.lat;
        const dy = destination.lng - previous.lng;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.0005) {
          setRideFinished(true);
          setStatus("Ride completed!");
          return destination;
        }

        return {
          lat: previous.lat + dx * 0.08,
          lng: previous.lng + dy * 0.08,
        };
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [rideStarted, rideFinished, tracking, destination]);

  const register = (event) => {
    event.preventDefault();

    if (!name.trim() || !/^\d{10}$/.test(phone)) {
      alert("Enter your name and a valid 10-digit phone number.");
      return;
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedLoginOtp(otp);
    setScreen("otp");
    alert(`Your login code is: ${otp}`);
  };

  const verifyLogin = (event) => {
    event.preventDefault();

    if (loginOtp !== generatedLoginOtp) {
      alert("Incorrect OTP. Try again.");
      return;
    }

    setScreen("app");
  };

  // Get and fill the current GPS location.
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setPickup(coords);
        setPickupText(
          `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        );
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);

        alert(
          error.code === 1
            ? "Location permission denied. Allow location access in your browser."
            : "Could not get your location. Try again or enter pickup manually."
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const bookRide = (event) => {
    event.preventDefault();

    if (!pickupText.trim() || !destinationText.trim()) {
      alert("Enter both pickup and destination.");
      return;
    }

    const destinationPoint = {
      lat: pickup.lat + 0.018,
      lng: pickup.lng + 0.015,
    };

    const startingDriver = {
      lat: pickup.lat + 0.012,
      lng: pickup.lng - 0.012,
    };

    setDestination(destinationPoint);
    setDriver(startingDriver);
    setTracking(pickup);
    setRideBooked(true);
    setDriverArrived(false);
    setRideStarted(false);
    setRideFinished(false);
    setRideOtp("");
    setEnteredRideOtp("");

    setStatus(
      offline
        ? "Ride saved on this device. SMS fallback is available."
        : "Ride requested. Your driver is on the way."
    );

    const savedRide = {
      name,
      phone,
      pickup: pickupText,
      destination: destinationText,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem("offlineRides") || "[]"
      );

      existing.push(savedRide);
      localStorage.setItem("offlineRides", JSON.stringify(existing));
    } catch {
      console.warn("Could not save ride in local storage.");
    }

    setPage("tracking");
  };

  const simulateDriverArrival = () => {
    if (!rideBooked) return;

    setDriver(pickup);
    setDriverArrived(true);

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setRideOtp(otp);
    setStatus("Your driver has arrived. Verify the ride code to start.");
    alert(`Your ride code is: ${otp}`);
  };

  const verifyRideOtp = (event) => {
    event.preventDefault();

    if (!rideOtp || enteredRideOtp !== rideOtp) {
      alert("Incorrect ride code.");
      return;
    }

    setRideStarted(true);
    setTracking(pickup);
    setStatus("Your ride has started.");
  };

  const sendRideSMS = () => {
    const message =
      `Ride request: ${name}; Phone: ${phone}; ` +
      `Pickup: ${pickupText}; Destination: ${destinationText}`;

    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const triggerSOS = () => {
    setSosActive(true);

    alert(
      "SOS selected. No emergency service has been contacted. Call your local emergency number if you need urgent help."
    );
  };

  const saveFeedback = (event) => {
    event.preventDefault();

    const feedback = {
      name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(
        localStorage.getItem("rideFeedback") || "[]"
      );

      existing.push(feedback);
      localStorage.setItem("rideFeedback", JSON.stringify(existing));

      alert("Feedback saved on this device.");
      setComment("");
    } catch {
      alert("Could not save feedback.");
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-black placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  // White buttons for login and OTP screens.
  const whiteButton =
    "w-full rounded-xl bg-white p-3 font-semibold text-[#173B76] shadow-sm transition hover:bg-blue-50 disabled:opacity-60";

  // Navy buttons for actions inside white app cards.
  const appButton =
    "w-full rounded-xl bg-[#173B76] p-3 font-semibold text-white shadow-sm transition hover:bg-[#10284F] disabled:opacity-60";

  const outlineButton =
    "w-full rounded-xl border border-[#173B76] bg-white p-3 font-semibold text-[#173B76] transition hover:bg-blue-50";

  const cardClass = "rounded-2xl bg-white p-5 shadow-sm";

  // Login screen: white outside, navy card.
  if (screen === "register") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <form
          onSubmit={register}
          className="w-full max-w-md space-y-5 rounded-3xl bg-[#10284F] p-8 shadow-2xl ring-1 ring-[#173B76]/10"
        >
          <div className="text-center text-4xl">🚕</div>

          <h1 className="text-center text-2xl font-bold text-white">
            Rider PWA
          </h1>

          <p className="text-center text-sm text-blue-100">
            Your ride, your way.
          </p>

          <label className="block text-sm font-medium text-white">
            Full name
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </label>

          <label className="block text-sm font-medium text-white">
            Phone number
            <input
              className={inputClass}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
              inputMode="numeric"
              required
            />
          </label>

          <button className={whiteButton}>Continue</button>
        </form>
      </main>
    );
  }

  // OTP screen: white outside, navy card.
  if (screen === "otp") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <form
          onSubmit={verifyLogin}
          className="w-full max-w-md space-y-5 rounded-3xl bg-[#10284F] p-8 shadow-2xl ring-1 ring-[#173B76]/10"
        >
          <h1 className="text-2xl font-bold text-white">Verify OTP</h1>

          <p className="text-sm text-blue-100">
            Enter the login code to continue.
          </p>

          <input
            className={inputClass}
            value={loginOtp}
            onChange={(e) => setLoginOtp(e.target.value)}
            placeholder="Enter OTP"
            inputMode="numeric"
            maxLength={4}
            required
          />

          <button className={whiteButton}>Verify and continue</button>

          <button
            type="button"
            onClick={() => setScreen("register")}
            className="w-full rounded-xl border border-white/40 p-3 text-white hover:bg-white/10"
          >
            Back
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="bg-[#10284F] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">🚕 Rider PWA</h1>
            <p className="text-xs text-blue-100">Welcome, {name}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                offline
                  ? "bg-amber-300 text-slate-900"
                  : "bg-white text-[#173B76]"
              }`}
            >
              {offline ? "Offline" : "Online"}
            </span>

            <button
              onClick={() => {
                setScreen("register");
                setLoginOtp("");
                setGeneratedLoginOtp("");
              }}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#173B76] hover:bg-blue-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto bg-white px-4 py-4">
        {[
          ["booking", "Book ride"],
          ["tracking", "Ride tracking"],
          ["feedback", "Feedback"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              page === id
                ? "bg-[#173B76] text-white"
                : "border border-slate-200 bg-white text-[#173B76] hover:bg-blue-50"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="mx-auto grid max-w-6xl gap-5 bg-white px-4 pb-10 lg:grid-cols-2">
        {page === "booking" && (
          <section className={`${cardClass} space-y-5`}>
            <div>
              <h2 className="text-xl font-bold text-[#173B76]">
                Book your ride
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter your pickup and destination.
              </p>
            </div>

            <form onSubmit={bookRide} className="space-y-4">
              <label className="block text-sm font-medium text-slate-800">
                Pickup location

                <div className="mt-1 flex gap-2">
                  <input
                    className={inputClass}
                    value={pickupText}
                    onChange={(e) => setPickupText(e.target.value)}
                    placeholder="Enter pickup or use GPS"
                    required
                  />

                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    title="Use current location"
                    aria-label="Use current location"
                    className="flex min-w-12 items-center justify-center rounded-xl bg-[#173B76] px-3 text-xl text-white hover:bg-[#10284F] disabled:opacity-60"
                  >
                    {locationLoading ? (
                      <span className="text-sm">...</span>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        width="23"
                        height="23"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-800">
                Destination

                <input
                  className={inputClass}
                  value={destinationText}
                  onChange={(e) => setDestinationText(e.target.value)}
                  placeholder="Enter destination"
                  required
                />
              </label>

              <button className={appButton}>Book ride</button>

              <button
                type="button"
                onClick={sendRideSMS}
                className={outlineButton}
              >
                Open SMS fallback
              </button>
            </form>
          </section>
        )}

        {page === "tracking" && (
          <section className={`${cardClass} space-y-4`}>
            <h2 className="text-xl font-bold text-[#173B76]">
              Ride tracking
            </h2>

            <div className="rounded-xl bg-blue-50 p-4 text-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Ride status
              </p>

              <p className="mt-1 font-semibold text-[#173B76]">{status}</p>

              {rideBooked && (
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Pickup: {pickupText}</p>
                  <p>Destination: {destinationText}</p>
                </div>
              )}
            </div>

            <RideMap
              pickup={pickup}
              destination={rideBooked ? destination : null}
              driver={driver}
              rideStarted={rideStarted}
              tracking={tracking}
            />

            {!rideBooked && (
              <p className="text-sm text-slate-500">
                Book a ride first to start tracking.
              </p>
            )}

            {rideBooked && !driverArrived && !rideStarted && (
              <button
                onClick={simulateDriverArrival}
                className={appButton}
              >
                Driver arrived
              </button>
            )}

            {driverArrived && !rideStarted && (
              <form onSubmit={verifyRideOtp} className="space-y-3">
                <p className="text-sm text-slate-600">
                  Enter the ride OTP to start your journey.
                </p>

                <input
                  className={inputClass}
                  value={enteredRideOtp}
                  onChange={(e) => setEnteredRideOtp(e.target.value)}
                  placeholder="Ride OTP"
                  maxLength={4}
                  inputMode="numeric"
                  required
                />

                <button className={appButton}>
                  Verify OTP and start ride
                </button>
              </form>
            )}

            {rideStarted && !rideFinished && (
              <div className="rounded-xl bg-blue-50 p-3 text-sm text-[#173B76]">
                Your ride is in progress.
              </div>
            )}

            {rideFinished && (
              <button
                onClick={() => setPage("feedback")}
                className={appButton}
              >
                Rate your ride
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={triggerSOS}
                className={`rounded-xl p-3 font-bold transition ${
                  sosActive
                    ? "bg-red-100 text-red-800"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {sosActive ? "SOS selected" : "🚨 SOS"}
              </button>

              <button onClick={sendRideSMS} className={outlineButton}>
                SMS fallback
              </button>
            </div>
          </section>
        )}

        {page === "feedback" && (
          <section className={`${cardClass} space-y-4`}>
            <h2 className="text-xl font-bold text-[#173B76]">
              Ride feedback
            </h2>

            <form onSubmit={saveFeedback} className="space-y-4">
              <fieldset>
                <legend className="text-sm font-medium text-slate-800">
                  Rate your ride
                </legend>

                <div
                  className="mt-2 flex items-center gap-2"
                  role="radiogroup"
                  aria-label="Ride rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} star${star === 1 ? "" : "s"}`}
                      aria-pressed={rating === star}
                      className={`text-4xl transition hover:scale-110 ${
                        star <= rating
                          ? "text-amber-400"
                          : "text-slate-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {rating} out of 5 stars
                </p>
              </fieldset>

              <label className="block text-sm font-medium text-slate-800">
                Comment

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={`${inputClass} min-h-28`}
                  placeholder="Share your feedback"
                />
              </label>

              <button className={appButton}>Save feedback</button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
