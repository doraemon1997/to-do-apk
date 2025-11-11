import React, { useEffect, useState } from 'react';
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
import { AnimatedScreen } from './_components/AnimatedScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskItem } from './_components/TaskItem';
import AddTaskModal from './_components/AddTaskModal';
import { Task } from './_types/task';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';

const STORAGE_KEY = '@todo_tasks';

export default function WeekView() {
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
          // Swiped right: go to today
          navigation.jumpTo('index');
        } else if (dx < -threshold) {
          // Swiped left: go to past
          navigation.jumpTo('past');
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
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const saveTasks = async (newTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
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
  };

  const handleEditTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;

    const newTasks = tasks.map((task) =>
      task.id === editingTask.id ? { ...task, ...taskData } : task
    );

    setTasks(newTasks);
    saveTasks(newTasks);
    setEditingTask(undefined);
  };

  const handleToggleTask = (id: string) => {
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newTasks = tasks.filter((task) => task.id !== id);
          setTasks(newTasks);
          saveTasks(newTasks);
        },
      },
    ]);
  };

  // Get start and end of current week (Monday to Sunday)
  const getWeekBounds = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Calculate how many days to subtract to get to Monday
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Convert to YYYY-MM-DD format using local date components
    const startString = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    const endString = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`;

    return { startString, endString };
  };


  // Helper to parse YYYY-MM-DD as local date (no UTC offset)
  function parseLocalDate(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const { startString, endString } = getWeekBounds();
  const startOfWeek = parseLocalDate(startString);
  const endOfWeek = parseLocalDate(endString);
    const weekTasks = tasks.filter(task => {
      const taskDate = parseLocalDate(task.dueDate);
      return (
        taskDate >= startOfWeek &&
        taskDate <= endOfWeek &&
        (task.priority === 'high' || task.priority === 'medium')
      );
    }).sort((a, b) => {
    // First sort by date
    const dateA = parseLocalDate(a.dueDate);
    const dateB = parseLocalDate(b.dueDate);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    // For same date, sort by priority
    const priorityOrder: { [key in 'high' | 'medium' | 'low']: number } = { 
      high: 0, 
      medium: 1, 
      low: 2 
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Group by ISO date string (YYYY-MM-DD) to avoid locale parsing issues
  const groupedTasks = weekTasks.reduce((acc, task) => {
    const dateKey = task.dueDate; // already YYYY-MM-DD
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const renderSectionHeader = ({ date }: { date: string }) => {
    const parsedDate = parseLocalDate(date);
    const label = parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{label}</Text>
      </View>
    );
  };

  return (
    <AnimatedScreen style={styles.container}>
      <StatusBar style="auto" />

      <FlatList
        data={Object.entries(groupedTasks)}
        keyExtractor={([date]) => date}
        renderItem={({ item: [date, dateTasks] }) => (
          <View>
            {renderSectionHeader({ date })}
            {dateTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onEdit={(task) => {
                  setEditingTask(task);
                  setModalVisible(true);
                }}
                onDelete={handleDeleteTask}
              />
            ))}
          </View>
        )}
        style={styles.list}
        {...panResponder.panHandlers}
      />

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
  sectionHeader: {
    backgroundColor: '#e1e1e1',
    padding: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});