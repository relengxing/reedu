# 语义化URL更新日志

## 更新时间
2025-11-20

## 主要更改

### 1. URL格式变更

**之前**: 使用索引和MD5哈希
- 播放器URL: `/player/0/0` (课件索引/页面索引)
- 课程URL: `/课程MD5哈希/页面索引`

**现在**: 使用语义化URL
- 课程URL: `/:platform/:owner/:repo/:folder/:course/:pageIndex`
- 示例: `/github/relengxing/reedu-coursewares/数学/一元二次方程/0`

**优势**:
- ✅ URL可读性强，清晰表达课件来源
- ✅ 支持直接分享，无需预先加载
- ✅ SEO友好
- ✅ 便于调试和维护

### 2. 课程ID生成方式变更

**之前**: 使用文件夹名的MD5哈希
```typescript
const courseId = hashStringSync(groupId);
// 例如: "a3f8d9c7e2b1..."
```

**现在**: 使用语义化路径
```typescript
const courseId = `${platform}/${owner}/${repo}/${folder}`;
// 例如: "github/relengxing/reedu-coursewares/数学"
```

### 3. 类型定义更新

**CoursewareData 新增字段**:
```typescript
export interface CoursewareData {
  // ... 原有字段 ...
  // 新增：仓库信息（用于生成语义化URL）
  platform?: string;  // 'github' 或 'gitee'
  owner?: string;     // 仓库所有者
  repo?: string;      // 仓库名称
  branch?: string;    // 分支名称
  filePath?: string;  // 文件在仓库中的相对路径
}
```

**CoursewareGroup 新增字段**:
```typescript
export interface CoursewareGroup {
  // ... 原有字段 ...
  courseId: string;   // 现在是 platform/owner/repo/folder 格式
  // 新增：仓库信息
  platform?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  folder?: string;
}
```

### 4. 课件加载流程更新

#### coursewareLoader.ts
- 从raw URL解析仓库信息（platform, owner, repo, branch）
- 加载课件时自动填充这些信息到每个课件对象
- 生成语义化的courseId

```typescript
// 解析仓库信息
const repoInfo = parseRepoInfoFromRawUrl(config.baseUrl);

// 为每个课件添加仓库信息
courseware.platform = repoInfo.platform;
courseware.owner = repoInfo.owner;
courseware.repo = repoInfo.repo;
courseware.branch = repoInfo.branch;
courseware.filePath = filePath;

// 生成语义化courseId
const courseId = `${repoInfo.platform}/${repoInfo.owner}/${repoInfo.repo}/${folder}`;
```

#### NavigationPage.tsx
- 点击课件组时，跳转到语义化URL而不是 `/player/0/0`
- 课程链接显示完整的语义化URL

```typescript
// 构建语义化URL
const courseFileName = firstCourseware.filePath?.split('/').pop()?.replace('.html', '');
const folder = group.folder || group.id;
const semanticUrl = `/${platform}/${owner}/${repo}/${folder}/${courseFileName}/0`;
navigate(semanticUrl);
```

### 5. URL工具函数

已有的 `urlParser.ts` 提供了完整的URL处理功能：
- `parseRawUrl()` - 从raw URL解析仓库信息
- `buildCoursewareUrlPath()` - 构建课件URL路径
- `parseCoursewareUrlPath()` - 解析课件URL路径

### 6. DynamicCoursePage 兼容性

`DynamicCoursePage` 已经支持新的URL格式：
- 解析 `/:platform/:owner/:repo/:folder/:course/:pageIndex?`
- 按需加载课件HTML
- 自动添加仓库信息到课件对象
- 支持跳转到旧的播放器格式（向后兼容）

## URL格式示例

### GitHub课件
```
https://reedu.bofangqi.com/github/relengxing/reedu-coursewares/数学/一元二次方程/0
https://reedu.bofangqi.com/github/relengxing/reedu-coursewares/物理/牛顿定律/2
```

### Gitee课件
```
https://reedu.bofangqi.com/gitee/username/repo/课件组/课件名/0
```

### URL结构说明
```
/:platform/:owner/:repo/:folder/:course/:pageIndex
  │        │      │     │       │       └─ 页面索引（可选，默认0）
  │        │      │     │       └─────────── 课件文件名（不含.html）
  │        │      │     └─────────────────── 文件夹/课件组名
  │        │      └───────────────────────── 仓库名
  │        └──────────────────────────────── 所有者
  └───────────────────────────────────────── 平台（github/gitee）
```

## 向后兼容性

### 保留的旧路由
以下路由仍然保留，用于向后兼容：
- `/player/:coursewareIndex/:pageIndex` - 播放器索引方式
- `/:courseId/:pageIndex` - MD5课程ID方式（会被新格式覆盖）

### 降级处理
如果课件对象缺少仓库信息（如本地上传的课件），会自动降级到旧的索引方式：
```typescript
if (firstCourseware.platform && firstCourseware.owner && firstCourseware.repo) {
  // 使用语义化URL
  navigate(semanticUrl);
} else {
  // 降级到索引方式
  navigate(`/player/${existingIndex}/0`);
}
```

## 影响范围

### 修改的文件
- `src/types/index.ts` - 添加仓库信息字段
- `src/services/coursewareLoader.ts` - 解析和填充仓库信息，生成语义化courseId
- `src/pages/NavigationPage.tsx` - 使用语义化URL跳转和显示

### 不受影响的文件
- `src/pages/DynamicCoursePage.tsx` - 已支持新格式
- `src/pages/CoursewarePlayer.tsx` - 继续支持索引方式
- `src/utils/urlParser.ts` - 已有完整的URL处理功能

### 本地上传的课件
本地上传的课件没有仓库信息，会继续使用索引方式 `/player/0/0`

## 测试建议

1. **加载用户仓库**
   - 登录后绑定GitHub/Gitee仓库
   - 检查课件是否正确加载
   - 验证课件对象包含仓库信息

2. **点击课件组**
   - 在导航页面点击课件组
   - 验证URL变为语义化格式
   - 检查课件能否正确显示

3. **分享链接**
   - 复制课程链接
   - 在新窗口打开
   - 验证能否直接加载和显示

4. **本地课件**
   - 上传本地HTML文件
   - 验证仍然使用 `/player/0/0` 格式
   - 检查播放是否正常

5. **课件广场**
   - 从课件广场打开公开课件
   - 验证URL格式正确
   - 检查能否正常播放

## 数据迁移

### 不需要迁移
- 旧的课件数据会在重新加载时自动添加仓库信息
- localStorage中的数据会在下次加载仓库时更新
- 不会影响已有的课件使用

### 自动更新
当用户下次进入系统时：
1. `CoursewareContext` 自动加载用户仓库
2. `coursewareLoader` 解析仓库信息并填充到课件对象
3. 课件组的courseId自动更新为语义化格式
4. 用户点击课件时自动使用新URL格式

## 性能影响

- ✅ **无性能下降**: 只是改变了ID生成方式，不增加额外的网络请求
- ✅ **URL更长**: 但可读性更好，便于调试
- ✅ **缓存友好**: 基于URL的缓存策略更容易实现

## 未来优化

1. **URL编码优化**
   - 支持中文课件名的URL编码
   - 提供短链接服务

2. **多分支支持**
   - URL中添加分支参数
   - 支持切换不同分支的课件

3. **历史记录**
   - 基于语义化URL实现更好的浏览历史
   - 支持书签和收藏

---

**最后更新**: 2025-11-20  
**负责人**: Reedu 开发团队

