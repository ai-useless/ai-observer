import QRCode from 'qrcode'

// 生成二维码图片URL
export const createQRCode = async (text: string): Promise<string> => {
  // 生成二维码图片的DataURL
  return await QRCode.toDataURL(text, {
    width: 256,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}
