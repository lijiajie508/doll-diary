-- AI 助手聊天记录表
CREATE TABLE IF NOT EXISTS ai_message (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL COMMENT '提问用户',
  role VARCHAR(10) NOT NULL COMMENT 'user=用户提问 / assistant=助手回答',
  content TEXT NOT NULL COMMENT '消息内容',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI助手聊天记录';
