import { db, delay, persist } from '@/mocks/db'
import { currentUser } from './scope'

export const notificationsService = {
  async list() {
    const user = currentUser()
    return delay(db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 100, 250)
  },

  async markRead(ids: string[]) {
    const user = currentUser()
    const now = new Date().toISOString()
    for (const n of db.notifications) if (n.userId === user.id && ids.includes(n.id) && !n.readAt) n.readAt = now
    persist()
    return delay(ids, 80, 150)
  },

  async markAllRead() {
    const user = currentUser()
    const now = new Date().toISOString()
    for (const n of db.notifications) if (n.userId === user.id && !n.readAt) n.readAt = now
    persist()
    return delay(true, 80, 150)
  },
}
