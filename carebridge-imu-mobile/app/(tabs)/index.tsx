import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const FALL_THRESHOLD = 2.5;

export default function HomeScreen() {
  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
  const [peak, setPeak] = useState(0);
  const [status, setStatus] = useState('Monitoring normal movement');
  const [showAlertCard, setShowAlertCard] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);

  const total = Math.sqrt(x * x + y * y + z * z);

  // Use refs to avoid stale closures in the accelerometer listener
  const alertActiveRef = useRef(false);
  const helpRequestedRef = useRef(false);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(accelerometerData => {
      setData(accelerometerData);
      
      const currentTotal = Math.sqrt(
        accelerometerData.x * accelerometerData.x +
        accelerometerData.y * accelerometerData.y +
        accelerometerData.z * accelerometerData.z
      );

      setPeak(prevPeak => Math.max(prevPeak, currentTotal));

      if (currentTotal >= FALL_THRESHOLD && !alertActiveRef.current && !helpRequestedRef.current) {
        // Trigger alert
        alertActiveRef.current = true;
        setStatus('Possible fall / strong impact detected');
        setShowAlertCard(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleImOkay = () => {
    setShowAlertCard(false);
    setStatus('User marked safe - monitoring resumed');
    // Allow triggering again
    alertActiveRef.current = false;
  };

  const handleNeedHelp = () => {
    setShowAlertCard(false);
    setStatus('User requested help');
    setEmergencyTriggered(true);
    // Prevent further alerts while in emergency flow
    helpRequestedRef.current = true;
    alertActiveRef.current = false;
  };

  const handleReset = () => {
    setPeak(0);
    setStatus('Monitoring normal movement');
    setShowAlertCard(false);
    setEmergencyTriggered(false);
    alertActiveRef.current = false;
    helpRequestedRef.current = false;
  };

  const isAlert = status === 'Possible fall / strong impact detected' || status === 'User requested help';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CareBridge IMU Monitor</Text>
      
      <View style={styles.dataContainer}>
        <Text style={styles.dataText}>X: {x.toFixed(4)}</Text>
        <Text style={styles.dataText}>Y: {y.toFixed(4)}</Text>
        <Text style={styles.dataText}>Z: {z.toFixed(4)}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Total Acceleration: {total.toFixed(4)}</Text>
        <Text style={styles.statsText}>Peak Acceleration: {peak.toFixed(4)}</Text>
      </View>

      <View style={[styles.statusContainer, isAlert && styles.statusAlert]}>
        <Text style={[styles.statusText, isAlert && styles.statusTextAlert]}>
          Status: {status}
        </Text>
      </View>

      {showAlertCard && (
        <View style={styles.alertCard}>
          <Text style={styles.alertCardTitle}>Possible Fall Detected</Text>
          <Text style={styles.alertCardSubtitle}>Bạn có ổn không?</Text>
          <View style={styles.alertCardButtons}>
            <TouchableOpacity style={[styles.button, styles.btnSafe]} onPress={handleImOkay}>
              <Text style={styles.btnSafeText}>Tôi ổn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.btnHelp]} onPress={handleNeedHelp}>
              <Text style={styles.btnHelpText}>Cần trợ giúp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {emergencyTriggered && (
        <View style={styles.emergencyContainer}>
          <Text style={styles.emergencyText}>Emergency flow triggered</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Reset Peak & Status" onPress={handleReset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  dataContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  dataText: {
    fontSize: 20,
    marginBottom: 5,
    fontVariant: ['tabular-nums'],
  },
  statsContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
    width: '100%',
  },
  statsText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  statusContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    marginBottom: 20,
    alignItems: 'center',
  },
  statusAlert: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  statusTextAlert: {
    color: '#c62828',
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#d32f2f',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  alertCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  alertCardSubtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  alertCardButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  btnSafe: {
    backgroundColor: '#4caf50',
  },
  btnHelp: {
    backgroundColor: '#fff',
  },
  btnSafeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  btnHelpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  emergencyContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ff9800',
    marginBottom: 20,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  }
});
