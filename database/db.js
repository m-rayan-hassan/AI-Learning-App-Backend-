import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;

    mongoose.connection.on("connected", () => {
      console.log("MONGODB CONNECTED");
      this.isConnected = true;
      this.retryCount = 0;
    });

    mongoose.connection.on("error", (err) => {
      console.error("MONGODB ERROR:", err.message);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MONGODB DISCONNECTED");
      this.isConnected = false;
    });

    process.on("SIGTERM", this.handleAppTermination.bind(this));
  }

  async connect() {
    if (!process.env.MONGODB_URI) {
      throw new Error("MongoDB URI missing in environment variables");
    }

    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      });
    } catch (error) {
      console.error("CONNECTION FAILED:", error.message);
      await this.retryConnection();
    }
  }

  async retryConnection() {
    if (this.retryCount >= MAX_RETRIES) {
      console.error("MongoDB failed after max retries");
      process.exit(1);
    }

    this.retryCount++;
    console.log(
      `Retrying MongoDB (${this.retryCount}/${MAX_RETRIES})...`
    );

    await new Promise((res) => setTimeout(res, RETRY_INTERVAL));
    return this.connect();
  }

  async handleAppTermination() {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

const db = new DatabaseConnection();

export default db.connect.bind(db);
export const getDBStatus = db.getConnectionStatus.bind(db);
