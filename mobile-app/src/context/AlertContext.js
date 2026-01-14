import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

const COLORS = {
  primary: '#D4AF37',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const AlertContext = createContext();

/**
 * AlertProvider - Provides global alert functionality throughout the app
 * 
 * Usage:
 * 1. Wrap your app with <AlertProvider>
 * 2. Use the useAlert hook in any component
 * 
 * const { showAlert, showSuccess, showError, showWarning, showInfo, showConfirm } = useAlert();
 * 
 * showSuccess('Profile updated!');
 * showError('Failed to save');
 * showWarning('This action cannot be undone');
 * showConfirm({
 *   title: 'Confirm Delete',
 *   message: 'Are you sure?',
 *   onConfirm: () => handleDelete(),
 *   confirmText: 'Delete',
 *   cancelText: 'Cancel',
 * });
 */
export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    showConfirm: false,
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(({ type = 'info', title = '', message = '', duration = 3000 }) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      showConfirm: false,
      onConfirm: null,
      onCancel: null,
      confirmText: 'OK',
      cancelText: 'Cancel',
    });

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(hideAlert, duration);
    }
  }, [hideAlert]);

  const showSuccess = useCallback((message, title = 'Success') => {
    showAlert({ type: 'success', title, message });
  }, [showAlert]);

  const showError = useCallback((message, title = 'Error') => {
    showAlert({ type: 'error', title, message });
  }, [showAlert]);

  const showWarning = useCallback((message, title = 'Warning') => {
    showAlert({ type: 'warning', title, message });
  }, [showAlert]);

  const showInfo = useCallback((message, title = 'Info') => {
    showAlert({ type: 'info', title, message });
  }, [showAlert]);

  const showConfirm = useCallback(({
    title = 'Confirm',
    message = '',
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
  }) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      showConfirm: true,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
    });
  }, []);

  const handleConfirm = () => {
    if (alert.onConfirm) {
      alert.onConfirm();
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (alert.onCancel) {
      alert.onCancel();
    }
    hideAlert();
  };

  const getIconName = () => {
    switch (alert.type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getTypeColor = () => {
    switch (alert.type) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.danger;
      case 'warning': return COLORS.warning;
      case 'info': return COLORS.info;
      default: return COLORS.info;
    }
  };

  const value = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      
      {/* Alert Modal */}
      <Modal
        visible={alert.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: getTypeColor() + '15' }]}>
              <Feather name={getIconName()} size={32} color={getTypeColor()} />
            </View>
            
            {/* Title */}
            {alert.title && (
              <Text style={styles.title}>{alert.title}</Text>
            )}
            
            {/* Message */}
            {alert.message && (
              <Text style={styles.message}>{alert.message}</Text>
            )}
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {alert.showConfirm ? (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>{alert.cancelText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.confirmButton, { backgroundColor: getTypeColor() }]} 
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>{alert.confirmText}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.confirmButton, { backgroundColor: getTypeColor() }]} 
                  onPress={hideAlert}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AlertProvider;
