/**
 * ProvenanceService — Xác thực nội dung video du lịch thật (chống fake travel story)
 * 
 * Quy trình:
 *   1. Tính SHA-256 hash của file → dấu vân tay số độc nhất
 *   2. Kiểm tra duplicate trong DB
 *   3. Tính Provenance Score (0–100)
 *   4. Lưu ProvenanceRecord vào IndexedDB
 */

export interface ProvenanceRecord {
  id: string;                    // prov-{timestamp}-{random}
  fileId: string;                // Shelby blob ID (lấy sau khi upload xong)
  fileHash: string;              // SHA-256 hex — dấu vân tay nội dung
  fileName: string;              // Tên file gốc
  fileSize: number;              // Kích thước byte
  fileType: string;              // MIME type
  walletAddress: string;         // Địa chỉ ví chủ sở hữu
  uploadTimestamp: string;       // ISO string thời điểm upload
  deviceInfo: string;            // Browser / OS (rút gọn)
  verificationStatus: 'verified' | 'duplicate' | 'unverified';
  duplicateOf?: string;          // fileId gốc nếu là bản sao
  provenanceScore: number;       // 0–100
  location?: string;             // Địa điểm khai báo (tùy chọn)
  scoreBreakdown: {
    uniqueHash: number;          // 0 hoặc 30
    walletLinked: number;        // 0 hoặc 25
    validFileData: number;       // 0, 10 hoặc 20
    locationProvided: number;    // 0 hoặc 10
    metadataComplete: number;    // 0 hoặc 15
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  originalFileId?: string;
  originalWallet?: string;
  originalUploadTime?: string;
}

/**
 * Tạo SHA-256 hash của file dùng Web Crypto API (không cần thư viện ngoài)
 */
export async function generateFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Lấy thông tin thiết bị rút gọn (không lộ PII)
 */
export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browser = ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Edg/') ? 'Edge'
    : ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Safari') ? 'Safari'
    : 'Browser';
  const os = ua.includes('Windows') ? 'Windows'
    : ua.includes('Mac') ? 'macOS'
    : ua.includes('Linux') ? 'Linux'
    : ua.includes('Android') ? 'Android'
    : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
    : 'Unknown OS';
  return `${browser} / ${os} / ${isMobile ? 'Mobile' : 'Desktop'}`;
}

/**
 * Rút gọn hash để hiển thị: "a1b2c3...d4e5f6"
 */
export function shortenHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
}

/**
 * Tính điểm Provenance Score (0–100)
 */
export function calculateProvenanceScore(params: {
  isUnique: boolean;
  hasWallet: boolean;
  fileSize: number;
  fileType: string;
  hasLocation: boolean;
  hasMetadata: boolean;  // has title + description
}): { total: number; breakdown: ProvenanceRecord['scoreBreakdown'] } {
  const uniqueHash = params.isUnique ? 30 : 0;
  const walletLinked = params.hasWallet ? 25 : 0;
  let validFileData = 0;
  if (params.fileSize > 10_000 && params.fileType.startsWith('video/')) validFileData = 20;
  else if (params.fileSize > 0) validFileData = 10;
  const locationProvided = params.hasLocation ? 10 : 0;
  const metadataComplete = params.hasMetadata ? 15 : 0;

  const breakdown = { uniqueHash, walletLinked, validFileData, locationProvided, metadataComplete };
  const total = Math.min(100, uniqueHash + walletLinked + validFileData + locationProvided + metadataComplete);
  return { total, breakdown };
}

/**
 * Xác định trạng thái xác thực từ score và duplicate
 */
export function getVerificationStatus(
  score: number,
  isDuplicate: boolean
): 'verified' | 'duplicate' | 'unverified' {
  if (isDuplicate) return 'duplicate';
  if (score >= 70) return 'verified';
  return 'unverified';
}

/**
 * Lấy màu badge theo trạng thái xác thực
 */
export function getStatusColor(status: ProvenanceRecord['verificationStatus']): string {
  switch (status) {
    case 'verified': return '#00f0ff';
    case 'duplicate': return '#ff4040';
    case 'unverified': return '#f5a623';
  }
}

/**
 * Lấy nhãn badge theo trạng thái xác thực
 */
export function getStatusLabel(status: ProvenanceRecord['verificationStatus']): string {
  switch (status) {
    case 'verified': return '✓ VERIFIED';
    case 'duplicate': return '⚠ DUPLICATE';
    case 'unverified': return '? UNVERIFIED';
  }
}

/**
 * Tạo ProvenanceRecord hoàn chỉnh (chưa lưu DB — gọi saveProvenance() sau)
 */
export function buildProvenanceRecord(params: {
  fileId: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  walletAddress: string;
  location?: string;
  isDuplicate: boolean;
  duplicateOf?: string;
  hasMetadata: boolean;
}): ProvenanceRecord {
  const { total, breakdown } = calculateProvenanceScore({
    isUnique: !params.isDuplicate,
    hasWallet: !!params.walletAddress,
    fileSize: params.fileSize,
    fileType: params.fileType,
    hasLocation: !!params.location,
    hasMetadata: params.hasMetadata,
  });

  const status = getVerificationStatus(total, params.isDuplicate);

  return {
    id: `prov-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    fileId: params.fileId,
    fileHash: params.fileHash,
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileType: params.fileType,
    walletAddress: params.walletAddress,
    uploadTimestamp: new Date().toISOString(),
    deviceInfo: getDeviceInfo(),
    verificationStatus: status,
    duplicateOf: params.duplicateOf,
    provenanceScore: total,
    location: params.location,
    scoreBreakdown: breakdown,
  };
}
