import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Text, Alert, GestureResponderEvent, PanResponderGestureState, PanResponder } from 'react-native';
import { AnimatedScreen } from '../src/components/AnimatedScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskItem } from '../src/components/TaskItem';
import { Task } from '../src/types/task';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';

const STORAGE_KEY = '@todo_tasks';

export default function PastTasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
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
          // Swiped right: go to week
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
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };


  // Helper to parse YYYY-MM-DD as local date (no UTC offset)
  function parseLocalDate(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Get the last 7 days (excluding today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

  // Filter tasks for the past 7 days (excluding today)
  const pastTasks = tasks.filter(task => {
    const taskDate = parseLocalDate(task.dueDate);
    return taskDate < today && taskDate >= sevenDaysAgo;
  }).sort((a, b) => parseLocalDate(b.dueDate).getTime() - parseLocalDate(a.dueDate).getTime());

  return (
    <AnimatedScreen style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.header}>Past 7 Days Tasks</Text>
      <FlatList
        data={pastTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            readonly
          />
        )}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No tasks in the past 7 days.</Text>}
        {...panResponder.panHandlers}
      />
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
});
