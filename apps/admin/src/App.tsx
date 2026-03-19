import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<div>首页</div>} />
        <Route path="/products" element={<div>商品列表</div>} />
        <Route path="/login" element={<div>登录</div>} />
        <Route path="/register" element={<div>注册</div>} />
      </Routes>
    </div>
  )
}

export default App
