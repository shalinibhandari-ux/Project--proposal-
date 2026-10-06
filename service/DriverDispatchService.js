const { Point, Boundary, QuadTree } = require("../../RideSafety-DSA/algorithms/QuadTree");
class DriverDispatchService {
    constructor() {
        this.drivers = new Map();

    const boundary = new Boundary(200, 200, 200, 200);

    this.quadTree = new QuadTree(boundary, 4);
}

   addDriver(driverId, latitude, longitude) {

    const driver = {
        driverId,
        latitude,
        longitude,
        available: true
    };

    this.drivers.set(driverId, driver);

    const point = new Point(
        latitude,
        longitude,
        driverId
    );

    this.quadTree.insert(point);
}

    updateDriverLocation(driverId, latitude, longitude) {
        const driver = this.drivers.get(driverId);

        if (!driver) {
            return false;
        }

        driver.latitude = latitude;
        driver.longitude = longitude;

        return true;
    }

    setDriverAvailability(driverId, available) {
        const driver = this.drivers.get(driverId);

        if (!driver) {
            return false;
        }

        driver.available = available;

        return true;
    }

    getAvailableDrivers() {
        return Array.from(this.drivers.values())
            .filter(driver => driver.available);
            findNearbyDrivers(latitude, longitude, range) {
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
}

module.exports = DriverDispatchService;