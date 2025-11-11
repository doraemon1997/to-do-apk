import React, { useEffect, useState } from 'react';
import { AnimatedScreen } from '../src/components/AnimatedScreen';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  GestureResponderEvent,
  PanResponderGestureState,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskItem } from '../src/components/TaskItem';
import AddTaskModal from '../src/components/AddTaskModal';
import { Task } from '../src/types/task';
import NotificationsUtil from '../src/utils/notifications';
import { StatusBar } from 'expo-status-bar';
import { router, useNavigation } from 'expo-router';

const STORAGE_KEY = '@todo_tasks';

// Helper to parse YYYY-MM-DD as local date (no UTC offset)
function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const navigation = useNavigation() as any;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (
        _event: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const { dx } = gestureState;
        const threshold = 50;
        if (dx > threshold) {
          // Swiped right: go to past week
          navigation.jumpTo('past');
        } else if (dx < -threshold) {
          // Swiped left: go to week
          navigation.jumpTo('week');
        }
      },
    })
  ).current;

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsed: Task[] = JSON.parse(savedTasks);
        setTasks(parsed);
        // Ensure notifications are scheduled for existing tasks
        parsed.forEach(t => {
          NotificationsUtil.scheduleNotificationsForTask(t).catch(() => {});
        });
        // Schedule daily summary if needed
        const todayString = getTodayString();
        const countToday = parsed.filter(t => t.dueDate === todayString).length;
        NotificationsUtil.scheduleDailySummaryIfNeeded(countToday > 0, `You have ${countToday} tasks today`).catch(() => {});
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      // Update daily summary scheduling based on whether there are tasks for today
      const todayString = getTodayString();
      const hasTasksToday = newTasks.some(t => t.dueDate === todayString);
      // Build a short summary text
      const countToday = newTasks.filter(t => t.dueDate === todayString).length;
      const highCount = newTasks.filter(t => t.dueDate === todayString && t.priority === 'high').length;
      const summaryText = `You have ${countToday} tasks today (${highCount} high priority).`;
      NotificationsUtil.scheduleDailySummaryIfNeeded(hasTasksToday, summaryText).catch(() => {});
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks');
    }
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    saveTasks(newTasks);
    // Schedule notifications for the new task (if applicable)
    NotificationsUtil.scheduleNotificationsForTask(newTask).catch(() => {});
  };

  const handleEditTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;

    const newTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, ...taskData }
        : task
    );

    setTasks(newTasks);
    saveTasks(newTasks);
    setEditingTask(undefined);
    // Reschedule notifications for the edited task
    const edited = { ...editingTask, ...taskData } as Task;
    NotificationsUtil.scheduleNotificationsForTask(edited).catch(() => {});
  };

  const handleToggleTask = (id: string) => {
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveTasks(newTasks);
    // If task was marked completed, cancel its notifications; if unmarked, reschedule
    const toggled = tasks.find(t => t.id === id);
    if (toggled) {
      const nowCompleted = !toggled.completed;
      if (nowCompleted) {
        NotificationsUtil.cancelNotificationsForTask(id).catch(() => {});
      } else {
        // reschedule
        const updated = { ...toggled, completed: false } as Task;
        NotificationsUtil.scheduleNotificationsForTask(updated).catch(() => {});
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            NotificationsUtil.cancelNotificationsForTask(id).catch(() => {});
            const newTasks = tasks.filter((task) => task.id !== id);
            setTasks(newTasks);
            saveTasks(newTasks);
          },
        },
      ]
    );
  };

  // Sort tasks by date first, then by priority for same day
  // Filter tasks for today
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();
  const todayDate = parseLocalDate(todayString);

  const todayTasks = tasks.filter(task => {
    const taskDate = parseLocalDate(task.dueDate);
    return (
      taskDate.getFullYear() === todayDate.getFullYear() &&
      taskDate.getMonth() === todayDate.getMonth() &&
      taskDate.getDate() === todayDate.getDate()
    );
  });

  // Sort today's tasks by priority
  const sortedTasks = [...todayTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Get the next upcoming high priority task
  const nextHighPriorityTask = tasks
    .filter(task => !task.completed && task.priority === 'high')
    .sort((a, b) => parseLocalDate(a.dueDate).getTime() - parseLocalDate(b.dueDate).getTime())[0];

  const highPriorityTasks = tasks.filter(task => !task.completed && task.priority === 'high');

  return (
    <AnimatedScreen style={styles.container}>
      <StatusBar style="auto" />

      <FlatList
        data={sortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={handleToggleTask}
            onEdit={(task) => {
              setEditingTask(task);
              setModalVisible(true);
            }}
            onDelete={handleDeleteTask}
          />
        )}
        style={styles.list}
        {...panResponder.panHandlers}
      />

      {nextHighPriorityTask && (
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/high-priority',
              params: { tasks: JSON.stringify(highPriorityTasks) }
            });
          }}
          style={styles.highPriorityCard}
        >
          <View>
            <Text style={styles.cardTitle}>Next High Priority Task</Text>
            <Text style={styles.cardTaskTitle}>{nextHighPriorityTask.title}</Text>
            <Text style={styles.cardDate}>
              Due: {parseLocalDate(nextHighPriorityTask.dueDate).toLocaleDateString()}
            </Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingTask(undefined);
          setModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(undefined);
        }}
        onSave={editingTask ? handleEditTask : handleAddTask}
        editingTask={editingTask}
      />
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  highPriorityCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4B4B',
    marginBottom: 4,
  },
  cardTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#757575',
  },
});
