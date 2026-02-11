#!/bin/bash

echo "📦 创建测试数据"
echo "================"
echo ""

mysql -u root -p522471614s basketball_platform << 'EOFSQL'
-- 创建商品分类
INSERT IGNORE INTO Category (id, name, description, createdAt) VALUES 
  ('cat1', '球鞋', '篮球鞋类', NOW()),
  ('cat2', '球衣', '篮球服装', NOW()),
  ('cat3', '篮球', '篮球用品', NOW()),
  ('cat4', '配件', '篮球配件', NOW());

-- 创建测试用户（卖家）
INSERT IGNORE INTO User (id, username, email, password, role, isSeller, createdAt) VALUES 
  ('user1', 'seller1', 'seller1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER', 1, NOW());

-- 创建测试商品
INSERT IGNORE INTO Product (id, name, description, price, stock, categoryId, sellerId, status, images, rating, reviewCount, createdAt) VALUES 
  ('prod1', 'Nike LeBron 篮球鞋', '专业篮球鞋，舒适透气，适合室内外场地', 599.00, 100, 'cat1', 'user1', 'ACTIVE', '["https://via.placeholder.com/400x400?text=Nike+Shoe"]', 4.5, 25, NOW()),
  ('prod2', 'Adidas 运动球衣', '透气运动球衣，速干材质', 299.00, 50, 'cat2', 'user1', 'ACTIVE', '["https://via.placeholder.com/400x400?text=Adidas+Jersey"]', 4.2, 18, NOW()),
  ('prod3', 'Spalding 标准篮球', '标准比赛用球，手感舒适', 199.00, 200, 'cat3', 'user1', 'ACTIVE', '["https://via.placeholder.com/400x400?text=Spalding+Ball"]', 4.8, 32, NOW()),
  ('prod4', '护膝运动装备', '专业护膝，保护膝盖', 89.00, 150, 'cat4', 'user1', 'ACTIVE', '["https://via.placeholder.com/400x400?text=Knee+Pad"]', 4.3, 15, NOW());

-- 创建帖子分类
INSERT IGNORE INTO PostCategory (id, name, description, createdAt) VALUES 
  ('postcat1', '赛事讨论', '篮球赛事相关讨论', NOW()),
  ('postcat2', '技术交流', '篮球技术交流', NOW()),
  ('postcat3', '装备评测', '篮球装备评测', NOW());

-- 创建测试用户（普通用户）
INSERT IGNORE INTO User (id, username, email, password, role, createdAt) VALUES 
  ('user2', 'testuser', 'test@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'USER', NOW());

-- 创建测试帖子（已审核）
INSERT IGNORE INTO Post (id, title, content, authorId, categoryId, status, views, likes, createdAt) VALUES 
  ('post1', 'NBA 最新战报：湖人队表现精彩', '今天湖人队在对阵勇士队的比赛中表现出色，詹姆斯拿下三双...', 'user2', 'postcat1', 'APPROVED', 100, 20, NOW()),
  ('post2', '如何提高投篮命中率？', '分享一些提高投篮命中率的技巧：1. 保持正确的姿势 2. 多练习 3. 注意呼吸...', 'user2', 'postcat2', 'APPROVED', 50, 10, NOW()),
  ('post3', 'Nike 篮球鞋使用体验', '使用了一个月，感觉非常舒适，推荐给大家...', 'user2', 'postcat3', 'APPROVED', 80, 15, NOW());

SELECT '✅ 测试数据创建完成！' as message;
SELECT COUNT(*) as product_count FROM Product;
SELECT COUNT(*) as post_count FROM Post WHERE status='APPROVED';
EOFSQL

echo ""
echo "✅ 测试数据已创建！"
echo ""
echo "📊 数据统计："
mysql -u root -p522471614s basketball_platform -e "SELECT COUNT(*) as '商品数量' FROM Product; SELECT COUNT(*) as '已审核帖子' FROM Post WHERE status='APPROVED';" 2>/dev/null
