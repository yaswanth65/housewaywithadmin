import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, Linking, Alert, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';
import theme from '../../../styles/theme';
import { vendorInvoicesAPI, purchaseOrdersAPI } from '../../../utils/api';

export default function PaymentsInvoices({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'orders'
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedInvoiceForUpload, setSelectedInvoiceForUpload] = useState(null);

  useEffect(() => { 
    load(); 
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      
      // Load vendor invoices
      const invoicesRes = await vendorInvoicesAPI.getMyInvoices();
      if (invoicesRes.success) {
        setInvoices(invoicesRes.data?.invoices || []);
      } else {
        setInvoices(invoicesRes || []);
      }
      
      // Load purchase orders
      const ordersRes = await purchaseOrdersAPI.getMyOrders();
      if (ordersRes.success) {
        setOrders(ordersRes.data?.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  // Open upload modal for an invoice
  const openUploadModal = (invoice) => {
    setSelectedInvoiceForUpload(invoice);
    setUploadModalVisible(true);
  };

  // Handle picking a PDF document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      await uploadFile(file);
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Handle picking an image
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload invoice images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      await uploadFile({
        uri: file.uri,
        name: file.fileName || `invoice-${Date.now()}.jpg`,
        mimeType: file.mimeType || 'image/jpeg',
      });
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Upload file to server
  const uploadFile = async (file) => {
    if (!selectedInvoiceForUpload) return;

    setUploading(true);
    setUploadModalVisible(false);

    try {
      const formData = new FormData();
      formData.append('invoiceFile', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        name: file.name || file.fileName || `invoice-${Date.now()}.pdf`,
        type: file.mimeType || 'application/pdf',
      });

      const response = await vendorInvoicesAPI.uploadInvoiceDocument(selectedInvoiceForUpload._id, formData);

      if (response.success) {
        Alert.alert('Success', 'Invoice document uploaded successfully!');
        // Refresh invoices to show updated attachments
        load();
      } else {
        Alert.alert('Error', response.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload invoice document. Please try again.');
    } finally {
      setUploading(false);
      setSelectedInvoiceForUpload(null);
    }
  };

  // Delete an attachment
  const deleteAttachment = async (invoiceId, attachmentId, attachmentName) => {
    Alert.alert(
      'Delete Attachment',
      `Are you sure you want to delete "${attachmentName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await vendorInvoicesAPI.deleteAttachment(invoiceId, attachmentId);
              if (response.success) {
                Alert.alert('Success', 'Attachment deleted');
                load();
                setSelected(null);
              } else {
                Alert.alert('Error', response.message || 'Failed to delete attachment');
              }
            } catch (error) {
              console.error('Delete attachment error:', error);
              Alert.alert('Error', 'Failed to delete attachment');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return theme.colors.success?.[500] || '#10B981';
      case 'pending': return theme.colors.warning?.[500] || '#F59E0B';
      case 'overdue': return theme.colors.error?.[500] || '#EF4444';
      default: return theme.colors.text?.muted || '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background?.primary || '#F8F9FA', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3B82F6'} />
        <Text style={{ marginTop: 12, color: theme.colors.text?.secondary || '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor: theme.colors.background?.primary || '#F8F9FA' }}>
      <AppHeader title="Payments & Invoices" onMenu={() => navigation.openDrawer()} />
      
      {/* Tab Selector */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.colors.background?.secondary || '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.border?.light || '#E5E7EB' }}>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'invoices' ? (theme.colors.primary?.[500] || '#3B82F6') : 'transparent' }}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={{ fontWeight: '600', color: activeTab === 'invoices' ? (theme.colors.primary?.[500] || '#3B82F6') : (theme.colors.text?.muted || '#6B7280') }}>
            Invoices ({invoices.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'orders' ? (theme.colors.primary?.[500] || '#3B82F6') : 'transparent' }}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={{ fontWeight: '600', color: activeTab === 'orders' ? (theme.colors.primary?.[500] || '#3B82F6') : (theme.colors.text?.muted || '#6B7280') }}>
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ backgroundColor: theme.colors.background?.secondary || '#fff', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>
            {activeTab === 'invoices' 
              ? 'Invoices are generated after quotation acceptance and delivery confirmation.'
              : 'Purchase orders show your accepted work orders.'}
          </Text>
        </View>

        {activeTab === 'invoices' ? (
          // Invoices List
          <>
            {invoices.map(inv => (
              <View key={inv._id} style={{ backgroundColor: theme.colors.background?.secondary || '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', color: theme.colors.text?.primary || '#111827' }}>
                    {inv.invoiceNumber || `Invoice #${inv._id?.slice(-6)}`}
                  </Text>
                  <View style={{ backgroundColor: getStatusColor(inv.status) + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: getStatusColor(inv.status), fontWeight: '600', fontSize: 12 }}>
                      {inv.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: theme.colors.text?.secondary || '#6B7280', marginTop: 4 }}>
                  {inv.project?.title || inv.purchaseOrder?.title || 'Project'}
                </Text>
                <Text style={{ fontSize: 20, fontWeight:'700', marginTop:8, color: theme.colors.text?.primary || '#111827' }}>
                  ₹{(inv.totalAmount || inv.amount || 0).toLocaleString()}
                </Text>
                <Text style={{ color: theme.colors.text?.muted || '#9CA3AF', fontSize: 12 }}>
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Date not available'}
                </Text>
                {/* Attachments count */}
                {inv.attachments?.length > 0 && (
                  <Text style={{ color: theme.colors.success?.[500] || '#10B981', fontSize: 12, marginTop: 4 }}>
                    📎 {inv.attachments.length} attachment{inv.attachments.length > 1 ? 's' : ''}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: theme.colors.secondary?.[100] || '#F3F4F6', padding:12, borderRadius: 10 }} 
                    onPress={() => setSelected({ type: 'invoice', data: inv })}
                  >
                    <Text style={{ textAlign:'center', color: theme.colors.primary?.[500] || '#3B82F6', fontWeight: '600' }}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: theme.colors.primary?.[500] || '#3B82F6', padding:12, borderRadius: 10 }} 
                    onPress={() => openUploadModal(inv)}
                    disabled={uploading}
                  >
                    <Text style={{ textAlign:'center', color: '#fff', fontWeight: '600' }}>
                      {uploading ? 'Uploading...' : '📤 Upload'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {invoices.length === 0 && (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📄</Text>
                <Text style={{ color: theme.colors.text?.muted || '#9CA3AF', textAlign: 'center' }}>
                  No invoices found
                </Text>
                <Text style={{ color: theme.colors.text?.muted || '#9CA3AF', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                  Invoices will appear here after order completion
                </Text>
              </View>
            )}
          </>
        ) : (
          // Orders List
          <>
            {orders.map(order => (
              <View key={order._id} style={{ backgroundColor: theme.colors.background?.secondary || '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', color: theme.colors.text?.primary || '#111827' }}>
                    {order.purchaseOrderNumber || `PO #${order._id?.slice(-6)}`}
                  </Text>
                  <View style={{ backgroundColor: getStatusColor(order.status === 'accepted' ? 'paid' : 'pending') + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: getStatusColor(order.status === 'accepted' ? 'paid' : 'pending'), fontWeight: '600', fontSize: 12 }}>
                      {order.status?.toUpperCase() || 'PENDING'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text?.primary || '#111827', marginTop: 4 }}>
                  {order.title || 'Untitled Order'}
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.text?.secondary || '#6B7280' }}>
                  {order.project?.title || 'Project'}
                </Text>
                <Text style={{ fontSize: 20, fontWeight:'700', marginTop:8, color: theme.colors.text?.primary || '#111827' }}>
                  ₹{(order.finalAmount || order.totalAmount || 0).toLocaleString()}
                </Text>
                <Text style={{ color: theme.colors.text?.muted || '#9CA3AF', fontSize: 12 }}>
                  {order.items?.length || 0} items • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                </Text>
                <TouchableOpacity 
                  style={{ marginTop: 12, backgroundColor: theme.colors.primary?.[500] || '#3B82F6', padding:12, borderRadius: 10 }} 
                  onPress={() => navigation.navigate('NegotiationChat', { orderId: order._id, userRole: 'vendor' })}
                >
                  <Text style={{ textAlign:'center', color: '#fff', fontWeight: '600' }}>View Order</Text>
                </TouchableOpacity>
              </View>
            ))}
            {orders.length === 0 && (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
                <Text style={{ color: theme.colors.text?.muted || '#9CA3AF', textAlign: 'center' }}>
                  No purchase orders found
                </Text>
                <Text style={{ color: theme.colors.text?.muted || '#9CA3AF', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                  Orders will appear here when assigned to you
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)' }}>
          <View style={{ width:'90%', backgroundColor:'#fff', borderRadius: 14, padding: 16, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize:18, fontWeight:'700', color: theme.colors.text?.primary || '#111827' }}>
                {selected?.type === 'invoice' ? 'Invoice Details' : 'Order Details'}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 24, color: theme.colors.text?.muted || '#9CA3AF' }}>×</Text>
              </TouchableOpacity>
            </View>
            {selected?.type === 'invoice' ? (
              <>
                <View style={{ backgroundColor: theme.colors.background?.primary || '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>Invoice: {selected.data?.invoiceNumber || 'N/A'}</Text>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Project: {selected.data?.project?.title || selected.data?.purchaseOrder?.title || 'N/A'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Amount:</Text>
                  <Text style={{ fontWeight: '700', fontSize: 18 }}>₹{(selected.data?.totalAmount || selected.data?.amount || 0).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Status:</Text>
                  <Text style={{ fontWeight: '600', color: getStatusColor(selected.data?.status) }}>{selected.data?.status?.toUpperCase() || 'Pending'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Date:</Text>
                  <Text>{selected.data?.createdAt ? new Date(selected.data.createdAt).toLocaleDateString() : 'N/A'}</Text>
                </View>
                {/* Attachments Section */}
                {selected.data?.attachments?.length > 0 && (
                  <View style={{ marginTop: 8, marginBottom: 12 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 8, color: theme.colors.text?.primary || '#111827' }}>
                      📎 Uploaded Documents ({selected.data.attachments.length})
                    </Text>
                    <ScrollView style={{ maxHeight: 150 }}>
                      {selected.data.attachments.map((att, index) => (
                        <View key={att._id || index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background?.primary || '#F8F9FA', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                          <TouchableOpacity 
                            style={{ flex: 1 }}
                            onPress={() => {
                              if (att.url) Linking.openURL(att.url);
                            }}
                          >
                            <Text style={{ fontWeight: '500', color: theme.colors.primary?.[500] || '#3B82F6' }} numberOfLines={1}>
                              {att.originalName || att.filename}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.colors.text?.muted || '#9CA3AF' }}>
                              {att.mimeType?.includes('pdf') ? '📄 PDF' : '🖼️ Image'} • {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'File'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => deleteAttachment(selected.data._id, att._id, att.originalName || att.filename)}
                            style={{ padding: 8 }}
                          >
                            <Text style={{ color: theme.colors.error?.[500] || '#EF4444', fontSize: 18 }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={{ backgroundColor: theme.colors.background?.primary || '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>Order: {selected?.data?.purchaseOrderNumber || 'N/A'}</Text>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Project: {selected?.data?.project?.title || 'N/A'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Amount:</Text>
                  <Text style={{ fontWeight: '700', fontSize: 18 }}>₹{(selected?.data?.finalAmount || selected?.data?.totalAmount || 0).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Status:</Text>
                  <Text style={{ fontWeight: '600' }}>{selected?.data?.status?.toUpperCase() || 'Pending'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: theme.colors.text?.secondary || '#6B7280' }}>Items:</Text>
                  <Text>{selected?.data?.items?.length || 0} materials</Text>
                </View>
              </>
            )}
            <Text style={{ marginTop:8, marginBottom: 16, color: theme.colors.text?.muted || '#9CA3AF', fontSize: 13 }}>
              This is a read-only document. For any changes, contact admin.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.colors.secondary?.[100] || '#F3F4F6', padding:12, borderRadius:12 }} 
                onPress={() => setSelected(null)}
              >
                <Text style={{ textAlign:'center', color: theme.colors.text?.secondary || '#6B7280', fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.colors.primary?.[500] || '#3B82F6', padding:12, borderRadius:12 }} 
                onPress={() => {
                  if (selected?.data?.documentUrl) {
                    Linking.openURL(selected.data.documentUrl);
                  } else {
                    Alert.alert('Info', 'Document download not available');
                  }
                }}
              >
                <Text style={{ textAlign:'center', color:'#fff', fontWeight: '600' }}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload File Type Selection Modal */}
      <Modal visible={uploadModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: theme.colors.text?.primary || '#111827', textAlign: 'center' }}>
              Upload Invoice Document
            </Text>
            <Text style={{ color: theme.colors.text?.secondary || '#6B7280', textAlign: 'center', marginBottom: 20 }}>
              Choose file type to upload for {selectedInvoiceForUpload?.invoiceNumber || 'this invoice'}
            </Text>

            <TouchableOpacity 
              style={{ 
                backgroundColor: theme.colors.primary?.[500] || '#3B82F6', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={pickDocument}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>📄</Text>
              <View>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Upload PDF</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Invoice document or bill</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ 
                backgroundColor: theme.colors.success?.[500] || '#10B981', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={pickImage}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🖼️</Text>
              <View>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Upload Image</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Photo of invoice or receipt</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ 
                backgroundColor: theme.colors.secondary?.[100] || '#F3F4F6', 
                padding: 14, 
                borderRadius: 12,
              }}
              onPress={() => {
                setUploadModalVisible(false);
                setSelectedInvoiceForUpload(null);
              }}
            >
              <Text style={{ color: theme.colors.text?.secondary || '#6B7280', fontWeight: '600', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading overlay during upload */}
      {uploading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3B82F6'} />
            <Text style={{ marginTop: 12, fontWeight: '600', color: theme.colors.text?.primary || '#111827' }}>
              Uploading document...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}