import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    FlatList,
    TextInput,
    LayoutAnimation,
    Platform,
    UIManager,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const ReceivablesScreen = ({ navigation }) => {
    const [receivables, setReceivables] = useState([]);
    const [filteredReceivables, setFilteredReceivables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [filterType, setFilterType] = useState('all'); // all, overdue, pending

    const fetchData = async () => {
        try {
            const data = await api.getReceivables();
            setReceivables(data);
            setFilteredReceivables(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        let result = receivables;

        // Search Filter
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(item => 
                item.projectName.toLowerCase().includes(lowerSearch) ||
                item.clientName.toLowerCase().includes(lowerSearch)
            );
        }

        // Status Filter
        if (filterType !== 'all') {
            result = result.filter(item => item.status === filterType);
        }

        setFilteredReceivables(result);
    }, [search, filterType, receivables]);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const totalOutstanding = receivables
        .filter(r => r.status !== 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0);
        
    const totalOverdue = receivables
        .filter(r => r.status === 'overdue')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const renderItem = ({ item }) => {
        const isExpanded = expandedId === item._id;
        const isOverdue = item.status === 'overdue';
        const isPaid = item.status === 'paid';

        return (
            <View style={[styles.card, isOverdue && styles.cardOverdue]}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item._id)}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.prjTitle}>{item.projectName}</Text>
                        <Text style={styles.clientName}>{item.clientName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.amount, isPaid && { color: '#4CAF50' }]}>
                            ${item.amount.toLocaleString()}
                        </Text>
                        <View style={styles.statusRow}>
                            {isOverdue && <Text style={styles.statusOverdue}>🔴 Overdue</Text>}
                            {isPaid && <Text style={styles.statusPaid}>✅ Paid</Text>}
                            {!isOverdue && !isPaid && <Text style={styles.statusPending}>⏳ Due Soon</Text>}
                        </View>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.cardDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Due Date:</Text>
                            <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Invoice ID:</Text>
                            <Text style={styles.detailValue}>{item._id.toUpperCase()}</Text>
                        </View>
                        
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="call-outline" size={18} color="#333" />
                                <Text style={styles.actionText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="mail-outline" size={18} color="#333" />
                                <Text style={styles.actionText}>Remind</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#333' }]}>
                                <Text style={[styles.actionText, { color: '#fff' }]}>View Invoice</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#333" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <AdminNavbar title="Receivables" navigation={navigation} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Receivables</Text>
                <TouchableOpacity onPress={() => {
                    // Cycle filters for demo
                    if (filterType === 'all') setFilterType('overdue');
                    else if (filterType === 'overdue') setFilterType('pending');
                    else setFilterType('all');
                }}>
                    <Ionicons name="filter" size={24} color={filterType !== 'all' ? '#D32F2F' : '#333'} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Client or Project..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>TOTAL OUTSTANDING</Text>
                    <Text style={styles.summaryValue}>${totalOutstanding.toLocaleString()}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: '#D32F2F' }]}>OVERDUE</Text>
                    <Text style={[styles.summaryValue, { color: '#D32F2F' }]}>${totalOverdue.toLocaleString()}</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredReceivables}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{ color: '#999' }}>No receivables found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eee'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 15
    },
    summaryContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center'
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#eee'
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 4,
        letterSpacing: 0.5
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1
    },
    cardOverdue: {
        borderColor: '#FFEBEE',
        backgroundColor: '#FFFBFB'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16
    },
    prjTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    clientName: {
        fontSize: 14,
        color: '#666'
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    statusOverdue: {
        fontSize: 12,
        color: '#D32F2F',
        fontWeight: '600'
    },
    statusPaid: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600'
    },
    statusPending: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: '600'
    },
    cardDetails: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#fafafa',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12
    },
    detailLabel: {
        fontSize: 14,
        color: '#888'
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        flex: 0.3
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4
    }
});

export default ReceivablesScreen;
