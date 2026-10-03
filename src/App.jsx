import { useState } from "react";

function App() {
  const [currentView, setCurrentView] = useState("booking");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rideBooked, setRideBooked] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  const bookRide = () => {
    if (!pickup || !destination) {
      alert("Please enter pickup and destination.");
      return;
    }

    setRideBooked(true);
    setCurrentView("tracking");
  };

  const cancelRide = () => {
    setRideBooked(false);
    setCurrentView("booking");
  };

  const triggerSOS = () => {
    setSosActive(true);
  };

  const closeSOS = () => {
    setSosActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      
      {/* Header */}
      <header className="bg-blue-600 px-5 py-4 text-white shadow-md">
        <h1 className="text-xl font-bold">Offline Ride Hailing</h1>
        <p className="text-sm">Cellular Dispatch System</p>
      </header>

      {/* Navigation */}
      <nav className="flex justify-around bg-white p-3 shadow-sm">
        <button
          onClick={() => setCurrentView("booking")}
          className="font-medium text-blue-600"
        >
          Booking
        </button>

        <button
          onClick={() => setCurrentView("tracking")}
          className="font-medium text-blue-600"
        >
          Tracking
        </button>

        <button
          onClick={triggerSOS}
          className="font-bold text-red-600"
        >
          SOS
        </button>
      </nav>

      <main className="mx-auto max-w-md p-5">
        <img
  src="https://www.gstatic.com/webp/gallery/1.sm.webp"
  alt="Runtime Cache Test"
  className="mb-5 w-full rounded-xl"
/>

        {/* Booking Screen */}
        {currentView === "booking" && (
          <section className="rounded-2xl bg-white p-5 shadow-md">
            <h2 className="mb-2 text-2xl font-bold">
              Book a Ride
            </h2>

            <p className="mb-5 text-sm text-gray-500">
              Enter your pickup and destination.
            </p>

            <label className="mb-2 block font-medium">
              Pickup Location
            </label>

            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Enter pickup location"
              className="mb-4 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="mb-2 block font-medium">
              Destination
            </label>

            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination"
              className="mb-5 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={bookRide}
              className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700"
            >
              Book Ride
            </button>
          </section>
        )}

        {/* Tracking Screen */}
        {currentView === "tracking" && (
          <section className="rounded-2xl bg-white p-5 shadow-md">
            <h2 className="mb-2 text-2xl font-bold">
              Ride Tracking
            </h2>

            {rideBooked ? (
              <>
                <div className="mb-5 rounded-lg bg-green-50 p-4">
                  <p className="font-semibold text-green-700">
                    Ride booked successfully
                  </p>

                  <p className="mt-2 text-sm">
                    Pickup: {pickup}
                  </p>

                  <p className="text-sm">
                    Destination: {destination}
                  </p>
                </div>

                <div className="mb-5 rounded-lg bg-gray-100 p-4">
                  <p className="font-semibold">
                    Driver Status
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Driver is on the way...
                  </p>
                </div>

                <button
                  onClick={triggerSOS}
                  className="mb-3 w-full rounded-lg bg-red-600 p-3 font-bold text-white"
                >
                  Emergency SOS
                </button>

                <button
                  onClick={cancelRide}
                  className="w-full rounded-lg border border-gray-300 p-3 font-semibold"
                >
                  Cancel Ride
                </button>
              </>
            ) : (
              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-gray-600">
                  No active ride.
                </p>

                <button
                  onClick={() => setCurrentView("booking")}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  Book a Ride
                </button>
              </div>
            )}
          </section>
        )}

      </main>

      {/* SOS Modal */}
      {sosActive && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-red-600">
              Emergency SOS
            </h2>

            <p className="my-4 text-gray-600">
              Emergency alert has been triggered.
            </p>

            <button
              onClick={closeSOS}
              className="w-full rounded-lg bg-red-600 p-3 font-bold text-white"
            >
              Close Alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;