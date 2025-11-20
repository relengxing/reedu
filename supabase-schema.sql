-- Reedu课件系统数据库Schema
-- 请在Supabase SQL Editor中执行此脚本

-- 创建 reedu schema
CREATE SCHEMA IF NOT EXISTS reedu;

-- 授予 schema 访问权限
GRANT USAGE ON SCHEMA reedu TO anon, authenticated;

-- 1. 用户绑定的仓库表
CREATE TABLE IF NOT EXISTS reedu.user_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('github', 'gitee')),
  repo_url TEXT NOT NULL,
  raw_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, raw_url)
);

-- 为user_repos创建索引
CREATE INDEX IF NOT EXISTS idx_user_repos_user_id ON reedu.user_repos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_repos_platform ON reedu.user_repos(platform);

-- 2. 公开课件表
CREATE TABLE IF NOT EXISTS reedu.public_coursewares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  group_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, repo_url, group_id)
);

-- 为public_coursewares创建索引
CREATE INDEX IF NOT EXISTS idx_public_coursewares_user_id ON reedu.public_coursewares(user_id);
CREATE INDEX IF NOT EXISTS idx_public_coursewares_is_public ON reedu.public_coursewares(is_public);
CREATE INDEX IF NOT EXISTS idx_public_coursewares_likes_count ON reedu.public_coursewares(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_coursewares_views_count ON reedu.public_coursewares(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_coursewares_created_at ON reedu.public_coursewares(created_at DESC);

-- 为标题和描述创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_public_coursewares_search 
ON reedu.public_coursewares USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- 3. 课件点赞记录表
CREATE TABLE IF NOT EXISTS reedu.courseware_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  courseware_id UUID NOT NULL REFERENCES reedu.public_coursewares(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, courseware_id)
);

-- 为courseware_likes创建索引
CREATE INDEX IF NOT EXISTS idx_courseware_likes_user_id ON reedu.courseware_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_courseware_likes_courseware_id ON reedu.courseware_likes(courseware_id);

-- 授予表操作权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA reedu TO anon, authenticated;

-- 授予序列权限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA reedu TO anon, authenticated;

-- 为将来创建的表自动授予权限
ALTER DEFAULT PRIVILEGES IN SCHEMA reedu
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA reedu
    GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- 4. 创建更新updated_at的触发器函数
CREATE OR REPLACE FUNCTION reedu.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 为public_coursewares表添加更新触发器
DROP TRIGGER IF EXISTS update_public_coursewares_updated_at ON reedu.public_coursewares;
CREATE TRIGGER update_public_coursewares_updated_at
BEFORE UPDATE ON reedu.public_coursewares
FOR EACH ROW
EXECUTE FUNCTION reedu.update_updated_at_column();

-- 6. 创建触发器函数来同步点赞数
CREATE OR REPLACE FUNCTION reedu.sync_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reedu.public_coursewares 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.courseware_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reedu.public_coursewares 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.courseware_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 为courseware_likes表添加触发器
DROP TRIGGER IF EXISTS sync_courseware_likes_count ON reedu.courseware_likes;
CREATE TRIGGER sync_courseware_likes_count
AFTER INSERT OR DELETE ON reedu.courseware_likes
FOR EACH ROW
EXECUTE FUNCTION reedu.sync_likes_count();

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION reedu.update_updated_at_column() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reedu.sync_likes_count() TO anon, authenticated;

-- 8. 创建增加浏览次数的函数（使用 SECURITY DEFINER 避免 RLS 问题）
CREATE OR REPLACE FUNCTION reedu.increment_view_count(courseware_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = reedu
AS $$
BEGIN
  UPDATE reedu.public_coursewares
  SET views_count = views_count + 1
  WHERE id = courseware_uuid;
END;
$$;

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION reedu.increment_view_count(UUID) TO anon, authenticated;

-- 9. 启用Row Level Security (RLS)
ALTER TABLE reedu.user_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reedu.public_coursewares ENABLE ROW LEVEL SECURITY;
ALTER TABLE reedu.courseware_likes ENABLE ROW LEVEL SECURITY;

-- 10. 创建RLS策略

-- user_repos: 用户只能读写自己的仓库
DROP POLICY IF EXISTS "用户可以查看自己的仓库" ON reedu.user_repos;
CREATE POLICY "用户可以查看自己的仓库"
ON reedu.user_repos FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的仓库" ON reedu.user_repos;
CREATE POLICY "用户可以插入自己的仓库"
ON reedu.user_repos FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的仓库" ON reedu.user_repos;
CREATE POLICY "用户可以删除自己的仓库"
ON reedu.user_repos FOR DELETE
USING (auth.uid() = user_id);

-- public_coursewares: 所有人可以查看公开的课件，用户可以管理自己的课件
DROP POLICY IF EXISTS "所有人可以查看公开的课件" ON reedu.public_coursewares;
CREATE POLICY "所有人可以查看公开的课件"
ON reedu.public_coursewares FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的课件" ON reedu.public_coursewares;
CREATE POLICY "用户可以插入自己的课件"
ON reedu.public_coursewares FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的课件" ON reedu.public_coursewares;
CREATE POLICY "用户可以更新自己的课件"
ON reedu.public_coursewares FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的课件" ON reedu.public_coursewares;
CREATE POLICY "用户可以删除自己的课件"
ON reedu.public_coursewares FOR DELETE
USING (auth.uid() = user_id);

-- courseware_likes: 用户可以点赞公开课件，可以查看和删除自己的点赞
DROP POLICY IF EXISTS "所有人可以查看点赞记录" ON reedu.courseware_likes;
CREATE POLICY "所有人可以查看点赞记录"
ON reedu.courseware_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "登录用户可以点赞" ON reedu.courseware_likes;
CREATE POLICY "登录用户可以点赞"
ON reedu.courseware_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以取消自己的点赞" ON reedu.courseware_likes;
CREATE POLICY "用户可以取消自己的点赞"
ON reedu.courseware_likes FOR DELETE
USING (auth.uid() = user_id);

-- 完成！数据库Schema创建成功
-- 注意：如果使用此schema，代码中需要使用 .schema('reedu') 方法访问表

