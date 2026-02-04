#!/usr/bin/env node
/**
 * Figma API 連接測試腳本
 * 使用方式:
 *   node scripts/test-figma.mjs <FIGMA_API_KEY>
 *   或設定環境變數 VITE_FIGMA_API_KEY 後執行
 */

const apiKey = process.argv[2] || process.env.VITE_FIGMA_API_KEY || process.env.FIGMA_API_KEY;

if (!apiKey) {
  console.error('❌ 錯誤: 請提供 Figma API Key');
  console.error('');
  console.error('使用方式:');
  console.error('  node scripts/test-figma.mjs <YOUR_FIGMA_API_KEY>');
  console.error('');
  console.error('或設定環境變數:');
  console.error('  export VITE_FIGMA_API_KEY=your_key_here');
  console.error('  node scripts/test-figma.mjs');
  process.exit(1);
}

console.log('🔗 正在測試 Figma API 連接...');
console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
console.log('');

async function testFigmaConnection() {
  try {
    const response = await fetch('https://api.figma.com/v1/me', {
      method: 'GET',
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Figma API 連接成功！');
      console.log('');
      console.log('📋 帳號資訊:');
      console.log(`   用戶 ID: ${data.id}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   名稱: ${data.handle}`);
      if (data.img_url) {
        console.log(`   頭像: ${data.img_url}`);
      }
      console.log('');
      console.log('🎉 您的 Figma API Key 有效且已成功串聯！');
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Figma API 連接失敗');
      console.error(`   HTTP 狀態碼: ${response.status}`);
      console.error(`   錯誤訊息: ${errorData.message || errorData.err || '未知錯誤'}`);

      if (response.status === 403) {
        console.error('');
        console.error('💡 提示: 403 錯誤通常表示 API Key 無效或已過期');
        console.error('   請前往 Figma > Settings > Personal Access Tokens 重新產生');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ 連接錯誤:', error.message);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('💡 提示: 網路連接問題，請檢查網路設定');
    }
    return false;
  }
}

testFigmaConnection().then((success) => {
  process.exit(success ? 0 : 1);
});
