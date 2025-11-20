/**
 * IndexedDB 图片缓存管理
 * 用于存储随机背景图片
 */

const DB_NAME = 'RandomImageCache'
const DB_VERSION = 1
const STORE_NAME = 'images'

export interface ImageRecord {
  id: number;
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageDB {
  private db: IDBDatabase | null = null

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('无法打开 IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true, 
          })
          
          // 创建索引
          objectStore.createIndex('url', 'url', { unique: true })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * 添加图片到数据库
   */
  async addImage(url: string, blob: Blob): Promise<number> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      
      const record: Omit<ImageRecord, 'id'> = {
        url,
        blob,
        timestamp: Date.now(),
      }

      const request = objectStore.add(record)

      request.onsuccess = () => {
        resolve(request.result as number)
      }

      request.onerror = () => {
        reject(new Error('添加图片失败'))
      }
    })
  }

  /**
   * 检查 URL 是否已存在
   */
  async hasUrl(url: string): Promise<boolean> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('url')
      
      const request = index.getKey(url)

      request.onsuccess = () => {
        resolve(request.result !== undefined)
      }

      request.onerror = () => {
        reject(new Error('检查 URL 失败'))
      }
    })
  }

  /**
   * 获取所有图片 URL
   */
  async getAllUrls(): Promise<string[]> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const records = request.result as ImageRecord[]
        const urls = records.map(record => record.url)
        resolve(urls)
      }

      request.onerror = () => {
        reject(new Error('获取 URL 列表失败'))
      }
    })
  }

  /**
   * 获取所有图片记录
   */
  async getAllRecords(): Promise<ImageRecord[]> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      
      const request = objectStore.getAll()

      request.onsuccess = () => {
        resolve(request.result as ImageRecord[])
      }

      request.onerror = () => {
        reject(new Error('获取记录失败'))
      }
    })
  }

  /**
   * 根据 URL 获取图片 Blob
   */
  async getImageByUrl(url: string): Promise<Blob | null> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('url')
      
      const request = index.get(url)

      request.onsuccess = () => {
        const record = request.result as ImageRecord | undefined
        resolve(record ? record.blob : null)
      }

      request.onerror = () => {
        reject(new Error('获取图片失败'))
      }
    })
  }

  /**
   * 获取数据库中的图片数量
   */
  async getCount(): Promise<number> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      
      const request = objectStore.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('获取数量失败'))
      }
    })
  }

  /**
   * 删除最旧的图片
   */
  async deleteOldest(): Promise<void> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('timestamp')
      
      // 获取最旧的记录
      const request = index.openCursor()

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          resolve()
        } else {
          resolve()
        }
      }

      request.onerror = () => {
        reject(new Error('删除失败'))
      }
    })
  }

  /**
   * 批量删除最旧的 N 张图片
   * @param count 要删除的图片数量
   */
  async deleteOldestBatch(count: number): Promise<number> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const index = objectStore.index('timestamp')
      
      let deletedCount = 0
      const request = index.openCursor()

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor && deletedCount < count) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => {
        reject(new Error('批量删除失败'))
      }
    })
  }

  /**
   * 清空所有图片
   */
  async clear(): Promise<void> {
    if (!this.db) {await this.init()}

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      
      const request = objectStore.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('清空失败'))
      }
    })
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 导出单例
export const imageDB = new ImageDB()

