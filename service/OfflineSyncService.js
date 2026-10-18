 
class OfflineSyncService {
    constructor() {
        this.queue = [];
        this.nextId = 1;
    }

    // Store data in the offline queue
    addToQueue(data) {
        const item = {
            id: this.nextId++,
            data,
            timestamp: new Date().toISOString(),
            status: "QUEUED",
            attempts: 0
        };

        this.queue.push(item);
        return item;
    }

    // Get all pending data
    getPendingData() {
        return this.queue.filter(item => item.status === "QUEUED");
    }

    // Get complete queue
    getAllData() {
        return this.queue;
    }

    // Find an item by ID
    getById(id) {
        return this.queue.find(item => item.id === Number(id));
    }

    // Mark an item as successfully synced
    markAsSynced(id) {
        const item = this.getById(id);

        if (!item) {
            return null;
        }

        item.status = "SENT";
        item.syncedAt = new Date().toISOString();
        return item;
    }

    // Retry a queued item
    retryItem(id) {
        const item = this.getById(id);

        if (!item) {
            return null;
        }

        item.attempts += 1;
        item.status = "QUEUED";
        item.lastAttemptAt = new Date().toISOString();

        return item;
    }

    // Remove a specific item
    removeItem(id) {
        const initialLength = this.queue.length;

        this.queue = this.queue.filter(
            item => item.id !== Number(id)
        );

        return this.queue.length < initialLength;
    }

    // Remove all successfully synced items
    removeSyncedItems() {
        const initialLength = this.queue.length;

        this.queue = this.queue.filter(
            item => item.status !== "SENT"
        );

        return initialLength - this.queue.length;
    }

    // Simulate syncing pending data
    syncData() {
        const pending = this.getPendingData();

        if (pending.length === 0) {
            return {
                success: false,
                message: "No pending data to sync",
                syncedItems: 0
            };
        }

        pending.forEach(item => {
            item.status = "SENT";
            item.syncedAt = new Date().toISOString();
        });

        return {
            success: true,
            message: "Demo sync completed successfully",
            syncedItems: pending.length
        };
    }
}

module.exports = OfflineSyncService;
