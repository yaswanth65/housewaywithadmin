import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';

const ProjectDetailsScreen = ({ route, navigation }) => {
  const { projectId } = route.params || {};
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const loadProjectData = async () => {
    try {
      const allProjects = await api.getProjects();
      const foundProject = allProjects.find(p => p._id === projectId) || allProjects[0];
      setProject(foundProject);

      // Get all tasks and filter for this project
      const allTasks = await api.getTasks();
      setTasks(allTasks.filter(t => t.project === projectId).slice(0, 10));

      // Get team members (employees assigned to project)
      const allUsers = await api.getUsers('employee');
      setTeam(allUsers.slice(0, 5)); // Mock: first 5 employees

    } catch (error) {
      console.error("Failed to load project details", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        loadProjectData();
      }
    }, [projectId])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusConfig = (status, priority) => {
    if (priority === 'high' || status === 'planning') {
      return { emoji: '🔴', text: 'DELAYED', color: '#D32F2F' };
    }
    if (status === 'on-hold') {
      return { emoji: '🟡', text: 'ON HOLD', color: '#FBC02D' };
    }
    if (status === 'completed') {
      return { emoji: '✅', text: 'COMPLETED', color: '#4CAF50' };
    }
    return { emoji: '🟢', text: 'ON TRACK', color: '#4CAF50' };
  };

  const calculateProgress = () => {
    if (project.status === 'completed') return 100;
    if (project.status === 'in-progress') return Math.floor(Math.random() * 40) + 40;
    return Math.floor(Math.random() * 30) + 10;
  };

  const calculateDaysLeft = () => {
    if (!project.endDate) return 'N/A';
    const end = new Date(project.endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days left` : `${Math.abs(diff)} days overdue`;
  };

  const statusConfig = getStatusConfig(project.status, project.priority);
  const progress = calculateProgress();
  const daysLeft = calculateDaysLeft();

  const phases = [
    { id: 1, name: 'Phase 1: Design', status: 'completed', startDate: 'Oct 15', endDate: 'Nov 10' },
    { id: 2, name: 'Phase 2: Foundation', status: 'completed', startDate: 'Nov 11', endDate: 'Dec 05' },
    { id: 3, name: 'Phase 3: Structure', status: 'in-progress', startDate: 'Dec 06', endDate: 'Jan 15', issue: 'Material delay' },
    { id: 4, name: 'Phase 4: Finishing', status: 'upcoming', startDate: 'Jan 16', endDate: 'Feb 20' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.projectTitle} numberOfLines={2}>
        {project.type === 'residential' ? '🏠' : '🏢'} {project.title}
      </Text>
      
      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '30' }]}>
        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
        <Text style={[styles.statusText, { color: statusConfig.color }]}>
          {statusConfig.emoji} {statusConfig.text}
        </Text>
      </View>

      <Text style={styles.dueDateText}>
        Due: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'} • {daysLeft}
      </Text>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: statusConfig.color }]} />
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', label: 'OVERVIEW', icon: 'grid-outline' },
        { id: 'tasks', label: 'TASKS', icon: 'checkbox-outline' },
        { id: 'team', label: 'TEAM', icon: 'people-outline' }
      ].map((tab) => (
        <TouchableOpacity 
          key={tab.id}
          style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons 
            name={tab.icon} 
            size={18} 
            color={activeTab === tab.id ? '#1976D2' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Milestone Timeline */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📍 MILESTONE TIMELINE</Text>
          <TouchableOpacity>
            <Text style={styles.cardAction}>View Gantt →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timelineContainer}>
          {phases.map((phase, index) => (
            <View key={phase.id} style={styles.phaseContainer}>
              <View style={styles.phaseIconContainer}>
                {phase.status === 'completed' && (
                  <View style={[styles.phaseIcon, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
                {phase.status === 'in-progress' && (
                  <View style={[styles.phaseIcon, { backgroundColor: '#1976D2' }]}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                {phase.status === 'upcoming' && (
                  <View style={[styles.phaseIcon, { backgroundColor: '#E0E0E0' }]}>
                    <Text style={{ fontSize: 12 }}>○</Text>
                  </View>
                )}
                {index < phases.length - 1 && (
                  <View style={styles.phaseConnector} />
                )}
              </View>

              <View style={styles.phaseContent}>
                <Text style={styles.phaseName}>{phase.name}</Text>
                <Text style={styles.phaseDates}>
                  {phase.startDate} - {phase.endDate}
                </Text>
                {phase.status === 'in-progress' && (
                  <Text style={styles.phaseCurrentTag}>▶ Current Stage</Text>
                )}
                {phase.issue && (
                  <View style={styles.phaseIssue}>
                    <Ionicons name="alert-circle" size={14} color="#D32F2F" />
                    <Text style={styles.phaseIssueText}>⚠️ {phase.issue}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Financial Snapshot */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💰 FINANCIAL SNAPSHOT</Text>
        
        <View style={styles.budgetGrid}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budgetAmount}>
              ₹{project.budget?.estimated?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Used</Text>
            <Text style={[styles.budgetAmount, { color: '#FBC02D' }]}>
              ₹{Math.floor((project.budget?.estimated || 0) * 0.6).toLocaleString()}
            </Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>Remaining</Text>
            <Text style={[styles.budgetAmount, { color: '#4CAF50' }]}>
              ₹{Math.floor((project.budget?.estimated || 0) * 0.4).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.budgetBar}>
          <View style={styles.budgetBarFill} />
        </View>
        <Text style={styles.budgetNote}>📉 60% Used (Healthy)</Text>

        <TouchableOpacity 
          style={styles.invoiceLink}
          onPress={() => navigation.navigate('Finance', { screen: 'Invoices' })}
        >
          <Text style={styles.invoiceLinkText}>📄 Invoices: 2 Paid, 1 Overdue</Text>
          <Ionicons name="chevron-forward" size={16} color="#1976D2" />
        </TouchableOpacity>
      </View>

      {/* Project Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 PROJECT DETAILS</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="location" size={18} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {project.location?.city}, {project.location?.state}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="person" size={18} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Client</Text>
            <Text style={styles.detailValue}>{project.client || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={18} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {project.startDate && project.endDate ? 
                `${Math.ceil((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24))} days` 
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="build" size={18} color="#666" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{project.type || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTasks = () => (
    <View style={styles.tabContent}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskHeaderTitle}>Tasks ({tasks.length})</Text>
        <TouchableOpacity 
          style={styles.addTaskBtn}
          onPress={() => Alert.alert('Add Task', 'Task creation coming soon!')}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addTaskText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterChips}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={[styles.filterChipText, styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>My Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterChipText}>Blocked</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Group by phase */}
        <Text style={styles.taskGroupTitle}>▼ PHASE 3: STRUCTURE</Text>
        
        {tasks.slice(0, 3).map((task, idx) => (
          <TouchableOpacity key={task._id || idx} style={styles.taskCard}>
            <View style={styles.taskLeft}>
              <TouchableOpacity 
                style={[
                  styles.taskCheckbox,
                  task.status === 'completed' && styles.taskCheckboxChecked
                ]}
                onPress={() => Alert.alert('Task', 'Mark as complete?')}
              >
                {task.status === 'completed' && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </TouchableOpacity>
              
              <View style={styles.taskInfo}>
                <Text style={[
                  styles.taskTitle,
                  task.status === 'completed' && styles.taskTitleCompleted
                ]}>
                  {task.priority === 'high' && '🛑 '}
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <Ionicons name="person" size={12} color="#888" />
                  <Text style={styles.taskMetaText}>{task.assignee || 'Unassigned'}</Text>
                  {task.dueDate && (
                    <>
                      <Text style={styles.taskMetaDot}>•</Text>
                      <Text style={styles.taskMetaText}>
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {task.priority === 'high' && (
              <View style={styles.taskPriorityBadge}>
                <Text style={styles.taskPriorityText}>HIGH</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.taskGroupTitle, { marginTop: 24 }]}>▼ PHASE 4: FINISHING</Text>
        
        {tasks.slice(3, 5).map((task, idx) => (
          <TouchableOpacity key={task._id || idx} style={styles.taskCard}>
            <View style={styles.taskLeft}>
              <View style={styles.taskCheckbox}>
                <Text style={{ fontSize: 10 }}>○</Text>
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <Ionicons name="person" size={12} color="#888" />
                  <Text style={styles.taskMetaText}>Unassigned</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTeam = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.teamHeader}>
        <Text style={styles.teamHeaderTitle}>Project Team ({team.length})</Text>
        <TouchableOpacity 
          style={styles.inviteBtn}
          onPress={() => Alert.alert('Invite', 'Team invitation coming soon!')}
        >
          <Ionicons name="person-add" size={16} color="#1976D2" />
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.teamSectionTitle}>MANAGER</Text>
        <View style={styles.memberCard}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>AD</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>Admin Owner (You)</Text>
            <Text style={styles.memberRole}>Project Manager</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.teamSectionTitle}>TEAM MEMBERS</Text>
        {team.map((member, idx) => (
          <View key={member._id || idx} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {member.firstName?.[0]}{member.lastName?.[0]}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.firstName} {member.lastName}
              </Text>
              <Text style={styles.memberRole}>
                {member.employeeDetails?.position || 'Team Member'} • {tasks.filter(t => t.assignee === member.firstName).length} Tasks
              </Text>
            </View>
            <View style={styles.memberActions}>
              <TouchableOpacity style={styles.memberActionBtn}>
                <Ionicons name="call" size={18} color="#1976D2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.memberActionBtn}>
                <Ionicons name="chatbubble" size={18} color="#1976D2" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.teamSectionTitle}>CLIENT POC</Text>
        <View style={styles.memberCard}>
          <View style={styles.memberAvatar}>
            <Ionicons name="person" size={20} color="#666" />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>Client Representative</Text>
            <Text style={styles.memberRole}>Point of Contact</Text>
          </View>
          <TouchableOpacity style={styles.emailBtn}>
            <Ionicons name="mail" size={18} color="#1976D2" />
            <Text style={styles.emailBtnText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      {renderHeader()}
      {renderTabs()}
      <View style={styles.contentContainer}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'team' && renderTeam()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20
  },
  backButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  header: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  dueDateText: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 16
  },
  progressSection: {
    marginTop: 8
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  progressLabel: {
    color: '#aaa',
    fontSize: 12
  },
  progressPercent: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 12,
    gap: 6
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderColor: '#1976D2'
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600'
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: 'bold'
  },
  contentContainer: {
    flex: 1
  },
  tabContent: {
    flex: 1,
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5
  },
  cardAction: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600'
  },
  timelineContainer: {
    marginTop: 8
  },
  phaseContainer: {
    flexDirection: 'row',
    marginBottom: 24
  },
  phaseIconContainer: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative'
  },
  phaseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  phaseConnector: {
    position: 'absolute',
    top: 32,
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0'
  },
  phaseContent: {
    flex: 1,
    paddingTop: 4
  },
  phaseName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  phaseDates: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  phaseCurrentTag: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: 'bold',
    marginTop: 4
  },
  phaseIssue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    gap: 6
  },
  phaseIssueText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600'
  },
  budgetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center'
  },
  budgetLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  budgetDivider: {
    width: 1,
    backgroundColor: '#E0E0E0'
  },
  budgetBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  budgetBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#FBC02D',
    borderRadius: 4
  },
  budgetNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12
  },
  invoiceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  invoiceLinkText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12
  },
  detailContent: {
    flex: 1
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  taskHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  addTaskText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  filterChips: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  filterChipActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2'
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: '#fff'
  },
  taskGroupTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    letterSpacing: 0.5
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee'
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  taskCheckboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50'
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999'
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  taskMetaText: {
    fontSize: 12,
    color: '#888'
  },
  taskMetaDot: {
    fontSize: 12,
    color: '#888'
  },
  taskPriorityBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  taskPriorityText: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: 'bold'
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  teamHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1976D2',
    gap: 4
  },
  inviteBtnText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600'
  },
  teamSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    letterSpacing: 0.5
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  memberAvatarText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  },
  memberInfo: {
    flex: 1
  },
  memberName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  memberRole: {
    fontSize: 12,
    color: '#888'
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8
  },
  memberActionBtn: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    gap: 4
  },
  emailBtnText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600'
  }
});

export default ProjectDetailsScreen;
