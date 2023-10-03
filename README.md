## mp-canvas-drawer

小程序海报绘制分享的完整解决方案，支持绘制，保存到相册，自动获取用户相册权限整套流程，开发者调用简单的方法即可完成复杂海报的绘制，彻底解决小程序海报绘制的难题。

## 安装

```bash
npm install mp-canvas-drawer --save
```

在小程序中需要构建 npm [官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

## 功能

1. 支持绘制图片
    * 支持可选是否自动切成圆角图片
    * 支持圆角模式下设置边框宽度，以及边框颜色
        > 该选项针对你要生成二维码的场景极其有用

2. 支持绘制文本
    * 支持批量绘制文本
    * 支持绘制动态文本，并可以自定义文本左右间距
    * 支持自定义文本颜色、字号、字重、对齐方式

3. 支持绘制图形
    * 可以绘制简单的圆和矩形，复杂的图形推荐以图片的形式绘制。

4. 使用canvas2d实现，支持同层渲染且性能更佳。

### 使用

先在页面或组件的wxml中添加canvas组件，宽高照你的实际设计稿宽高定义就可以，一般情况下是750。

``` html
<canvas type="2d" id="myCanvas" class="canvas" style="width: {{width}}rpx; height: {{height}}rpx" ></canvas>

```

 在页面或组件中导入，并且初始化

 ``` js
 // W2P == wxml to post
 import W2P from 'mp-canvas-drawer';

 onLoad(){
   wx.showLoading({ title: '请稍等...', mask: true });
   this.w2p = new W2P('#myCanvas', { bgColor: '#ffffff', radius: 32 }, this);
   this.w2p.init().then(() => {
       this.drawSharePoster(); // 初始化完成后就可以开始画了
       // 元素画完后，调用canvasExport方法把画布导出，之后就可以调用saveImage让用户把图片保存到相册。
       // 注意导出完成之后再允许用户操作保存
       this.w2p.canvasExport().then(() => wx.hideLoading());
   });
 }

 ```

 工具类接受以下参数：

 ``` js
 new W2P(canvasId, instance, container, designWindowWidth)
 ```

 |  参数 | 说明    | 是否必填 |
 | :-------------: | :----------: | :---:|
 | canvasId | 告知工具要绘制哪个canvas组件| 是 |
 | instance | 页面或组件的实例对象，即this，在页面中使用时可以不传，会默认取`wx.createSelectorQuery`[参见](https://developers.weixin.qq.com/miniprogram/dev/api/wxml/wx.createSelectorQuery.html)，组件中使用时必传，因为要获取这个实例上的canvas组件 | 否 |
 |container |  海报图容器参数，该参数是一个对象，可以设置背景颜色和圆角 {bgColor, radius} | 否|
 |container.bgColor| 背景颜色，默认'#ffffff'| 否|
 |container.radius | 添加圆角，默认0| 否|
 |designWindowWidth | 设计稿尺寸, 默认750，即使用rpx为单位，推荐使用rpx，可以自动适配机型，如果你是375的稿子自己将值乘2就可以了。| 否|

### 绘制海报

``` js
// 绘制海报
async drawSharePoster(){
    ... // 按需调用下面的方法进行绘制
}

```

``` js
 // 绘制背景图，填写图片资源，起始点坐标（x, y），宽高
 await this.w2p.drawImage('https://.../a.png', 0, 0, 618, 868);
```

``` js
 const adjustTimes = await geAdjustTimes(); // 这里只是举例，使用时动态数据建议提前获取
/* 绘制包含动态文本的行 */
this.w2p.drawDynamicTextsRow({
   texts: ['2022年，油价经历', adjustTimes, '次调整'], // 该行要绘制的文本
   originX: 48,  // 该行起始x坐标，即文本距离海报容器左边框的距离
   // 以下参数既可作为通用参数，也可作为个性化参数，填写个性化参数后会覆盖通用参数值
   originY: 239, // 该行起始y坐标，即文本距离海报容器上边框的距离
   textMargin: 10, // 文本左间距（从第二个文本开始生效）
   size: 28, // 该行字体大小
   bold: 600, // 文字字重
   color: '#470D00', // 该行文字颜色
});
```

``` js
 /* 绘制动态文本行，并且个性化插入文本 */
this.w2p.drawDynamicTextsRow({
    texts: [
      { text: '我在XXXX共加油' },
      // 数字样式个性化突出
      { text: useTimes, color: '#F44505', size: 44, originY: 369 },
      { text: '次' },
    ],
    originX: 48, originY: 380, textMargin: 10, size: 28, color: '#470D00'
});
```

``` js
 // 绘制静态文本
 // 参数依次为：文本 | x | y | 字号 | 颜色 | 字重 | 水平对齐方式可选left（不传默认）、center、right| 垂直对齐方式可选top（默认）、middle、bottom
 this.w2p.drawText('长按扫码', 172, 552, 28, '#000000', 600, 'left', 'top' );
```

``` js
 // 批量绘制文本
 const texts = [
   { text: '长按扫码', x: 172, y: 552, size: 28, bold: 500, color: '#000000' },
   { text: '查看你的城市油价排名', x: 172, y: 592, size: 28, bold: 600, color: '#eeeeee' },
 ];
 this.w2p.drawTexts(texts);
```

``` js
 // 给图片绘制边框（二维码场景常用）
 // 参数依次为：图片链接 | x | y | 宽 | 高 | 是否切成圆形 | 圆形模式下边框宽度| 圆形模式下边框颜色
 await this.w2p.drawImage('https://.../qrcode.png', 48, 516, 104, 104, true, 20, '#ffffff');
```

``` js
 // 绘制简单的圆形
 // 参数依次为：x | y | 半径 | 颜色 | 样式可选填充fill（默认）、线stroke
 this.w2p.drawCircular(123, 456, 20, color = '#ffffff', 'fill')
```

``` js
 // 绘制简单的矩形
 // 参数依次为：x | y | 宽 | 高 | 圆角默认0 | 颜色 | 样式可选填充fill（默认）、线stroke
 this.w2p.drawRect(123, 456, 40, 40, 6, color = '#666666', 'stroke')
```

工具内已经为你做好了保存到相册授权相关，其他更多细节，可参考[博客](https://juejin.cn/post/7130659159980113956)
