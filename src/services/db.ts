// Lightweight IndexedDB utility for GoodTrip storage & social interactions
export interface UploadedFile {
  id: string; // Shelby Blob ID or unique local ID
  name: string;
  size: number;
  type: string;
  data: Uint8Array; // Raw file data
  isPrivate: boolean;
  encrypted?: boolean;
  uploadedAt: string;
  ownerAddress: string;
  shareableUrl?: string;
  txHash?: string;
}

export interface UserProfile {
  address: string;
  name: string;
  bio: string;
  avatar: string; // URL or emoji-based indicator
}

export interface FollowRelation {
  id: string; // followerAddress_followingAddress
  followerAddress: string;
  followingAddress: string;
}

export interface VideoLike {
  id: string; // walletAddress_videoId
  walletAddress: string;
  videoId: string;
}

export interface VideoComment {
  id: string;
  videoId: string;
  authorAddress: string;
  content: string;
  createdAt: string;
}

const DB_NAME = 'ShelbyUploadDB';
const STORE_NAME = 'files';
const DB_VERSION = 2; // Upgraded schema version

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open database');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Store 1: files
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('ownerAddress', 'ownerAddress', { unique: false });
      }

      // Store 2: profiles
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'address' });
      }

      // Store 3: follows
      if (!db.objectStoreNames.contains('follows')) {
        const store = db.createObjectStore('follows', { keyPath: 'id' });
        store.createIndex('followerAddress', 'followerAddress', { unique: false });
        store.createIndex('followingAddress', 'followingAddress', { unique: false });
      }

      // Store 4: likes
      if (!db.objectStoreNames.contains('likes')) {
        const store = db.createObjectStore('likes', { keyPath: 'id' });
        store.createIndex('walletAddress', 'walletAddress', { unique: false });
        store.createIndex('videoId', 'videoId', { unique: false });
      }

      // Store 5: comments
      if (!db.objectStoreNames.contains('comments')) {
        const store = db.createObjectStore('comments', { keyPath: 'id' });
        store.createIndex('videoId', 'videoId', { unique: false });
      }
    };
  });
}

// Files utilities
export async function saveFileRecord(file: UploadedFile): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFilesByOwner(ownerAddress: string): Promise<UploadedFile[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('ownerAddress');
    const request = index.getAll(ownerAddress);

    request.onsuccess = () => {
      const files = request.result as UploadedFile[];
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      resolve(files);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFileRecord(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFileRecord(id: string): Promise<UploadedFile | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPublicFiles(): Promise<UploadedFile[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const files = request.result as UploadedFile[];
      const publicFiles = files.filter(f => !f.isPrivate);
      publicFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      resolve(publicFiles);
    };
    request.onerror = () => reject(request.error);
  });
}

// PROFILES UTILITIES
export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('profiles', 'readwrite');
    const store = transaction.objectStore('profiles');
    const request = store.put(profile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProfile(address: string): Promise<UserProfile | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('profiles', 'readonly');
    const store = transaction.objectStore('profiles');
    const request = store.get(address);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// FOLLOWS UTILITIES
export async function followCreator(followerAddress: string, followingAddress: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('follows', 'readwrite');
    const store = transaction.objectStore('follows');
    const id = `${followerAddress}_${followingAddress}`;
    const request = store.put({ id, followerAddress, followingAddress });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function unfollowCreator(followerAddress: string, followingAddress: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('follows', 'readwrite');
    const store = transaction.objectStore('follows');
    const id = `${followerAddress}_${followingAddress}`;
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getFollows(followerAddress: string): Promise<string[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('follows', 'readonly');
    const store = transaction.objectStore('follows');
    const index = store.index('followerAddress');
    const request = index.getAll(followerAddress);

    request.onsuccess = () => {
      const records = request.result as FollowRelation[];
      resolve(records.map(r => r.followingAddress));
    };
    request.onerror = () => reject(request.error);
  });
}

// Return follower count for a creator
export async function getFollowersCount(creatorAddress: string): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('follows', 'readonly');
    const store = transaction.objectStore('follows');
    const index = store.index('followingAddress');
    const request = index.getAll(creatorAddress);

    request.onsuccess = () => {
      const records = request.result as FollowRelation[];
      resolve(records.length);
    };
    request.onerror = () => reject(request.error);
  });
}

// LIKES UTILITIES
export async function likeVideo(walletAddress: string, videoId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('likes', 'readwrite');
    const store = transaction.objectStore('likes');
    const id = `${walletAddress}_${videoId}`;
    const request = store.put({ id, walletAddress, videoId });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function unlikeVideo(walletAddress: string, videoId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('likes', 'readwrite');
    const store = transaction.objectStore('likes');
    const id = `${walletAddress}_${videoId}`;
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function isVideoLiked(walletAddress: string, videoId: string): Promise<boolean> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('likes', 'readonly');
    const store = transaction.objectStore('likes');
    const id = `${walletAddress}_${videoId}`;
    const request = store.get(id);

    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getVideoLikesCount(videoId: string): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('likes', 'readonly');
    const store = transaction.objectStore('likes');
    const index = store.index('videoId');
    const request = index.getAll(videoId);

    request.onsuccess = () => {
      const records = request.result as VideoLike[];
      resolve(records.length);
    };
    request.onerror = () => reject(request.error);
  });
}

// COMMENTS UTILITIES
export async function addComment(videoId: string, authorAddress: string, content: string): Promise<VideoComment> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('comments', 'readwrite');
    const store = transaction.objectStore('comments');
    const commentRecord: VideoComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      videoId,
      authorAddress,
      content,
      createdAt: new Date().toISOString()
    };
    const request = store.put(commentRecord);

    request.onsuccess = () => resolve(commentRecord);
    request.onerror = () => reject(request.error);
  });
}

export async function getVideoComments(videoId: string): Promise<VideoComment[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('comments', 'readonly');
    const store = transaction.objectStore('comments');
    const index = store.index('videoId');
    const request = index.getAll(videoId);

    request.onsuccess = () => {
      const comments = request.result as VideoComment[];
      // Sort oldest to newest for chronological conversation flow
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(comments);
    };
    request.onerror = () => reject(request.error);
  });
}
