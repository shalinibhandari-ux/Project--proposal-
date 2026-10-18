 const { Point, Boundary, QuadTree } = require("../../Project--proposal--main/Offline-Ride-Hailing-PWA-&-Cellular-Dispatch-System/RideSafety-DSA/algorithms/QuadTree");

class DriverDispatchService {
    constructor() {
        this.drivers = new Map();
        this.rebuildQuadTree();
    }

    rebuildQuadTree() {
        // Latitude range: -90 to 90
        // Longitude range: -180 to 180
        const boundary = new Boundary(0, 0, 180, 90);
        this.quadTree = new QuadTree(boundary, 4);

        for (const driver of this.drivers.values()) {
            this.quadTree.insert(
                new Point(driver.latitude, driver.longitude, driver.driverId)
            );
        }
    }

    addDriver(driverId, latitude, longitude) {
        if (
            !driverId ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return false;
        }

        const driver = {
            driverId,
            latitude,
            longitude,
            available: true
        };

        this.drivers.set(driverId, driver);
        this.rebuildQuadTree();

        return true;
    }

    updateDriverLocation(driverId, latitude, longitude) {
        const driver = this.drivers.get(driverId);

        if (
            !driver ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return false;
        }

        driver.latitude = latitude;
        driver.longitude = longitude;

        this.rebuildQuadTree();
        return true;
    }

    setDriverAvailability(driverId, available) {
        const driver = this.drivers.get(driverId);

        if (!driver || typeof available !== "boolean") {
            return false;
        }

        driver.available = available;
        return true;
    }

    getAvailableDrivers() {
        return Array.from(this.drivers.values())
            .filter(driver => driver.available);
    }

    findNearbyDrivers(latitude, longitude, range) {
        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            !Number.isFinite(range) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180 ||
            range < 0
        ) {
            return [];
        }

        const searchArea = new Boundary(
            latitude,
            longitude,
            range,
            range
        );

        const nearbyPoints = this.quadTree.query(searchArea);

        return nearbyPoints
            .map(point => this.drivers.get(point.driver))
            .filter(driver => driver && driver.available);
    }
}

module.exports = DriverDispatchService;
