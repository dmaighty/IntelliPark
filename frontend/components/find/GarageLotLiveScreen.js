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

/** Same snapshot the backend sends to the detection service for now. */
const LIVE_FRAME_URI =
  'http://170.249.152.2:8080/cgi-bin/viewer/video.jpg';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const H_PADDING = spacing.screen;

const AUTO_REFRESH_MS = 20_000;

function boxBorderColor(className) {
  const n = (className || '').toLowerCase();
  if (n.includes('occupied')) return 'rgba(255, 59, 48, 0.95)';
  if (n.includes('empty')) return 'rgba(52, 199, 89, 0.95)';
  return 'rgba(0, 122, 255, 0.9)';
}

/**
 * Boxes are in the same coordinate system as prediction.image_width / image_height.
 * displayW/displayH are the on-screen size chosen from that aspect ratio.
 */
function DetectionOverlay({ payload, displayW, displayH }) {
  const iw = payload?.image_width;
  const ih = payload?.image_height;
  const detections = payload?.detections;
  if (!iw || !ih || !displayW || !displayH || !detections?.length) {
    return null;
  }

  return (
    <View
      style={[styles.overlay, { width: displayW, height: displayH }]}
      pointerEvents="none"
    >
      {detections.map((d, index) => {
        const { x1, y1, x2, y2 } = d.box || {};
        if ([x1, y1, x2, y2].some((v) => v == null)) return null;
        const left = (x1 / iw) * displayW;
        const top = (y1 / ih) * displayH;
        const w = ((x2 - x1) / iw) * displayW;
        const h = ((y2 - y1) / ih) * displayH;
        return (
          <View
            key={`${d.class_id}-${index}`}
            style={[
              styles.detectionBox,
              {
                left,
                top,
                width: Math.max(w, 1),
                height: Math.max(h, 1),
                borderColor: boxBorderColor(d.class_name),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function frameImageUri(cacheBust) {
  const sep = LIVE_FRAME_URI.includes('?') ? '&' : '?';
  return `${LIVE_FRAME_URI}${sep}cb=${cacheBust}`;
}

export default function GarageLotLiveScreen({ visible, garage, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [frameCacheBust, setFrameCacheBust] = useState(() => Date.now());
  const loadInFlight = useRef(false);

  const load = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    setLoading(true);
    setError('');
    try {
      const data = await getLiveFramePredictions({ conf: 0.25, imgsz: 640 });
      setPayload(data);
      setFrameCacheBust(Date.now());
    } catch (e) {
      setPayload(null);
      setError(e.message || 'Could not load predictions');
    } finally {
      loadInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setPayload(null);
      setError('');
      return;
    }

    load();
    const intervalId = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [visible, load]);

  const apiW = Number(payload?.image_width);
  const apiH = Number(payload?.image_height);
  const hasApiDimensions =
    Number.isFinite(apiW) && Number.isFinite(apiH) && apiW > 0 && apiH > 0;

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
          <Text style={styles.hint}>
            Live frame (demo). Refreshes every {AUTO_REFRESH_MS / 1000}s. Boxes match
            the latest API response.
          </Text>

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
                key={frameCacheBust}
                source={{ uri: frameImageUri(frameCacheBust) }}
                style={{ width: displayW, height: displayH }}
                resizeMode="stretch"
              />
              <DetectionOverlay
                payload={payload}
                displayW={displayW}
                displayH={displayH}
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

          {!!payload?.detections?.length && (
            <Text style={styles.countText}>
              {payload.detections.length} detection
              {payload.detections.length === 1 ? '' : 's'}
            </Text>
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
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  countText: {
    marginTop: 10,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
