import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useCourseware } from '../context/CoursewareContext';

const { Text } = Typography;

const CoursewarePlayer: React.FC = () => {
  const { coursewareIndex, pageIndex } = useParams<{ coursewareIndex?: string; pageIndex: string }>();
  const navigate = useNavigate();
  const { coursewares, currentCoursewareIndex, setCurrentCoursewareIndex, courseware } = useCourseware();
  const [currentIndex, setCurrentIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollUpdateTimerRef = useRef<number | null>(null); // 滚动更新防抖定时器

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
  useEffect(() => {
    if (coursewareIndex !== undefined) {
      const cwIndex = parseInt(coursewareIndex, 10);
      if (!isNaN(cwIndex) && cwIndex >= 0 && cwIndex < coursewares.length) {
        setCurrentCoursewareIndex(cwIndex);
      }
    }
  }, [coursewareIndex, coursewares.length, setCurrentCoursewareIndex]);

  useEffect(() => {
    if (pageIndex) {
      const index = parseInt(pageIndex, 10);
      if (!isNaN(index) && courseware && index >= 0 && index < courseware.pages.length) {
        setCurrentIndex(index);
      }
    }
  }, [pageIndex, courseware]);


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
            const scripts = iframeDoc.querySelectorAll('script:not([src])'); // 只处理内联script
            console.log(`Found ${scripts.length} inline scripts to execute`);
            
            scripts.forEach((script, index) => {
              try {
                let scriptContent = script.textContent || script.innerHTML;
                if (scriptContent.trim()) {
                  console.log(`Executing script ${index + 1}/${scripts.length}`);
                  
                  // 如果script中有DOMContentLoaded监听器，提取函数体直接执行
                  // 使用更简单的方法：直接将 DOMContentLoaded 替换为立即执行的代码
                  let finalScript = scriptContent;
                  
                  if (scriptContent.includes('DOMContentLoaded')) {
                    // 方法1: 直接替换 DOMContentLoaded 为立即执行的IIFE
                    // 匹配: document.addEventListener('DOMContentLoaded', function() { ... });
                    finalScript = scriptContent.replace(
                      /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*function\s*\(\s*\)\s*\{/g,
                      '(function() {'
                    );
                    
                    // 如果替换成功，需要将最后的 }) 改为 })();
                    if (finalScript !== scriptContent) {
                      // 找到最后一个 }) 并替换为 })();
                      const lastMatch = finalScript.match(/\}\)\s*;?\s*$/);
                      if (lastMatch) {
                        finalScript = finalScript.replace(/\}\)\s*;?\s*$/, '})();');
                      } else {
                        // 如果没有找到，尝试在最后添加 ();
                        const lastCloseBrace = finalScript.lastIndexOf('})');
                        if (lastCloseBrace !== -1) {
                          finalScript = finalScript.substring(0, lastCloseBrace + 2) + '();' + finalScript.substring(lastCloseBrace + 2);
                        }
                      }
                      console.log('Converted DOMContentLoaded to IIFE');
                    } else {
                      // 如果替换失败，尝试提取函数体
                      const functionStart = scriptContent.indexOf('function()');
                      if (functionStart !== -1) {
                        const openBrace = scriptContent.indexOf('{', functionStart);
                        if (openBrace !== -1) {
                          let braceCount = 0;
                          let functionEnd = -1;
                          for (let i = openBrace; i < scriptContent.length; i++) {
                            if (scriptContent[i] === '{') braceCount++;
                            if (scriptContent[i] === '}') {
                              braceCount--;
                              if (braceCount === 0) {
                                functionEnd = i;
                                break;
                              }
                            }
                          }
                          
                          if (functionEnd > openBrace) {
                            const functionBody = scriptContent.substring(openBrace + 1, functionEnd).trim();
                            finalScript = functionBody;
                            console.log('Extracted function body as fallback');
                          }
                        }
                      }
                    }
                  }
                  
                  // 关键修复：使用 iframeWin.eval 或 Function 构造函数，确保在 iframe 的 window 上下文中执行
                  // 这样 script 中的 document 和 window 都会指向 iframe 的
                  // 延迟执行，确保所有元素都已加载
                  setTimeout(() => {
                    try {
                      // 方法1: 直接使用 iframeWin.eval，这样执行上下文就是 iframe 的 window
                      // eval 会在调用它的上下文中执行，所以 document 和 window 都会指向 iframe 的
                      console.log('Executing script in iframe window context using eval');
                      (iframeWin as any).eval(finalScript);
                      console.log('Script executed successfully via eval');
                      
                      // 验证：检查事件是否绑定成功
                      setTimeout(() => {
                        const verifyBtn = iframeDoc.querySelector('.toggle-btn') as HTMLElement;
                        if (verifyBtn) {
                          console.log('Verifying event binding after execution');
                          // 尝试手动触发一次点击来验证
                          const clickEvent = new (iframeWin as any).MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: iframeWin
                          });
                          verifyBtn.dispatchEvent(clickEvent);
                          console.log('Verification click event dispatched');
                        }
                      }, 100);
                    } catch (evalError) {
                      console.warn('eval failed, trying Function constructor', evalError);
                      try {
                        // 方法2: 使用 Function 构造函数
                        const func = new (iframeWin as any).Function(finalScript);
                        func.call(iframeWin);
                        console.log('Script executed successfully via Function constructor');
                      } catch (funcError) {
                        console.error('Function constructor also failed, falling back to DOM injection', funcError);
                        // 方法3: 回退到 DOM 注入
                        const newScript = iframeDoc.createElement('script');
                        newScript.textContent = finalScript;
                        iframeDoc.body.appendChild(newScript);
                        console.log('Script executed via DOM injection as fallback');
                      }
                    }
                  }, 100); // 延迟100ms执行，确保DOM完全加载
                  
                  // 验证执行：检查按钮是否有事件监听器
                  setTimeout(() => {
                    const testBtn = iframeDoc.querySelector('.toggle-btn') as HTMLElement;
                    if (testBtn) {
                      console.log('After script execution - button found:', testBtn);
                      console.log('Button click handlers check - onclick:', !!(testBtn as any).onclick);
                      
                      // 尝试获取事件监听器（如果可能）
                      // 注意：标准API无法直接获取addEventListener绑定的事件，但我们可以测试
                      console.log('Testing if addEventListener works by manually triggering click');
                      try {
                        // 创建一个测试事件
                        const testEvent = new (iframeWin as any).MouseEvent('click', {
                          bubbles: true,
                          cancelable: true,
                          view: iframeWin
                        });
                        // 手动触发（这会触发所有监听器）
                        testBtn.dispatchEvent(testEvent);
                        console.log('Test click event dispatched');
                      } catch (e) {
                        console.warn('Failed to dispatch test event:', e);
                      }
                    } else {
                      console.warn('No toggle button found after script execution');
                    }
                  }, 200);
                  
                  console.log('Executed script via DOM injection, script length:', finalScript.length);
                }
              } catch (e) {
                console.error(`Failed to execute script ${index + 1}:`, e);
              }
            });
            
            // 标记已执行
            iframeDoc.body.setAttribute('data-scripts-executed', 'true');
          }

          // 公式渲染已由课件HTML中的脚本处理，框架不再处理
          // 课件HTML中包含auto-render脚本，会自动渲染公式
          mathRenderedRef.current = true;

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

  if (!courseware) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Typography.Title level={3}>暂无课件</Typography.Title>
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
