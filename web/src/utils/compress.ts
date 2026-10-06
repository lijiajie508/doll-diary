/**
 * 图片压缩：把大图压缩成最长边不超过 maxSize 的 JPEG
 * 小图（短于 maxSize 且 < 500KB）原样返回，不做无谓压缩
 */
export function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    // 已经是小图就不折腾
    if (file.size < 500 * 1024) {
      resolve(file)
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      // 尺寸没超，但文件大（如长图），仍压缩到 maxSize 尺寸
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}
