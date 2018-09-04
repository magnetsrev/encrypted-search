import { request } from '../helper/idb'
import sizeof from '../helper/sizeof'

/**
 * Enhance a key-value store with encryption.
 * @param {key-value store} store
 * @param {Function} hash
 * @param {Function} encrypt
 * @param {Function} decrypt
 * @returns {Object}
 */
export const withEncryption = (store = {}, { hash, encrypt, decrypt }) => {
    return {
        ...store,
        set: (key, value, tx) => {
            return store.set(hash(key), encrypt(key, value), tx)
        },
        get: async (key, tx) => {
            const encryptedValue = await store.get(hash(key), tx)
            return decrypt(key, encryptedValue)
        },
        remove: (key, tx) => {
            return store.remove(hash(key), tx)
        }
    }
}

/**
 * Create a idb key-value store with transaction support.
 * @param {String} tableName
 * @returns {Object}
 */
export default (tableName = '') => {
    return {
        count: (tx) => {
            return request(tx.objectStore(tableName).count())
        },
        size: (tx) => {
            let size = 0
            return new Promise((resolve, reject) => {
                const request = tx.objectStore(tableName).openCursor()
                request.onerror = () => reject(request.error)
                request.onsuccess = (event) => {
                    const cursor = event.target.result
                    if (!cursor) {
                        return resolve(size)
                    }
                    size += sizeof(cursor.value) + sizeof(cursor.key)
                    cursor.continue()
                }
            })
        },
        set: (key = '', value, tx) => {
            return tx.objectStore(tableName).put(value, key)
        },
        get: (key = '', tx) => {
            return request(tx.objectStore(tableName).get(key))
        },
        remove: (key = '', tx) => {
            return tx.objectStore(tableName).delete(key)
        },
        clear: (tx) => {
            return tx.objectStore(tableName).clear()
        }
    }
}
