import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import CommonHeader from '../components/CommonHeader';
import { notificationsAPI } from '../utils/api';

const COLORS = {
  primary: '#D4AF37',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  error: '#EF4444',
};

export default function NotificationsScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (page === 1) {
        setLoading(true);
      }

      const response = await notificationsAPI.getNotifications({
        page: isRefresh ? 1 : page,
        limit: 20,
      });

      if (response.success) {
        const newNotifications = response.data?.notifications || [];
        if (isRefresh || page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }
        setUnreadCount(response.data?.unreadCount || 0);
        setHasMore(newNotifications.length >= 20);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadNotifications(true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      setPage((prev) => prev + 1);
      loadNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all read error:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = (id) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsAPI.deleteNotification(id);
              setNotifications((prev) => prev.filter((n) => n._id !== id));
            } catch (error) {
              console.error('Delete notification error:', error);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
      case 'task_assigned':
        return 'check-square';
      case 'vendor_assigned':
        return 'truck';
      case 'executive_added':
      case 'team_member_added':
        return 'user-plus';
      case 'project_update':
        return 'refresh-cw';
      case 'milestone_completed':
        return 'award';
      case 'deadline_reminder':
      case 'schedule_reminder':
        return 'clock';
      case 'quotation_received':
      case 'quotation_accepted':
        return 'file-text';
      case 'invoice_generated':
      case 'payment_received':
        return 'credit-card';
      case 'message_received':
        return 'message-circle';
      case 'material_request':
        return 'package';
      case 'work_status_update':
        return 'tool';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent' || priority === 'high') return COLORS.error;
    switch (type) {
      case 'milestone_completed':
      case 'quotation_accepted':
      case 'payment_received':
        return COLORS.success;
      case 'deadline_reminder':
      case 'schedule_reminder':
        return COLORS.warning;
      case 'project_update':
      case 'message_received':
        return COLORS.info;
      default:
        return COLORS.primary;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const renderNotification = ({ item }) => {
    const iconColor = getNotificationColor(item.type, item.priority);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => {
          if (!item.read) handleMarkAsRead(item._id);
        }}
        onLongPress={() => handleDeleteNotification(item._id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Feather 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color={iconColor} 
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            {item.priority && item.priority !== 'normal' && (
              <View style={[styles.priorityBadge, { backgroundColor: iconColor + '20' }]}>
                <Text style={[styles.priorityText, { color: iconColor }]}>
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>
            {item.sender && (
              <Text style={styles.senderText}>
                • from {item.sender.firstName} {item.sender.lastName}
              </Text>
            )}
          </View>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (unreadCount === 0) return null;
    return (
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Feather name="check-circle" size={16} color={COLORS.primary} />
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="bell-off" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        When you receive notifications, they'll appear here.
      </Text>
      <Text style={styles.emptyHint}>
        Pull down to refresh
      </Text>
    </View>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Notifications" userRole="" showNotifications={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader 
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`} 
        userRole="" 
        showNotifications={false} 
      />
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.scrollContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && notifications.length > 0 ? (
            <ActivityIndicator style={{ padding: 20 }} color={COLORS.primary} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  headerActions: {
    marginBottom: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
  },
  markAllText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadItem: {
    backgroundColor: COLORS.primary + '05',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  senderText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(184, 134, 11, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});
