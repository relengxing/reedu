import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useCourseware } from '../context/CoursewareContext';

const { Text } = Typography;

const CoursewarePlayer: React.FC = () => {
  const { coursewareIndex, pageIndex } = useParams<{ coursewareIndex?: string; pageIndex: string }>();
  const navigate = useNavigate();
  const { coursewares, currentCoursewareIndex, setCurrentCoursewareIndex, courseware, isLoading, bundledCoursewareGroups } = useCourseware();
  const [currentIndex, setCurrentIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollUpdateTimerRef = useRef<number | null>(null); // 滚动更新防抖定时器
  const [waitingForExternal, setWaitingForExternal] = useState(false);

  // 计算所有课件的总页面数和全局索引
  const getGlobalPageInfo = useMemo(() => {
    let totalPages = 0;
    const pageMap: Array<{ coursewareIndex: number; pageIndex: number }> = [];
    
    coursewares.forEach((cw, cwIndex) => {
      cw.pages.forEach((_, pageIdx) => {
        pageMap.push({ coursewareIndex: cwIndex, pageIndex: pageIdx });
        totalPages++;
      });
    });
    
    return { totalPages, pageMap };
  }, [coursewares]);

  // 获取当前页面的全局索引
  const getCurrentGlobalIndex = useMemo(() => {
    if (!courseware) return 0;
    let globalIndex = 0;
    for (let i = 0; i < currentCoursewareIndex; i++) {
      globalIndex += coursewares[i]?.pages.length || 0;
    }
    globalIndex += currentIndex;
    return globalIndex;
  }, [coursewares, currentCoursewareIndex, currentIndex, courseware]);

  // 根据全局索引获取课件和页面索引
  const getPageByGlobalIndex = (globalIndex: number) => {
    const { pageMap } = getGlobalPageInfo;
    if (globalIndex < 0 || globalIndex >= pageMap.length) {
      return null;
    }
    return pageMap[globalIndex];
  };

  // 根据路由参数确定当前课件索引
  // 优先使用路由参数，如果路由参数不存在或无效，使用从localStorage恢复的索引
  useEffect(() => {
    // 如果课件列表为空，且正在加载外部课件，等待加载完成
    if (coursewares.length === 0) {
      if (isLoading) {
        setWaitingForExternal(true);
        return; // 等待外部课件加载完成
      }
      // 如果不在加载且课件列表仍为空，可能是刷新后数据丢失
      // 尝试等待一小段时间，让外部课件有机会加载
      if (!waitingForExternal && bundledCoursewareGroups.length > 0) {
        setWaitingForExternal(true);
        // 等待最多3秒，让外部课件加载完成
        const timeout = setTimeout(() => {
          setWaitingForExternal(false);
        }, 3000);
        return () => clearTimeout(timeout);
      }
      return;
    }
    
    // 课件列表已恢复，清除等待状态
    if (waitingForExternal) {
      setWaitingForExternal(false);
    }
    
    if (coursewareIndex !== undefined) {
      const cwIndex = parseInt(coursewareIndex, 10);
      if (!isNaN(cwIndex) && cwIndex >= 0 && cwIndex < coursewares.length) {
        // 路由参数有效，使用路由参数
        if (cwIndex !== currentCoursewareIndex) {
          setCurrentCoursewareIndex(cwIndex);
        }
      } else {
        // 路由参数无效，使用恢复的索引或默认值0
        const validIndex = currentCoursewareIndex < coursewares.length 
          ? currentCoursewareIndex 
          : 0;
        setCurrentCoursewareIndex(validIndex);
        // 更新URL以匹配有效的索引
        navigate(`/player/${validIndex}/${pageIndex || 0}`, { replace: true });
      }
    } else {
      // 如果没有路由参数，使用恢复的索引，并更新URL
      const validIndex = currentCoursewareIndex < coursewares.length 
        ? currentCoursewareIndex 
        : 0;
      if (validIndex >= 0 && coursewares[validIndex]) {
        setCurrentCoursewareIndex(validIndex);
        navigate(`/player/${validIndex}/${pageIndex || 0}`, { replace: true });
      }
    }
  }, [coursewareIndex, coursewares.length, setCurrentCoursewareIndex, navigate, pageIndex, isLoading, waitingForExternal, bundledCoursewareGroups.length]);

  useEffect(() => {
    if (pageIndex && courseware) {
      const index = parseInt(pageIndex, 10);
      if (!isNaN(index) && index >= 0 && index < courseware.pages.length) {
        setCurrentIndex(index);
      } else {
        // 如果页面索引无效，设置为0
        setCurrentIndex(0);
        navigate(`/player/${currentCoursewareIndex}/0`, { replace: true });
      }
    } else if (courseware && courseware.pages.length > 0) {
      // 如果没有页面索引，设置为0
      setCurrentIndex(0);
    }
  }, [pageIndex, courseware, currentCoursewareIndex, navigate]);


  // 初始化iframe：注入脚本、初始化动画和交互
  useEffect(() => {
    if (iframeRef.current && courseware) {
      const iframe = iframeRef.current;
      
      const initIframe = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const iframeWin = iframe.contentWindow;
          if (!iframeDoc || !iframeWin) return;

          // 等待body元素存在
          if (!iframeDoc.body) {
            console.warn('iframe body is not available yet, retrying...');
            setTimeout(initIframe, 100);
            return;
          }

          // 等待DOM完全加载
          if (iframeDoc.readyState !== 'complete' && iframeDoc.readyState !== 'interactive') {
            console.log('Waiting for iframe document to be ready, current state:', iframeDoc.readyState);
            setTimeout(initIframe, 100);
            return;
          }

          // 调试：检查iframe中的script标签和元素
          const scriptCount = iframeDoc.querySelectorAll('script').length;
          console.log(`iframe contains ${scriptCount} script tags`);
          const toggleBtnCount = iframeDoc.querySelectorAll('.toggle-btn').length;
          console.log(`iframe contains ${toggleBtnCount} .toggle-btn elements`);
          
          // 检查按钮是否已经存在
          if (toggleBtnCount > 0) {
            const firstBtn = iframeDoc.querySelector('.toggle-btn') as HTMLElement;
            if (firstBtn) {
              console.log('First toggle button found:', firstBtn, 'has onclick:', !!(firstBtn as any).onclick);
              // 检查是否有事件监听器（通过检查是否有属性）
              console.log('Button attributes:', Array.from(firstBtn.attributes).map(a => `${a.name}=${a.value}`));
            }
          }

          // 手动执行script标签中的代码（因为srcDoc可能不会自动执行script）
          // 检查是否已经有script执行过的标记
          if (!iframeDoc.body.hasAttribute('data-scripts-executed')) {
            const scripts = Array.from(iframeDoc.querySelectorAll('script:not([src])')); // 只处理内联script
            console.log(`Found ${scripts.length} inline scripts to execute`);
            
            // 使用 Promise 确保所有脚本按顺序执行完成
            const executeScripts = async () => {
              for (let index = 0; index < scripts.length; index++) {
                const script = scripts[index];
                try {
                  let scriptContent = script.textContent || script.innerHTML;
                  if (scriptContent.trim()) {
                    console.log(`[脚本执行] 开始执行脚本 ${index + 1}/${scripts.length}`);
                    
                    // 如果script中有DOMContentLoaded监听器，提取函数体直接执行
                    // 因为使用 srcDoc 时，DOM 已经加载完成，DOMContentLoaded 不会触发
                    let finalScript = scriptContent;
                    
                    if (scriptContent.includes('DOMContentLoaded')) {
                      // 匹配: document.addEventListener('DOMContentLoaded', function() { ... });
                      // 支持单引号和双引号，以及可能的空白字符
                      const domContentLoadedRegex = /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*function\s*\(\s*\)\s*\{/;
                      const match = scriptContent.match(domContentLoadedRegex);
                      
                      if (match && match.index !== undefined) {
                        // 找到函数体的开始位置（在 function() { 之后）
                        const functionStart = match.index + match[0].length;
                        let braceCount = 1; // 从第一个 { 开始计数
                        let functionEnd = -1;
                        let inString = false;
                        let stringChar = '';
                        
                        // 找到匹配的结束括号，需要处理字符串中的括号
                        for (let i = functionStart; i < scriptContent.length; i++) {
                          const char = scriptContent[i];
                          const prevChar = i > 0 ? scriptContent[i - 1] : '';
                          
                          // 处理字符串（单引号或双引号）
                          if (!inString && (char === '"' || char === "'")) {
                            inString = true;
                            stringChar = char;
                          } else if (inString && char === stringChar && prevChar !== '\\') {
                            inString = false;
                            stringChar = '';
                          }
                          
                          // 只有在非字符串中才计算括号
                          if (!inString) {
                            if (char === '{') braceCount++;
                            if (char === '}') {
                              braceCount--;
                              if (braceCount === 0) {
                                functionEnd = i;
                                break;
                              }
                            }
                          }
                        }
                        
                        if (functionEnd > functionStart) {
                          // 提取函数体并立即执行（包装为 IIFE）
                          const functionBody = scriptContent.substring(functionStart, functionEnd);
                          finalScript = `(function() {${functionBody}})();`;
                          console.log(`[脚本执行] 提取并转换 DOMContentLoaded 函数体，长度: ${functionBody.length}`);
                          console.log(`[脚本执行] 提取的函数体前100字符: ${functionBody.substring(0, 100)}`);
                        } else {
                          console.warn('[脚本执行] 无法找到 DOMContentLoaded 函数体的结束位置');
                          console.warn(`[脚本执行] 脚本内容: ${scriptContent.substring(0, 200)}`);
                        }
                      } else {
                        console.warn('[脚本执行] 无法匹配 DOMContentLoaded 模式');
                        console.warn(`[脚本执行] 脚本内容: ${scriptContent.substring(0, 200)}`);
                      }
                    }
                    
                    // 使用 DOM 注入方式执行脚本（最可靠的方式）
                    // 这样可以确保脚本在正确的上下文中执行，并且能正确绑定事件监听器
                    const newScript = iframeDoc.createElement('script');
                    newScript.textContent = finalScript;
                    
                    // 监听脚本加载完成
                    newScript.onload = () => {
                      console.log(`[脚本执行] 脚本 ${index + 1} 通过 DOM 注入执行成功`);
                    };
                    
                    newScript.onerror = (error) => {
                      console.error(`[脚本执行] 脚本 ${index + 1} 执行失败:`, error);
                    };
                    
                    // 将脚本添加到 head 或 body
                    const targetContainer = iframeDoc.head || iframeDoc.body;
                    targetContainer.appendChild(newScript);
                    console.log(`[脚本执行] 脚本 ${index + 1} 已注入到 DOM`);
                  }
                } catch (e) {
                  console.error(`[脚本执行] 脚本 ${index + 1} 执行失败:`, e);
                }
              }
              
              // 所有脚本执行完成后，标记已执行
              iframeDoc.body.setAttribute('data-scripts-executed', 'true');
              console.log('[脚本执行] 所有脚本执行完成');
              
              // 验证展开功能是否正常工作
              setTimeout(() => {
                const toggleButtons = iframeDoc.querySelectorAll('.toggle-btn');
                console.log(`[脚本执行] 验证：找到 ${toggleButtons.length} 个展开按钮`);
                toggleButtons.forEach((btn, idx) => {
                  const btnEl = btn as HTMLElement;
                  const targetId = btnEl.getAttribute('data-target');
                  console.log(`[脚本执行] 按钮 ${idx + 1}: data-target="${targetId}"`);
                  
                  // 检查是否有目标元素
                  if (targetId) {
                    const target = iframeDoc.querySelector(targetId);
                    if (target) {
                      console.log(`[脚本执行] 按钮 ${idx + 1} 的目标元素存在`);
                    } else {
                      console.warn(`[脚本执行] 按钮 ${idx + 1} 的目标元素不存在: ${targetId}`);
                    }
                  }
                });
              }, 100);
            };
            
            // 延迟执行脚本，确保 DOM 完全准备好
            // 使用 setTimeout 而不是微任务，因为需要等待所有元素都渲染完成
            setTimeout(() => {
              executeScripts().catch(console.error);
            }, 200);
          }

          // 公式渲染已由课件HTML中的脚本处理，框架不再处理
          // 课件HTML中包含auto-render脚本，会自动渲染公式

          // 设置滚动监听，更新导航栏选中状态
          const handleScroll = () => {
            // 防抖，避免频繁更新
            if (scrollUpdateTimerRef.current) {
              clearTimeout(scrollUpdateTimerRef.current);
            }
            
            scrollUpdateTimerRef.current = window.setTimeout(() => {
              if (!courseware) return;
              
              const scrollY = iframeWin.scrollY;
              const viewportHeight = iframeWin.innerHeight;
              const scrollCenter = scrollY + viewportHeight / 2;
              
              // 找到当前滚动位置对应的section
              let activeIndex = 0;
              let minDistance = Infinity;
              
              courseware.pages.forEach((page, index) => {
                const section = iframeDoc.querySelector(page.sectionSelector) as HTMLElement;
                if (section) {
                  const sectionTop = section.offsetTop;
                  const sectionHeight = section.scrollHeight;
                  const sectionCenter = sectionTop + sectionHeight / 2;
                  const distance = Math.abs(scrollCenter - sectionCenter);
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    activeIndex = index;
                  }
                }
              });
              
              // 获取当前URL中的索引
              const currentPath = window.location.pathname;
              // 匹配 /player/{coursewareIndex}/{pageIndex} 或 /player/{pageIndex}
              const match = currentPath.match(/\/player\/(\d+)(?:\/(\d+))?/);
              const currentUrlIndex = match && match[2] ? parseInt(match[2], 10) : (match ? parseInt(match[1], 10) : 0);
              
              // 如果计算出的索引与URL中的索引不同，更新URL（这会触发导航栏更新）
              if (activeIndex !== currentUrlIndex) {
                navigate(`/player/${currentCoursewareIndex}/${activeIndex}`, { replace: true });
              }
            }, 150); // 150ms防抖
          };
          
          iframeWin.addEventListener('scroll', handleScroll, { passive: true });
          
          // 存储handler以便清理
          (iframeWin as any).__scrollHandler = handleScroll;
        } catch (e) {
          console.error('Failed to initialize iframe:', e);
        }
      };

      // 等待iframe加载完成
      const waitForIframeLoad = () => {
        if (iframe.contentDocument?.readyState === 'complete') {
          // 确保script已经执行，再等待一点时间
          setTimeout(initIframe, 200);
        } else {
          // 如果还没加载完成，继续等待
          setTimeout(waitForIframeLoad, 100);
        }
      };

      // 监听iframe的load事件
      iframe.onload = () => {
        // iframe加载完成后，再等待一段时间确保script执行
        setTimeout(initIframe, 200);
      };

      // 如果iframe已经加载完成，直接初始化
      if (iframe.contentDocument?.readyState === 'complete') {
        setTimeout(initIframe, 200);
      } else {
        // 否则等待加载
        waitForIframeLoad();
      }

      // 清理函数
      return () => {
        try {
          const iframeWin = iframe.contentWindow;
          
          // 清理滚动监听器
          if (iframeWin && (iframeWin as any).__scrollHandler) {
            iframeWin.removeEventListener('scroll', (iframeWin as any).__scrollHandler);
            delete (iframeWin as any).__scrollHandler;
          }
          
          // 清理防抖定时器
          if (scrollUpdateTimerRef.current) {
            clearTimeout(scrollUpdateTimerRef.current);
            scrollUpdateTimerRef.current = null;
          }
        } catch (e) {
          console.error('Failed to cleanup:', e);
        }
      };
    }
  }, [currentIndex, courseware]);


  // 当currentIndex变化时，滚动iframe到对应的section
  useEffect(() => {
    if (iframeRef.current && courseware && courseware.pages[currentIndex]) {
      const iframe = iframeRef.current;
      const page = courseware.pages[currentIndex];
      
      const scrollToSection = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const iframeWin = iframe.contentWindow;
          if (iframeDoc && iframeWin) {
            const section = iframeDoc.querySelector(page.sectionSelector);
            if (section) {
              const sectionEl = section as HTMLElement;
              iframeWin.scrollTo({ top: sectionEl.offsetTop, behavior: 'smooth' });
            }
          }
        } catch (e) {
          console.error('Failed to scroll to section:', e);
        }
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        setTimeout(scrollToSection, 100);
      }
    }
  }, [currentIndex, courseware]);

  // 如果正在等待外部课件加载，显示加载状态
  if (waitingForExternal || (coursewares.length === 0 && isLoading)) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Typography.Title level={3}>正在加载课件...</Typography.Title>
        <Text type="secondary" style={{ display: 'block', marginTop: '16px' }}>
          请稍候，正在从外部仓库加载课件
        </Text>
      </div>
    );
  }

  if (!courseware) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Title level={3}>暂无课件</Typography.Title>
        <Text type="secondary" style={{ display: 'block', marginTop: '16px', marginBottom: '16px' }}>
          课件列表为空，可能是刷新后数据丢失。请从首页重新选择课件。
        </Text>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  const currentPage = courseware.pages[currentIndex];
  if (!currentPage) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Title level={3}>页面不存在</Typography.Title>
        <Button onClick={() => navigate('/catalog')}>返回目录</Button>
      </div>
    );
  }

  const handlePrev = () => {
    const currentGlobalIndex = getCurrentGlobalIndex;
    if (currentGlobalIndex > 0) {
      const prevPage = getPageByGlobalIndex(currentGlobalIndex - 1);
      if (prevPage) {
        setCurrentCoursewareIndex(prevPage.coursewareIndex);
        setCurrentIndex(prevPage.pageIndex);
        navigate(`/player/${prevPage.coursewareIndex}/${prevPage.pageIndex}`);
      }
    }
  };

  const handleNext = () => {
    const currentGlobalIndex = getCurrentGlobalIndex;
    const { totalPages } = getGlobalPageInfo;
    if (currentGlobalIndex < totalPages - 1) {
      const nextPage = getPageByGlobalIndex(currentGlobalIndex + 1);
      if (nextPage) {
        setCurrentCoursewareIndex(nextPage.coursewareIndex);
        setCurrentIndex(nextPage.pageIndex);
        navigate(`/player/${nextPage.coursewareIndex}/${nextPage.pageIndex}`);
      }
    }
  };

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* 上一页按钮 */}
      {getCurrentGlobalIndex > 0 && (
        <Button
          type="primary"
          shape="circle"
          icon={<LeftOutlined />}
          onClick={handlePrev}
          size="large"
          style={{
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            background: 'rgba(0,0,0,0.2)',
          }}
        />
      )}

      {/* 下一页按钮 */}
      {getCurrentGlobalIndex < getGlobalPageInfo.totalPages - 1 && (
        <Button
          type="primary"
          shape="circle"
          icon={<RightOutlined />}
          onClick={handleNext}
          size="large"
          style={{
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            background: 'rgba(0,0,0,0.2)',
          }}
        />
      )}

      {/* 页码指示器 */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.2)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
        }}
      >
        <Text style={{ color: '#fff' }}>
          {getCurrentGlobalIndex + 1} / {getGlobalPageInfo.totalPages}
          {coursewares.length > 1 && (
            <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.8 }}>
              ({courseware?.title || `课件${currentCoursewareIndex + 1}`} - 第{currentIndex + 1}页)
            </span>
          )}
        </Text>
      </div>

      {/* iframe展示完整HTML */}
      <iframe
        ref={iframeRef}
        srcDoc={courseware.fullHTML}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        sandbox="allow-same-origin allow-scripts allow-forms"
        title="课件内容"
      />
    </div>
  );
};

export default CoursewarePlayer;
