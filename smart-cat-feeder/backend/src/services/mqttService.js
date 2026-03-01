const mqtt = require("mqtt");
const db = require("../config/db");
const {
    notifyBowlLow,
    notifyBowlFull,
    notifyTankLow,
    notifyTankFull
} = require("../controllers/notification.controller");

let mqttClient;
let io;
const userWeightTracker = {}; // ⚖️ Track weight peaks to calculate eaten amount

const connectMQTT = (socketIoInstance) => {
    io = socketIoInstance;

    const mqttOptions = {};
    const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost";

    mqttClient = mqtt.connect(MQTT_BROKER_URL, mqttOptions);

    mqttClient.on("connect", () => {
        console.log("✅ MQTT Connected to " + MQTT_BROKER_URL);

        // Subscribe to relevant topics
        mqttClient.subscribe("esp32/camera");
        mqttClient.subscribe("device/status/+/weight");
        mqttClient.subscribe("device/status/+/log");

        console.log("📡 Subscribed to status and log topics");
    });

    mqttClient.on("message", (topic, message) => {
        const payload = message.toString();

        // 1. Camera Frame
        if (topic === "esp32/camera") {
            const imageBase64 = message.toString("base64");
            io.emit("camera-frame", imageBase64);
        }

        // 2. Weight Update (topic: device/status/:userId/weight)
        else if (topic.includes("/weight")) {
            const userId = topic.split("/")[2];
            try {
                const data = JSON.parse(payload);
                db.query(
                    "INSERT INTO cat_status (user_id, weight, tank_level, chip_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE weight=?, tank_level=?, chip_id=?",
                    [userId, data.weight, data.level, data.chipId, data.weight, data.level, data.chipId],
                    (err) => {
                        if (err) console.error("❌ DB Upsert Weight/Level Error:", err);
                        else {
                            console.log(`⚖️ Weight/Level sync for user ${userId}: ${data.weight}g, ${data.level}%`);
                            // 🚀 Real-time update for frontend
                            io.emit("weight-update", { userId, weight: data.weight });
                            io.emit("level-update", { userId, level: data.level });

                            // 🔍 Auto-Discovery: Notify frontend about active device Chip ID
                            if (data.chipId) {
                                io.emit("device-discovered", {
                                    chipId: String(data.chipId),
                                    currentUserId: userId
                                });
                            }

                            //  Bento: Calculate 'Amount Eaten'
                            const tracker = userWeightTracker[userId];
                            if (tracker && data.weight < tracker.lastPeak) {
                                const eatenSoFar = tracker.lastPeak - data.weight;
                                if (eatenSoFar > (tracker.amountEaten || 0)) {
                                    db.query(
                                        `UPDATE feeding_logs 
                                         SET amount_eaten = ? 
                                         WHERE user_id = ? 
                                         ORDER BY created_at DESC LIMIT 1`,
                                        [Math.round(eatenSoFar), userId],
                                        (err) => {
                                            if (err) console.error(`❌ Error updating amount_eaten for user ${userId}:`, err.message);
                                        }
                                    );
                                    userWeightTracker[userId].amountEaten = eatenSoFar;
                                }
                            }

                            // Bowl/Tank notifications...
                            notifyBowlLow(userId, data.weight, () => io.emit("new-notification", { userId, type: "BOWL_LOW" }));
                            notifyBowlFull(userId, data.weight, () => io.emit("new-notification", { userId, type: "BOWL_FULL" }));
                            notifyTankLow(userId, data.level, () => io.emit("new-notification", { userId, type: "TANK_LOW" }));
                            notifyTankFull(userId, data.level, () => io.emit("new-notification", { userId, type: "TANK_FULL" }));
                        }
                    }
                );
            } catch (e) {
                console.error("❌ Invalid weight payload:", payload, e.message);
            }
        }

        // 3. Feeding Log (topic: device/status/:userId/log)
        else if (topic.includes("/log")) {
            const userId = topic.split("/")[2];
            try {
                const data = JSON.parse(payload);
                console.log(`📥 Log received for user ${userId}:`, data);
                db.query(
                    "INSERT INTO feeding_logs (user_id, amount, mode) VALUES (?,?,?)",
                    [userId, data.amount, data.mode],
                    (err) => {
                        if (err) console.error("❌ DB Insert Log Error:", err.message);
                        else {
                            console.log(`📝 Feeding log saved for user ${userId}: ${data.amount}g (${data.mode})`);

                            // 🚀 Real-time update for dashboard logs/summary
                            io.emit("feed-update", { userId });

                            // Reset tracker for new feeding round
                            db.query("SELECT weight FROM cat_status WHERE user_id=?", [userId], (err, r) => {
                                if (!err && r[0]) {
                                    userWeightTracker[userId] = {
                                        lastPeak: r[0].weight + (data.amount || 0), // Estimate peak
                                        amountEaten: 0
                                    };
                                    console.log(`⚖️ Tracker reset for user ${userId}. New peak estimate: ${userWeightTracker[userId].lastPeak}g`);
                                }
                            });
                        }
                    }
                );
            } catch (e) {
                console.error("❌ Invalid log payload:", payload, e.message);
            }
        }
    });

    mqttClient.on("error", (err) => {
        console.error("❌ MQTT Connection Error:", err.message);
    });
};

const publishMessage = (topic, message) => {
    if (mqttClient && mqttClient.connected) {
        const payload = JSON.stringify(message);
        mqttClient.publish(topic, payload);
        console.log(`📤 Message published to ${topic}:`, payload);
        return true;
    }
    console.warn(`⚠️ Failed to publish to ${topic}: MQTT not connected`);
    return false;
};

module.exports = { connectMQTT, publishMessage };
