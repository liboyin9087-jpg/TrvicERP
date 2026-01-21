import { useState, useEffect, useCallback } from 'react';
import {
  RealtimeService,
  realtimeService,
  RealtimeNotification,
  LocationUpdate,
  ConnectionStatus,
  NotificationType,
} from '../services/realtimeService';

type NotificationSeverity = RealtimeNotification['severity'];

export function useRealtimeConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const handleStatusChange = ({ status: newStatus }: { status: ConnectionStatus }) => {
      setStatus(newStatus);
    };

    realtimeService.on('status_change', handleStatusChange);
    realtimeService.connect();

    return () => {
      realtimeService.off('status_change', handleStatusChange);
    };
  }, []);

  const connect = useCallback(() => {
    realtimeService.connect();
  }, []);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
  }, []);

  return { status, connect, disconnect };
}

export function useSessionRealtime(sessionId: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [locations, setLocations] = useState<Map<string, LocationUpdate>>(new Map());

  useEffect(() => {
    if (!sessionId) return;

    const handleNotification = (notification: RealtimeNotification) => {
      if (notification.sessionId === sessionId) {
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
      }
    };

    const handleLocationUpdate = (location: LocationUpdate) => {
      if (location.sessionId === sessionId) {
        setLocations((prev) => {
          const newMap = new Map(prev);
          newMap.set(location.userId, location);
          return newMap;
        });
      }
    };

    realtimeService.on('notification', handleNotification);
    realtimeService.on('location_update', handleLocationUpdate);
    realtimeService.subscribeToSession(sessionId);

    return () => {
      realtimeService.off('notification', handleNotification);
      realtimeService.off('location_update', handleLocationUpdate);
      realtimeService.unsubscribeFromSession(sessionId);
    };
  }, [sessionId]);

  const sendNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      severity: NotificationSeverity = 'info'
    ) => {
      if (!sessionId) return;
      realtimeService.sendNotification({
        type,
        sessionId,
        title,
        message,
        severity,
      });
    },
    [sessionId]
  );

  const sendEmergency = useCallback(
    (message: string) => {
      if (!sessionId) return;
      realtimeService.sendEmergency(sessionId, message);
    },
    [sessionId]
  );

  const sendAnnouncement = useCallback(
    (title: string, message: string) => {
      if (!sessionId) return;
      realtimeService.sendAnnouncement(sessionId, title, message);
    },
    [sessionId]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    locations: Array.from(locations.values()),
    sendNotification,
    sendEmergency,
    sendAnnouncement,
    clearNotifications,
  };
}

export function useLeaderLocation(sessionId: string | null, userId: string, userName: string) {
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback(() => {
    if (!sessionId) {
      setError('無效的團次ID');
      return;
    }

    if (!navigator.geolocation) {
      setError('不支援地理位置功能');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        realtimeService.sendLocationUpdate({
          sessionId,
          userId,
          userName,
          role: 'leader',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError(null);
      },
      (err: GeolocationPositionError) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
    setIsTracking(true);
  }, [sessionId, userId, userName]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return { isTracking, error, startTracking, stopTracking };
}

export default useRealtimeConnection;