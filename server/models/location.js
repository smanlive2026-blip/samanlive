//  isska location h   server/models/location.js

const db = require('../database/db'); // tera db connection yaha se

const LocationModel = {

    // Shop ki location save/update
    saveShopLocation: async ({ shopId, lat, lng, type, range, address }) => {
        const sql = `
            INSERT INTO shop_location
            (shop_id, latitude, longitude, location_type, delivery_range, address)
            VALUES (?,?,?)
            ON DUPLICATE KEY UPDATE
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            location_type = VALUES(location_type),
            delivery_range = VALUES(delivery_range),
            address = VALUES(address),
            updated_at = CURRENT_TIMESTAMP
        `;
        await db.execute(sql, [shopId, lat, lng, type, range, address]);
        return { success: true };
    },

    // Shop ki location nikalna
    getShopLocation: async (shopId) => {
        const [rows] = await db.execute('SELECT * FROM shop_location WHERE shop_id =?', [shopId]);
        return rows[0] || null;
    },

    // 5KM ke andar ke shop nikalna
    getNearbyShops: async (lat, lng, maxRangeKm = 10) => {
        const [shops] = await db.execute('SELECT * FROM shop_location WHERE location_type = "fixed"');

        // Haversine formula - meter me doori
        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3;
            const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        };

        return shops.filter(shop => {
            const dist = getDistance(lat, lng, shop.latitude, shop.longitude);
            return dist <= shop.delivery_range * 1000; // KM to meter
        });
    },

    // User ki live location save
    saveUserLocation: async ({ userId, lat, lng }) => {
        const sql = `
            INSERT INTO user_location (user_id, latitude, longitude)
            VALUES (?,?,?)
            ON DUPLICATE KEY UPDATE
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            updated_at = CURRENT_TIMESTAMP
        `;
        await db.execute(sql, [userId, lat, lng]);
        return { success: true };
    }
};

module.exports = LocationModel;