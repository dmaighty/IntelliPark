import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { getLiveFramePredictions } from '../../api/prediction';
import { spacing, radius, shadow } from '../../styles/global';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const H_PADDING = spacing.screen;

const AUTO_REFRESH_MS = 30_000;

export default function GarageLotLiveScreen({
  visible,
  garage,
  onClose,
  onAvailabilityChange,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const loadInFlight = useRef(false);

  const load = useCallback(async () => {
    if (loadInFlight.current || !garage?.id) return;
    loadInFlight.current = true;
    setLoading(true);
    setError('');
    try {
      const data = await getLiveFramePredictions({
        lotId: garage.id,
        conf: 0.1,
        imgsz: 960,
      });
      setPayload(data);
      if (
        data.total_spots > 0 &&
        typeof data.empty === 'number'
      ) {
        onAvailabilityChange?.(garage.id, data.empty);
      }
    } catch (e) {
      setPayload(null);
      setError(e.message || 'Could not load predictions');
    } finally {
      loadInFlight.current = false;
      setLoading(false);
    }
  }, [garage?.id, onAvailabilityChange]);

  useEffect(() => {
    if (!visible || !garage?.id) {
      setPayload(null);
      setError('');
      return;
    }

    load();
    const intervalId = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [visible, garage?.id, load]);

  const apiW = Number(payload?.image_width);
  const apiH = Number(payload?.image_height);
  const hasApiDimensions =
    Number.isFinite(apiW) &&
    Number.isFinite(apiH) &&
    apiW > 0 &&
    apiH > 0 &&
    !!payload?.annotated_image;

  const displayW = Math.max(WINDOW_WIDTH - 2 * H_PADDING, 1);
  const displayH = hasApiDimensions ? displayW * (apiH / apiW) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {garage?.name || 'Garage lot'}
          </Text>
          <TouchableOpacity
            onPress={load}
            style={styles.refreshBtn}
            disabled={loading}
          >
            <Text style={styles.refreshText}>{loading ? '…' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* <Text style={styles.hint}>
            Live frame (demo). Refreshes every {AUTO_REFRESH_MS / 1000}s. Spot
            boxes are drawn by the detection service.
          </Text> */}

          <View style={[styles.legend, shadow.soft]}>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { borderColor: 'rgba(255, 59, 48, 0.95)' }]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
            <View style={[styles.legendRow, styles.legendRowLast]}>
              <View style={[styles.legendSwatch, { borderColor: 'rgba(52, 199, 89, 0.95)' }]} />
              <Text style={styles.legendText}>Empty</Text>
            </View>
          </View>

          {loading && !payload && (
            <View style={styles.centerRow}>
              <ActivityIndicator size="large" color="#111" />
              <Text style={styles.loadingText}>Running detection…</Text>
            </View>
          )}

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {hasApiDimensions && displayH > 0 ? (
            <View style={[styles.frameWrap, { width: displayW }]}>
              <Image
                source={{ uri: payload.annotated_image }}
                style={{ width: displayW, height: displayH }}
                resizeMode="stretch"
              />
            </View>
          ) : (
            !loading &&
            !error && (
              <Text style={styles.waitDimsText}>
                Waiting for prediction dimensions…
              </Text>
            )
          )}

          {typeof payload?.occupied === 'number' &&
          typeof payload?.empty === 'number' ? (
            payload.total_spots ? (
              <Text style={styles.countText}>
                {payload.occupied} occupied · {payload.empty} empty (of{' '}
                {payload.total_spots} spots)
              </Text>
            ) : (
              !loading && (
                <Text style={styles.countText}>
                  No parking spots have been defined for this garage yet.
                </Text>
              )
            )
          ) : (
            !!payload?.detections?.length && (
              <Text style={styles.countText}>
                {payload.detections.length} detection
                {payload.detections.length === 1 ? '' : 's'}
              </Text>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 8,
    minWidth: 44,
  },
  backText: {
    fontSize: 28,
    color: '#000',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  refreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
    alignItems: 'flex-end',
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007aff',
  },
  scroll: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    marginBottom: 10,
  },
  legend: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: radius.medium,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendRowLast: {
    marginRight: 0,
  },
  legendSwatch: {
    width: 22,
    height: 16,
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  centerRow: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
  },
  errorBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: radius.medium,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#856404',
  },
  waitDimsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  frameWrap: {
    alignSelf: 'center',
    position: 'relative',
    borderRadius: radius.medium,
    overflow: 'hidden',
    ...shadow.soft,
  },
  countText: {
    marginTop: 10,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
