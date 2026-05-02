import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

const API_URL = "http://192.168.1.8:8000"; // change to computer with backend, add :8000

export default function ParkingLiveView() {
    console.log("GarageDemo screen loaded"); 
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000);
    fetchStatus();

    return () => clearInterval(interval);
  }, []);

    const fetchStatus = async () => {
    try {
        const url = "http://192.168.1.8:8000/api/garage-demo/status";
        console.log("Fetching garage demo:", url); // DEMO ONLY

        const res = await fetch(url);
        const data = await res.json();

        console.log("Garage demo data:", data); // DEMO ONLY

        setStatus(data);
    } catch (error) {
        console.log("Garage demo fetch error:", error); // DEMO ONLY

        setStatus({
        running: false,
        message: "Model is not running",
        spaces: [],
        });
    }
    };
  if (!status || !status.running) {
    return (
      <View style={styles.container}>
        <Text style={styles.warning}>Model is not running</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Live Parking Detection</Text>

      <Text style={styles.stats}>
        {status.occupied}/{status.total} occupied
      </Text>

      <View style={styles.grid}>
        {status.spaces.map((space) => (
          <View
            key={space.id}
            style={[
              styles.spaceCard,
              space.status === "occupied" ? styles.occupied : styles.free,
            ]}
          >
            <Text style={styles.spaceText}>{space.id}</Text>
            <Text>{space.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  stats: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 16,
  },
  warning: {
    fontSize: 20,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
    marginTop: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  spaceCard: {
    width: 90,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    margin: 4,
  },
  occupied: {
    backgroundColor: "#ffcccc",
  },
  free: {
    backgroundColor: "#ccffcc",
  },
  spaceText: {
    fontWeight: "bold",
  },
});