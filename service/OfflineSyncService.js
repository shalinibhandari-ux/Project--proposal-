  class OfflineSyncService {
    constructor() {
        this.queue = [];
        this.nextId = 1;
    }

    // Add data to the queue
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

    // Get pending items
    getPendingData() {
        return this.queue.filter(
            item => item.status === "QUEUED"
        );
    }

    // Get complete queue
    getAllData() {
        return this.queue;
    }

    // Find item by ID
    getById(id) {
        return this.queue.find(
            item => item.id === Number(id)
        );
    }

    // Mark item as synchronized
    markAsSynced(id) {
        const item = this.getById(id);

        if (!item || item.status === "SENT") {
            return null;
        }

        item.status = "SENT";
        item.syncedAt = new Date().toISOString();

        return item;
    }

    // Retry a failed or queued item
    retryItem(id) {
        const item = this.getById(id);

        if (!item || item.status === "SENT") {
            return null;
        }

        item.attempts += 1;
        item.status = "QUEUED";
        item.lastAttemptAt = new Date().toISOString();

        return item;
    }

    // Remove a specific item
    removeItem(id) {
        const length = this.queue.length;

        this.queue = this.queue.filter(
            item => item.id !== Number(id)
        );

        return this.queue.length < length;
    }

    // Remove successfully synchronized items
    removeSyncedItems() {
        const length = this.queue.length;

        this.queue = this.queue.filter(
            item => item.status !== "SENT"
        );

        return length - this.queue.length;
    }

    // Simulate synchronization
    syncData() {
        const pending = this.getPendingData();

        if (pending.length === 0) {
            return {
                success: true,
                message: "No pending data to sync",
                syncedItems: 0
            };
        }

        pending.forEach(item => {
            item.attempts += 1;
            item.status = "SENT";
            item.syncedAt = new Date().toISOString();
        });

        return {
            success: true,
            message: "Demo sync completed successfully",
            syncedItems: pending.length,
            items: pending.map(item => ({
                id: item.id,
                status: item.status
            }))
        };
    }
}

module.exports = OfflineSyncService;
