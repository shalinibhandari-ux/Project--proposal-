  const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(__dirname, "ride_safety.db");

const db = new sqlite3.Database(databasePath, (error) => {
    if (error) {
        console.error("Database connection failed:", error.message);
    } else {
        console.log("SQLite database connected successfully");
    }
});

const ready = new Promise((resolve, reject) => {
    db.serialize(() => {

        // Drivers table
        db.run(`
            CREATE TABLE IF NOT EXISTS drivers (
                driver_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                vehicle_type TEXT NOT NULL,
                vehicle_number TEXT NOT NULL,
                experience TEXT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                available INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (error) => {
            if (error) {
                reject(error);
                return;
            }

            console.log("Drivers table is ready");
        });

        // Rides table
        db.run(`
            CREATE TABLE IF NOT EXISTS rides (
                ride_id TEXT PRIMARY KEY,
                pickup_latitude REAL NOT NULL,
                pickup_longitude REAL NOT NULL,
                dropoff_latitude REAL NOT NULL,
                dropoff_longitude REAL NOT NULL,
                status TEXT DEFAULT 'PENDING',
                assigned_driver_id TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (error) => {
            if (error) {
                reject(error);
                return;
            }

            console.log("Rides table is ready");

            // Check existing columns
            db.all("PRAGMA table_info(rides)", (error, columns) => {
                if (error) {
                    reject(error);
                    return;
                }

                const existingColumns = columns.map(column => column.name);

                const newColumns = [
                    {
                        name: "distance_km",
                        sql: "ALTER TABLE rides ADD COLUMN distance_km REAL"
                    },
                    {
                        name: "fare",
                        sql: "ALTER TABLE rides ADD COLUMN fare REAL"
                    },
                    {
                        name: "vehicle_type",
                        sql: "ALTER TABLE rides ADD COLUMN vehicle_type TEXT"
                    }
                ];

                // Add only missing columns
                const missingColumns = newColumns.filter(
                    column => !existingColumns.includes(column.name)
                );

                let index = 0;

                function addNextColumn() {
                    if (index >= missingColumns.length) {
                        console.log("Ride table migration completed");
                        resolve();
                        return;
                    }

                    const column = missingColumns[index];

                    db.run(column.sql, (error) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        console.log(`${column.name} column added`);
                        index++;
                        addNextColumn();
                    });
                }

                addNextColumn();
            });
        });
    });
});

module.exports = {
    db,
    ready
};
