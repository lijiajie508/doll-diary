# 娃柜日记 · Docker 一键部署指南

## 一、准备工作

1. 安装 **Docker Desktop**（Windows）：https://www.docker.com/products/docker-desktop/
   安装后打开 Docker Desktop，等左下角显示 Running。
2. 确保本机 **8081 / 3306 / 6379 / 80 端口没有被占用**：
   - 本地开发时 MySQL 和 Redis 正在跑的话，先关掉（否则端口冲突）
   - 或用命令改端口：`docker compose up` 前编辑 `docker-compose.yml` 里的 ports

## 二、一键启动

在项目根目录 `D:\Doll` 打开终端，执行：

```bash
docker compose up -d --build
```

首次启动会自动：
- 启动 MySQL（自动执行 `sql/schema.sql` 建库建表 + 测试账号）
- 启动 Redis
- 编译后端镜像并启动（端口 8081）
- 编译前端镜像并启动（Nginx，端口 80）

## 三、访问

| 服务 | 地址 |
|---|---|
| 前端（娃柜日记） | http://localhost |
| 后端 API | http://localhost:8081 |

测试账号（密码均 `123456`）：admin / dollfan / catboy / kittyfan / stella

## 四、常用命令

```bash
# 查看状态
docker compose ps

# 看后端日志
docker compose logs -f backend

# 重启后端（改代码后重新构建）
docker compose up -d --build backend

# 停止
docker compose stop

# 彻底删除（数据卷保留）
docker compose down

# 连数据库（手动查数据）
docker exec -it doll-mysql mysql -uroot -p123456 doll_share
```

## 五、数据持久化

- 图片：存在 Docker 卷 `doll-uploads`（`docker volume ls` 可看），**删容器不丢图**
- 数据库：卷 `mysql-data`
- 想备份图片：`docker cp doll-backend:/app/uploads ./backup-uploads`

## 六、和本地开发的关系

- Docker 部署和本地开发（IDEA + npm run dev）互不影响，只是两种运行方式
- 想回到本地开发：`docker compose down`，然后照常启动 IDEA 后端 + npm run dev
- 注意：Docker 里的 MySQL 和本地 MySQL 是**两份独立数据**，别搞混
