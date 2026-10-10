class OfflineSyncService {

    constructor() {
        this.queue = [];
    }


    // Store data when offline
    addToQueue(data) {
        this.queue.push({
            data,
            timestamp: new Date()
        });
    }


    // Get pending data
    getPendingData() {
        return this.queue;
    }


    // Remove data after successful sync
    removeFromQueue() {
        this.queue = [];
    }


    // Sync simulation
    syncData() {

        const pending = this.getPendingData();

        if (pending.length === 0) {
            return {
                success: false,
                message: "No data to sync"
            };
        }


        this.removeFromQueue();

        return {
            success: true,
            message: "Data synced successfully",
            syncedItems: pending.length
        };
    }

}


module.exports = OfflineSyncService;