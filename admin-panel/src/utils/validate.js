/**
 * 验证是否为外部链接
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 验证用户名
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  const valid_map = ['admin', 'editor']
  return valid_map.indexOf(str.trim()) >= 0
}

/**
 * 验证邮箱
 * @param {string} email
 * @returns {Boolean}
 */
export function validEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

/**
 * 验证手机号
 * @param {string} phone
 * @returns {Boolean}
 */
export function validPhone(phone) {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * 验证密码强度
 * @param {string} password
 * @returns {Boolean}
 */
export function validPassword(password) {
  // 至少6位，包含字母和数字
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/
  return re.test(password)
}

/**
 * 验证URL
 * @param {string} url
 * @returns {Boolean}
 */
export function validURL(url) {
  const re = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return re.test(url)
}

/**
 * 验证小写字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validLowerCase(str) {
  const re = /^[a-z]+$/
  return re.test(str)
}

/**
 * 验证大写字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validUpperCase(str) {
  const re = /^[A-Z]+$/
  return re.test(str)
}

/**
 * 验证字母
 * @param {string} str
 * @returns {Boolean}
 */
export function validAlphabets(str) {
  const re = /^[A-Za-z]+$/
  return re.test(str)
}