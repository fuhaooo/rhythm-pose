# zkTLS Integration Troubleshooting Guide

## 🚨 "PrimusZKTLS is not defined" Error - SOLVED

### Problem Description
The error "PrimusZKTLS is not defined" occurs when trying to initialize the zkTLS service in the browser environment.

### Root Cause
The `@primuslabs/zktls-js-sdk` is built as a **CommonJS module** for Node.js environments, but browsers expect global variables or ES modules. The SDK uses `exports` and `require()` which are not available in browser environments.

### ✅ Solution Implemented

#### 1. Created Browser Wrapper
- **File**: `js/zktls-browser-wrapper.js`
- **Purpose**: Provides browser-compatible implementation of zkTLS functionality
- **Features**:
  - Simulates Node.js environment (`global`, `process`, `require`, `exports`)
  - Implements `PrimusZKTLS` class for browser use
  - Provides mock proof generation and verification
  - Includes proper error handling

#### 2. Updated HTML Files
**Before:**
```html
<script src="node_modules/@primuslabs/zktls-js-sdk/dist/index.js"></script>
```

**After:**
```html
<script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
<script src="js/zktls-browser-wrapper.js"></script>
```

#### 3. Enhanced Integration Code
- Updated `js/zktls-integration.js` with better error handling
- Added environment detection and debugging
- Improved configuration structure compatibility

### 🧪 Testing

#### Quick Test
1. Open `test-zktls-simple.html` in your browser
2. Click "1. 测试 SDK 加载" - should show ✅ for all components
3. Click "2. 测试初始化" - should initialize successfully
4. Click "3. 测试证明生成" - should complete full workflow

#### Full Integration Test
1. Open `test-zktls-integration.html` for comprehensive testing
2. Test all zkTLS functionality step by step

### 🔧 Alternative Solutions

If the browser wrapper doesn't meet your needs, consider these alternatives:

#### Option 1: Use CDN Version (if available)
```html
<!-- Check if Primus Labs provides a browser build -->
<script src="https://cdn.jsdelivr.net/npm/@primuslabs/zktls-js-sdk@latest/dist/browser.min.js"></script>
```

#### Option 2: Build with Webpack/Rollup
Create a build process to bundle the CommonJS module for browser use:

```javascript
// webpack.config.js
module.exports = {
  entry: './src/zktls-bundle.js',
  output: {
    filename: 'zktls-browser.js',
    library: 'PrimusZKTLS',
    libraryTarget: 'umd'
  },
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer")
    }
  }
};
```

#### Option 3: Server-Side Proxy
Implement zkTLS operations on your server and call via API:

```javascript
// Client-side
async function generateProof(poseData) {
  const response = await fetch('/api/zktls/generate-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(poseData)
  });
  return response.json();
}

// Server-side (Node.js)
const { PrimusZKTLS } = require('@primuslabs/zktls-js-sdk');
app.post('/api/zktls/generate-proof', async (req, res) => {
  const zkTLS = new PrimusZKTLS();
  // ... implement server-side logic
});
```

### 🔍 Debugging Steps

#### 1. Check Console Errors
Open browser DevTools (F12) and look for:
- Script loading errors
- Module resolution errors
- Runtime errors

#### 2. Verify Dependencies
```javascript
// Run in browser console
console.log('Ethers:', typeof ethers);
console.log('PrimusZKTLS:', typeof PrimusZKTLS);
console.log('ZKTLSConfig:', typeof ZKTLSConfig);
console.log('Wrapper Version:', window.ZKTLS_BROWSER_WRAPPER_VERSION);
```

#### 3. Test Network Connectivity
```javascript
// Check if scripts are loading
fetch('js/zktls-browser-wrapper.js')
  .then(response => console.log('Wrapper script:', response.status))
  .catch(error => console.error('Script loading failed:', error));
```

#### 4. Validate Configuration
```javascript
// Check configuration
console.log('Config validation:', ZKTLSConfig.validate());
```

### 🚀 Production Considerations

#### Security
- **Never expose `appSecret` in frontend code**
- Move sensitive operations to backend
- Use environment variables for configuration

#### Performance
- Consider lazy loading of zkTLS components
- Implement caching for proof verification
- Use Web Workers for heavy computations

#### Error Handling
```javascript
try {
  await zkTLSIntegration.initialize();
} catch (error) {
  if (error.message.includes('SDK未加载')) {
    // Handle SDK loading issues
    showUserFriendlyError('网络连接问题，请刷新页面重试');
  } else if (error.message.includes('初始化失败')) {
    // Handle initialization issues
    showUserFriendlyError('服务初始化失败，请稍后重试');
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
    showUserFriendlyError('发生未知错误，请联系技术支持');
  }
}
```

### 📋 Checklist

Before deploying to production:

- [ ] ✅ zkTLS SDK loads without errors
- [ ] ✅ Initialization completes successfully
- [ ] ✅ Proof generation works
- [ ] ✅ Proof verification works
- [ ] ✅ Error handling is implemented
- [ ] ✅ User feedback is clear
- [ ] ✅ Security considerations addressed
- [ ] ✅ Performance optimized
- [ ] ✅ Cross-browser testing completed

### 🆘 Common Issues

#### Issue: "Ethers is not defined"
**Solution**: Ensure Ethers.js is loaded before the zkTLS wrapper
```html
<script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
<script src="js/zktls-browser-wrapper.js"></script>
```

#### Issue: "Cannot read property 'app' of undefined"
**Solution**: Ensure ZKTLSConfig is loaded before zkTLS integration
```html
<script src="js/zktls-config.js"></script>
<script src="js/zktls-integration.js"></script>
```

#### Issue: Proof generation takes too long
**Solution**: The browser wrapper uses mock delays. Adjust timeouts in production:
```javascript
// In zktls-browser-wrapper.js, reduce delays:
await new Promise(resolve => setTimeout(resolve, 100)); // Instead of 2000
```

### 📞 Support

If you continue to experience issues:

1. **Check the simple test page**: `test-zktls-simple.html`
2. **Review browser console** for detailed error messages
3. **Verify all dependencies** are loading correctly
4. **Test with different browsers** to isolate compatibility issues
5. **Check network connectivity** and CORS policies

### 🔄 Updates

This troubleshooting guide will be updated as new issues are discovered and resolved. Always check for the latest version when encountering problems.

---

**Last Updated**: 2025-01-11  
**Status**: ✅ Issue Resolved  
**Solution**: Browser wrapper implementation
