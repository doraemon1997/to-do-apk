import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Task } from '../types/task';

const NOTIF_MAP_PREFIX = '@notif_';
const DAILY_SUMMARY_KEY = '@notif_daily_summary';

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function initNotifications() {
  if (!Device.isDevice) {
    console.warn('Must use physical device for notifications');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

async function saveNotifIdsForTask(taskId: string, ids: string[]) {
  await AsyncStorage.setItem(NOTIF_MAP_PREFIX + taskId, JSON.stringify(ids));
}

async function getNotifIdsForTask(taskId: string): Promise<string[] | null> {
  const raw = await AsyncStorage.getItem(NOTIF_MAP_PREFIX + taskId);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function cancelNotificationsForTask(taskId: string) {
  const ids = await getNotifIdsForTask(taskId);
  if (!ids) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      // ignore
    }
  }
  await AsyncStorage.removeItem(NOTIF_MAP_PREFIX + taskId);
}

export async function scheduleNotificationsForTask(task: Task) {
  // Cancel existing first
  await cancelNotificationsForTask(task.id);

  const scheduledIds: string[] = [];

  // Schedule 10-min-before notification if time is set
  if (task.time) {
    const [hh, mm] = task.time.split(':').map(Number);
    const due = parseLocalDate(task.dueDate);
    due.setHours(hh, mm, 0, 0);

    const notifyDate = new Date(due.getTime() - 10 * 60 * 1000);
    const now = new Date();
    if (notifyDate.getTime() > now.getTime()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming: ${task.title}`,
          body: `Due at ${task.time} (${task.priority} priority)`,
          data: { taskId: task.id },
        },
        // Use any to satisfy types for Date trigger
        trigger: notifyDate as any,
      });
      scheduledIds.push(id);
    }
  }

  // For high priority tasks, always send a 6:00 AM notification on the due date
  if (task.priority === 'high') {
    const dueDay = parseLocalDate(task.dueDate);
    // set to 6:00 AM
    dueDay.setHours(6, 0, 0, 0);
    const now = new Date();
    if (dueDay.getTime() > now.getTime()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `High priority: ${task.title}`,
          body: `Due today (high priority)`,
          data: { taskId: task.id },
        },
        trigger: dueDay as any,
      });
      scheduledIds.push(id);
    }
  }

  if (scheduledIds.length > 0) {
    await saveNotifIdsForTask(task.id, scheduledIds);
  }

  return scheduledIds;
}

// Daily summary: schedule recurring daily notification at 8:00 AM; we will update the content when tasks change
export async function scheduleDailySummaryIfNeeded(hasTasksToday: boolean, summaryText?: string) {
  // Cancel previous daily summary
  const existing = await AsyncStorage.getItem(DAILY_SUMMARY_KEY);
  if (existing) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing);
    } catch (e) {
      // ignore
    }
    await AsyncStorage.removeItem(DAILY_SUMMARY_KEY);
  }

  if (!hasTasksToday) return null;

  // Schedule repeating daily at 8:00 AM local
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily summary',
      body: summaryText || 'You have tasks today',
      data: { summary: true },
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    } as any,
  });

  await AsyncStorage.setItem(DAILY_SUMMARY_KEY, id);
  return id;
}

export async function cancelDailySummary() {
  const existing = await AsyncStorage.getItem(DAILY_SUMMARY_KEY);
  if (!existing) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(existing);
  } catch (e) {}
  await AsyncStorage.removeItem(DAILY_SUMMARY_KEY);
}

export default {
  initNotifications,
  scheduleNotificationsForTask,
  cancelNotificationsForTask,
  scheduleDailySummaryIfNeeded,
  cancelDailySummary,
};
