import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
} from 'react-native';
import { AnimatedScreen } from './components/AnimatedScreen';
import { useLocalSearchParams, Stack } from 'expo-router';
import { TaskItem } from './components/TaskItem';
import { Task } from './types/task';

export default function HighPriority() {
  const { tasks: tasksParam } = useLocalSearchParams();
  const tasks: Task[] = typeof tasksParam === 'string' ? JSON.parse(tasksParam) : [];

  // Sort high priority tasks by date
  const sortedTasks = [...tasks]
    .filter(task => task.priority === 'high' && !task.completed)
    .sort((a, b) => {
      const [ay, am, ad] = a.dueDate.split('-').map(Number);
      const [by, bm, bd] = b.dueDate.split('-').map(Number);
      return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
    });

  return (
    <>
      <Stack.Screen options={{ title: 'High Priority Tasks' }} />
      <AnimatedScreen style={styles.container}>
        {sortedTasks.length > 0 ? (
          <FlatList
            data={sortedTasks}
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
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No high priority tasks</Text>
          </View>
        )}
      </AnimatedScreen>
    </>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});