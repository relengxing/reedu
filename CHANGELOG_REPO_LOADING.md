# 课件加载机制更新日志

## 更新时间
2025-11-20

## 主要更改

### 1. 移除编译期课件导入

**问题**: 之前项目使用Vite的`import.meta.glob`在编译时导入课件HTML文件，这导致：
- 每次添加课件都需要重新编译
- 课件内容被打包到主bundle中，增加了包体积
- 无法动态加载用户自定义的课件仓库

**解决方案**: 完全移除编译期导入，改为动态加载：
- 清空了`src/coursewares/index.ts`，导出空数组
- 所有课件现在通过用户绑定的Git仓库动态加载
- `bundledCoursewares`和`bundledCoursewareGroups`现在只包含从用户仓库加载的内容

**修改的文件**:
- `src/coursewares/index.ts` - 移除所有编译期导入逻辑，导出空数组
- `src/context/CoursewareContext.tsx` - 移除对编译期课件的引用

### 2. 修复课件加载时机

**问题**: 在配置页面添加仓库后，课件没有被立即加载到首页。

**原因**: 
- `ConfigPage`添加仓库后只更新了UI显示的仓库列表
- 没有触发`CoursewareContext`重新加载课件数据

**解决方案**: 在添加/删除仓库后，同时调用`CoursewareContext`的`loadUserRepos()`方法：

```typescript
// 添加仓库后
await loadUserRepos(); // 刷新UI显示
await loadUserReposFromContext(); // 重新加载课件数据
message.success('课件已加载');
```

**修改的文件**:
- `src/pages/ConfigPage.tsx` - 在添加/删除仓库后触发课件重新加载

### 3. 自动加载用户仓库

**更新**: `CoursewareContext`现在在用户登录后自动加载其绑定的所有仓库：

```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    console.log('[CoursewareContext] 用户已登录，加载用户仓库');
    loadUserRepos();
  }
}, [isAuthenticated, user]);
```

**流程**:
1. 用户登录
2. `AuthContext`更新`isAuthenticated`和`user`状态
3. `CoursewareContext`检测到登录状态变化
4. 自动从Supabase获取用户绑定的仓库列表
5. 加载所有仓库的manifest.json
6. 解析课件并更新到Context中

### 4. 课件来源说明

现在系统中的课件来自三个渠道：

1. **用户绑定的Git仓库** (动态加载)
   - 存储在Supabase的`reedu.user_repos`表
   - 登录后自动加载
   - 支持GitHub和Gitee

2. **课件广场的公开课件** (按需加载)
   - 通过动态路由访问: `/:platform/:owner/:repo/:folder/:course`
   - 无需登录即可访问公开课件

3. **本地上传的课件** (手动导入)
   - 在配置页面通过上传HTML文件添加
   - 存储在浏览器的localStorage中

### 5. 兼容性说明

虽然移除了编译期导入，但API保持兼容：
- `bundledCoursewares` 和 `bundledCoursewareGroups` 依然存在
- 它们现在包含的是从用户仓库动态加载的课件
- 所有使用这些API的组件无需修改

### 6. 性能改进

- ✅ 减少了初始包体积
- ✅ 课件按需加载，提升首屏速度
- ✅ 支持动态更新，无需重新部署

## 影响范围

### 修改的文件
- `src/coursewares/index.ts` - 移除编译期导入
- `src/context/CoursewareContext.tsx` - 添加用户仓库自动加载
- `src/pages/ConfigPage.tsx` - 修复添加仓库后的加载逻辑

### 删除的文件
- `src/pages/ConfigPage_new.tsx` - 临时备份文件

### 不受影响的文件
- `src/pages/HomePage.tsx` - 继续使用`bundledCoursewares`
- `src/pages/NavigationPage.tsx` - 继续使用`bundledCoursewareGroups`
- `src/pages/CoursePage.tsx` - 继续使用`bundledCoursewareGroups`
- `src/pages/CoursewarePlayer.tsx` - 继续使用`bundledCoursewareGroups`

## 测试建议

1. **登录流程测试**
   - 登录后检查首页是否显示用户绑定的课件
   - 检查控制台日志确认课件加载成功

2. **添加仓库测试**
   - 在配置页面添加新仓库
   - 验证首页立即显示新加载的课件
   - 检查是否显示"课件已加载"的提示

3. **删除仓库测试**
   - 删除已绑定的仓库
   - 验证首页不再显示该仓库的课件

4. **未登录状态测试**
   - 未登录时，首页应显示空状态或引导登录
   - 可以浏览课件广场和播放公开课件

## 后续优化建议

1. **缓存机制**: 为已加载的课件添加缓存，避免重复请求
2. **加载状态**: 在首页添加加载指示器，提升用户体验
3. **错误处理**: 改进仓库加载失败时的错误提示
4. **批量操作**: 支持一次性添加多个仓库

