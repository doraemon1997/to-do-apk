import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '../types/task';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  editingTask?: Task;
}

export const AddTaskModal = ({ visible, onClose, onSave, editingTask }: AddTaskModalProps) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    if (editingTask?.dueDate) {
      return editingTask.dueDate;
    }
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const year = normalizedToday.getFullYear();
    const month = String(normalizedToday.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedToday.getDate()).padStart(2, '0');
    const initialDate = `${year}-${month}-${day}`;
    console.log('Initial date set to:', initialDate); // For debugging
    return initialDate;
  });
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(editingTask?.priority || 'medium');
  const [time, setTime] = useState<string | null>(editingTask?.time ?? null);

  // Helper to parse YYYY-MM-DD as local date (no UTC offset)
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sync with editingTask when modal opens or editingTask changes
  useEffect(() => {
    if (visible) {
      if (editingTask) {
        setTitle(editingTask.title || '');
        setDueDate(editingTask.dueDate || getTodayString());
        setPriority(editingTask.priority || 'medium');
        setTime(editingTask.time ?? null);
      } else {
        setTitle('');
        setDueDate(getTodayString());
        setPriority('medium');
        setTime(null);
      }
    }
  }, [visible, editingTask]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a task title');
      return;
    }

    // Basic date format validation
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    try {
  const selectedDate = parseLocalDate(dueDate);
      // Check if it's a valid date
      if (selectedDate.toString() === 'Invalid Date') {
        Alert.alert('Invalid Date', 'Please enter a valid date');
        return;
      }

  // Compare dates without time using local parsing
  const todayLocal = parseLocalDate(getTodayString());
  const selectedLocal = parseLocalDate(dueDate);

  // Only warn if the date is in the past
  if (selectedLocal.getTime() < todayLocal.getTime()) {
        Alert.alert(
          'Past Date Selected',
          'The selected date is in the past. Are you sure you want to continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => saveTask(),
            },
          ]
        );
      } else {
        // Date is today or in the future, proceed with save
        saveTask();
      }
    } catch (e) {
      Alert.alert('Invalid Date', 'Please enter a valid date');
    }
  };

  const saveTask = () => {
    onSave({
      title: title.trim(),
      completed: editingTask?.completed || false,
      priority,
      dueDate,
      time: time ?? null,
    });

    setTitle('');
    setDueDate(getTodayString());
    setPriority('medium');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Task title"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#007AFF" style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {parseLocalDate(dueDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={parseLocalDate(dueDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event: any, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (!selectedDate) return;
                  const year = selectedDate.getFullYear();
                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(selectedDate.getDate()).padStart(2, '0');
                  const newDate = `${year}-${month}-${day}`;
                  setDueDate(newDate);
                }}
              />
            )}
          </View>

          <View style={styles.dateContainer}>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialIcons name="access-time" size={20} color="#007AFF" style={styles.dateIcon} />
              <Text style={styles.dateText}>
                {time ? time : 'No time set'}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  if (time) {
                    const [hh, mm] = time.split(':').map(Number);
                    const d = new Date();
                    d.setHours(hh, mm, 0, 0);
                    return d;
                  }
                  return new Date();
                })()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: any, selectedDate?: Date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (!selectedDate) return;
                  const hh = String(selectedDate.getHours()).padStart(2, '0');
                  const mm = String(selectedDate.getMinutes()).padStart(2, '0');
                  setTime(`${hh}:${mm}`);
                }}
              />
            )}
          </View>

          <View style={styles.priorityContainer}>
            <Text style={styles.priorityLabel}>Priority:</Text>
            <View style={styles.priorityButtons}>
              {(['high', 'medium', 'low'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonSelected,
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p && styles.priorityButtonTextSelected,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateContainer: {
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  priorityButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    textAlign: 'center',
    color: '#333',
  },
  priorityButtonTextSelected: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 100,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  saveButtonText: {
    color: 'white',
  },
});