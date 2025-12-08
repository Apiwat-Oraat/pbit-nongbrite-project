/**
 * Date Formatter Utility
 * ฟังก์ชันสำหรับ format วันที่ก่อนส่งไป frontend
 */

/**
 * Format date เป็น ISO string (default)
 * @param {Date|string|null|undefined} date - วันที่ที่จะ format
 * @returns {string|null} ISO string หรือ null ถ้าไม่มี date
 */
export const formatToISO = (date) => {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString();
};

/**
 * Format date เป็นรูปแบบไทย (DD/MM/YYYY HH:mm:ss)
 * @param {Date|string|null|undefined} date - วันที่ที่จะ format
 * @param {Object} options - ตัวเลือกการ format
 * @param {boolean} options.includeTime - รวมเวลา (default: true)
 * @param {boolean} options.includeSeconds - รวมวินาที (default: false)
 * @returns {string|null} วันที่แบบไทย หรือ null
 */
export const formatToThai = (date, options = {}) => {
  if (!date) return null;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return null;

  const { includeTime = true, includeSeconds = false } = options;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  let formatted = `${day}/${month}/${year}`;

  if (includeTime) {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    formatted += ` ${hours}:${minutes}`;

    if (includeSeconds) {
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      formatted += `:${seconds}`;
    }
  }

  return formatted;
};

/**
 * Format object ที่มี date fields ทั้งหมด
 * ใช้สำหรับ format response object ที่มีหลาย date fields
 * @param {Object} obj - object ที่ต้องการ format
 * @param {Array<string>} dateFields - array ของ field names ที่เป็น date
 * @param {Function} formatter - ฟังก์ชัน format (default: formatToISO)
 * @returns {Object} object ที่ format แล้ว
 */
export const formatObjectDates = (obj, dateFields = [], formatter = formatToISO) => {
  if (!obj || typeof obj !== 'object') return obj;

  const formatted = Array.isArray(obj) ? [...obj] : { ...obj };

  if (Array.isArray(formatted)) {
    return formatted.map(item => formatObjectDates(item, dateFields, formatter));
  }

  dateFields.forEach(field => {
    if (formatted[field]) {
      formatted[field] = formatter(formatted[field]);
    }
  });

  // Recursively format nested objects
  Object.keys(formatted).forEach(key => {
    if (formatted[key] && typeof formatted[key] === 'object' && !(formatted[key] instanceof Date)) {
      formatted[key] = formatObjectDates(formatted[key], dateFields, formatter);
    }
  });

  return formatted;
};

/**
 * Auto format common date fields ใน response
 * Format fields: createdAt, updatedAt, completedAt, playedAt, lastActiveDate, expiresAt, lastResetAt, joinedDate
 * @param {Object|Array} data - ข้อมูลที่จะ format
 * @param {Function} formatter - ฟังก์ชัน format (default: formatToISO)
 * @returns {Object|Array} ข้อมูลที่ format แล้ว
 */
export const autoFormatDates = (data, formatter = formatToISO) => {
  const commonDateFields = [
    'createdAt',
    'updatedAt',
    'completedAt',
    'playedAt',
    'unlockedAt',
    'lastActiveDate',
    'expiresAt',
    'lastResetAt',
    'joinedDate',
    'lastUpdated'
  ];

  return formatObjectDates(data, commonDateFields, formatter);
};

export default {
  formatToISO,
  formatToThai,
  formatObjectDates,
  autoFormatDates
};

