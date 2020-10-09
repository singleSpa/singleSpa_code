- xxx.test 比较好理解，就是测试的意思
- xxx.spec 中的 spec 是 specification 的缩写，表示规格，也就是 xxx 应该满足的规则，所以 xxx.spec.js 表示对 xxx 应该满足的规则。
- xxx.unit 中的 unit 就是单元测试的意思。

- 入口文件
```jsx harmony
{input: "./src/single-spa.js"}
```

- 入口文件导出
    - start 启动
    - ensureJQuerySupport  确保支持jquery 
    - setBootstrapMaxTime  全局配置初始化超时时间 默认4000ms
    - setMountMaxTime      全局配置挂载超时时间 默认3000ms
    - setUnmountMaxTime    全局配置卸载超时时间 默认3000ms
    - setUnloadMaxTime     全局配置移除超时时间 默认3000ms
    - registerApplication  注册子应用，调用这个方法可以在single-spa中注册一个应用
    - getMountedApps       当前已经挂载应用的名字。
    - getAppStatus         获取某个应用的当前状态
    - unloadApplication    在一个已经注册的应用上，调用 unload lifecyle 方法。将次应用的状态置为 NOT_LOADED。触发路由重定向，在此期间single-spa可能会挂载刚刚卸载的应用程序
    - checkActivityFunctions  将会调用每个应用的 mockWindowLocation 并且返回一个根据当前路判断那些应用应该被挂载的列表。
    - getAppNames          当前应用的名字（任何状态的应用）。
    - pathToActiveWhen     将字符串URL路径转换为活动函数。字符串路径可能包含路由参数，single-spa将匹配任何字符
    - navigateToUrl        使用这个通用方法来轻松的实现在不同注册应用之前的切换，而不必需要处理 event.preventDefault(), pushState, triggerAppChange() 等待
    - triggerAppChange     返回一个Promise对象，当所有应用挂载/卸载时它执行 resolve/reject 方法，它一般被用来测试single-spa，在生产环境可能不需要。
    - addErrorHandler      添加处理程序，该处理程序将在应用在生命周期函数或激活函数期间每次抛出错误时调用。当没有错误处理程序时，single-spa将错误抛出到窗口
    - removeErrorHandler   删除给定的错误处理程序函数。
    - mountRootParcel      将会创建并挂载一个 single-spa parcel.注意:Parcel不会自动卸载。卸载需要手动触发。


#### 微前端的一些基本概念

- 在single-spa中，有以下三种微前端类型：
  
  - single-spa applications:为一组特定路由渲染组件的微前端。
  - single-spa parcels(沙箱): 不受路由控制，渲染组件的微前端。
  - utility modules: 非渲染组件，用于暴露共享javascript逻辑的微前端。
  
  一个web应用可能包含一种或多种类型的微前端
  
   | 主题 | 应用程序 | 沙箱 | 公共模块 |
   | ------ | ------ | ------ | ------ |
   | 路由 | 有多个路由 | 无路由 | 无路由 |
   | API | 声明API | 必要的API | 没有single-spa API | 
   | 渲染UI | 渲染UI | 渲染UI | 不直接渲染UI | 
   | 生命周期 | single-spa管理生命周期 | 自定义管理生命周期 | 没有生命周期 |
   | 什么时候用 | 核心构建块 | 只需要与多个框架 | 用于共享公共逻辑或创建服务 |
   
   > 每个微前端都是一个浏览器内的JavaScript模块(说明).
  
  
  - 运行时模块，当被引用和导出时不会被构建工具编译，它直接被浏览器解析。它是与构建时模块的不同之处，他们在被浏览器解析前需要由node_modules提供并编译
  
- 告诉webpack和rollup在构建期间保留一些依赖项，以便它们来自浏览器的方法是通过webpack externals和rollup externals。
  
  > 以下是我们的推荐:
  
  - 每个single-spa应用程序都应该是一个浏览器内的Javascript模块
  - 大型共享依赖(比如react、vue或angular库)应该都是浏览器内的模块。
  - 其他的都应该是构建时模块。
  
- JS中的沙箱创建方式有哪些?

- “挂载”(mounted)的概念指的是被注册的应用内容是否已展示在DOM上

- 在一个 single-spa 页面，注册的应用会经过下载(loaded)、初始化(initialized)、被挂载(mounted)、卸载(unmounted)和unloaded（被移除）等过程。

single-spa会通过“生命周期”为这些过程提供钩子函数。


#### single-spa parcels(沙箱)

> import * as singleSpa from 'single-spa'
- singleSpa.registerApplication() 入口，注册app
    - sanitizeArguments 格式化传入的参数
    - 格式化应用配置放入apps数组中，
        - 这里会格式化4个属性，也是入口传入的4个参数，这里是源头
        - `status:NOT_LOADED`,后面会根据这个status切换状态（第一次修改状态）
        - 和loadApp属性（其实就是入口的第二个参数，是个函数），后面会操作这个函数
        - activeWhen
        - customProps
    - 通过ensureJQuerySupport增加jquery补丁
    - reroute(pendingPromises, eventArguments) 路由切换时触发,此时传的参数为空
        - 通过getAppChanges把应用分4类
            - 核心方法是遍历apps，根据status不同，放入不同的数组
            - 第一次注册都是NOT_LOADED，全部放到了appsToLoad数组
            - appsToUnload数组， 需要被移除的
            - appsToUnmount数组， 需要被卸载的
            - appsToLoad数组， 需要被加载的
            - appsToMount数组， 需要被挂载的
        - 调用isStarted()判断是否启动。事实上应用在注册是还没启动，因此这里是走else
            - 给appsThatChanged赋值appsToLoad，
            - loadApps()，返回promise，通过微任务加载apps
                - 遍历appsToLoad， 每一个app都通过toLoadPromise处理
                    - 重点说一下toLoadPromise
                        - 已经在被加载，直接返回状态app.loadPromise
                        - ！NOT_LOADED && ！LOAD_ERROR 没有加载或者加载失败，返回app
                        - 其它情况`app.status = LOADING_SOURCE_CODE`(第二次修改状态)状态设置为正在更改
                        - 最后返回一个app.loadPromise的promise，来看看app.loadPromise
                            - 通过getProps(app)获取{customProps: '', name: '',mountParcel: '', singleSpa: '', unmountSelf: ''}
                            - 把获取的参数传入loadApp，这个loadApp是用户在入口传入的第二个参数。然后返回loadPromise的一个promise
                                - `const loadPromise = app.loadApp(getProps(app));`
                                - 执行这个promise，loadPromise.then
                                    - 先加一堆校验，不符合框架规则的抛出错误
                                    - 如果有devtools和devtools.overlays赋值给app.devtools.overlays
                                    - 修改状态，`app.status = NOT_BOOTSTRAPPED;`（这里应该是第三次修改状态）
                                    - 挂载各种生命周期方法到app上
                                        - app.bootstrap = flattenFnArray(appOpts, "bootstrap");
                                        - app.mount = flattenFnArray(appOpts, "mount");
                                        - app.unmount = flattenFnArray(appOpts, "unmount");
                                        - app.unload = flattenFnArray(appOpts, "unload");
                                        - app.timeouts = ensureValidAppTimeouts(appOpts.timeouts);
                                    - 删除app.loadPromise，返回app
                                    - 如果报错了就修改状态SKIP_BECAUSE_BROKEN（运行出错）或者LOAD_ERROR(加载失败)
                - 遍历后的appsToLoad返回被操作过得app,此时的app已经很丰富了，此时再让每个app执行callAllEventListeners
                    - 来看 callAllEventListeners 
                        - 第一个方法 pendingPromises.forEach其实是空数组，没执行
                        - 第二个方法 callCapturedEventListeners(eventArguments)，其实也没参数
                        - 所有这一次两个方法都跑空了。
                - 注册逻辑就完成了。下面该start逻辑了。
- singleSpa.start(opts) 参数可选
    - 这个方法会让isStarted()返回true
    - 前置判断 opts.urlRerouteOnly
        - setUrlRerouteOnly，定义一个全局的urlRerouteOnly
    - 然后再调用reroute()，启动应用，这一次调用才是真正开始注册了
        - 首先执行 appChangeUnderway = true;
        - 然后合并了四个大类的数组，生成新的appsThatChanged数组，`其实此时只有appsToLoad有值`
        - 最后执行 performAppChanges(因为只有appsToLoad有值，所有此处只执行第八步和第九步)
            - 第一步执行了浏览器自定义事件 single-spa:before-no-app-change或者single-spa:before-app-change
                ```jsx harmony
              window.addEventListener('single-spa:before-no-app-change', (evt) => {
                  console.log('single-spa is about to do a no-op reroute');
                  console.log(evt.detail.originalEvent) // PopStateEvent
                  console.log(evt.detail.newAppStatuses) // { }
                  console.log(evt.detail.appsByNewStatus) // { MOUNTED: [], NOT_MOUNTED: [] }
                  console.log(evt.detail.totalAppChanges) // 0
              });
                ```
                - getCustomEventDetail(true)     
                    - 需要被加载的 && 需要被挂载的都是 设置为挂载完毕
                    - 需要被卸载的 设置为没有加载过
                    - 需要被卸载的 设置为没有挂载
                    - 返回这个detail，描述当前操作的app状态
            - 第二步执行自定义事件 single-spa:before-routing-event
                - getCustomEventDetail(true)     
                    - 同上     
            - 第三步执行 appsToUnload.map 移除应用，返回unloadPromises
                - toUnloadPromise
            - 第四步卸执行 appsToUnmount.map 载应用更改状态，执行unmount生命周期函数，卸载不需要的应用，挂载需要的应用
                - toUnmountPromise
                - toUnloadPromise
            - 第五步 合并 unmountUnloadPromises unloadPromises 生成allUnmountPromises
            - 第六步 执行 allUnmountPromises 返回 unmountAllPromise
            - 第七步 卸载全部完成后触发一个事件 single-spa:before-mount-routing-event
                - getCustomEventDetail
            - 第八步 遍历 appsToLoad.map
                - toLoadPromise
                    - tryToBootstrapAndMount
                        - 这里是start的核心逻辑，最终执行的是`appOrParcel.status = BOOTSTRAPPING;`（启动中，第四次改变状态）
                        - 执行 toMountPromise 正式挂载
                            - toMountPromise 中改变状态 `appOrParcel.status = MOUNTED;` （挂载完毕，第五次改变状态）
            - 第九步unmountAllPromise 执行
                - callAllEventListeners
                - 合并 loadThenMountPromises和mountPromises
                - 执行 finishUpAndReturn
                
- 更新逻辑其实和上面的步骤很多都一致，这里大概说一下核心原理

首先，我们需要重写浏览器的路由切换事件，在路由切换时触发 reroute， 
这个 reroute 在 `singleSpa.registerApplication()` 和 `singleSpa.start(opts)`都有调用。

我们重点看一下怎么重写的浏览器路由切换事件

single-spa涵盖了切换浏览器url的5种方法，这几种方法最后都会调用 reroute

- hashchange，hash路由发生改变时，会调用 reroute，更新应用的状态
- popstate，用户点击浏览器的回退前进按钮触发（或者在Javascript代码中调用history.back()， history.forward()）会触发。（需要注意的是调用history.pushState()或history.replaceState()不会触发popstate事件。）
- 如果是通过window.removeEventListener调用的，监听 hashchange 和 popstate
- 重写 window.history的 pushState，页面的跳转（前进后退，点击等）不重新请求页面，可以创建历史
- 重写 window.history的 replaceState，页面的跳转（前进后退，点击等）不重新请求页面， 替换掉当前的URL，不会产生历史。
# singleSpa_code
