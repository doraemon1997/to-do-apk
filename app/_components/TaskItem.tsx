import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '../_types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  readonly?: boolean;
}

export const TaskItem = ({ task, onToggle, onEdit, onDelete, readonly }: TaskItemProps) => {
  const priorityColors = {
    high: '#FF4B4B',
    medium: '#FFA726',
    low: '#4CAF50',
  };

  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <View style={[styles.container, { borderLeftColor: priorityColors[task.priority] }]}>
      {!readonly && (
        <TouchableOpacity style={styles.checkbox} onPress={() => onToggle(task.id)}>
          <MaterialIcons
            name={task.completed ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={task.completed ? '#4CAF50' : '#757575'}
          />
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.completedText]}>
          {task.title}
        </Text>
  <Text style={styles.date}>
    Due: {parseLocalDate(task.dueDate).toLocaleDateString()}
    {task.time ? ` • ${task.time}` : ''}
  </Text>
      </View>
      {!readonly && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionButton}>
            <MaterialIcons name="edit" size={20} color="#757575" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.actionButton}>
            <MaterialIcons name="delete" size={20} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  checkbox: {
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#757575',
  },
  date: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
});

export default TaskItem;
