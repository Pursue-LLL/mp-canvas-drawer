export default class CanvasDrawer {
  constructor(canvasId, instance, container, designWindowWidth = 750) {
    this.canvasId = canvasId; // canvasId
    this.compInstance = instance; // 组件中使用需传入组件实例
    this.container = container; // 海报图容器参数 {bgColor, radius}
    this.designWindowWidth = designWindowWidth; // 设计稿尺寸, 默认750
  }

  // 初始化
  init() {
    return new Promise((resolve, reject) => {
      // 创建节点查询器
      const query = (this.compInstance || wx).createSelectorQuery();
      query.select(this.canvasId)
        // 指定获取节点的相关信息，这里指定获取节点的尺寸和节点对应的 Node 实例（即canvas组件）
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res?.[0]?.node) reject('No canvas element found');
          const canvas = res[0].node;
          this.canvas = canvas;
          this.ctx = canvas.getContext('2d');
          // 根据不同机型像素比放大画布，让图片更清晰
          const { pixelRatio: dpr, windowWidth } = wx.getSystemInfoSync();
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          this.ctx.scale(dpr, dpr);
          // 海报图宽高自动获取画布宽高
          this.ratio = windowWidth / this.designWindowWidth;  // rpx与px转换比率
          this.container.width = res[0].width / this.ratio; // 转为rpx
          this.container.height = res[0].height / this.ratio;
          // 绘制海报图容器
          this.drawRectContainer(this.container);
          resolve();
        });
    });
  }

  // rpx转为px
  toPx(rpx) {
    return rpx * this.ratio;
  }

  /**
   * 绘制矩形容器
   *
   * @param {Object} params
   * @param {string} params.bgColor - 背景颜色
   * @param {number} params.width - 宽
   * @param {number} params.height - 高
   * @param {number} params.radius - 圆角默认0
   * @param {string} params.type - 容器类型，默认为fill，可选值为fill、stroke
   * @memberof CanvasDrawer
   */
  drawRectContainer({ bgColor = '#ffffff', width, height, radius, type = 'fill' } = {}) {
    this.drawRect(0, 0, width, height, radius, bgColor, type);
    // this.ctx.clip();  // 剪切矩形区域
  }

  /**
   * 绘制矩形
   *
   * @param {number} x - 左上角x坐标
   * @param {number} y - 左上角y坐标
   * @param {number} w - 宽
   * @param {number} h - 高
   * @param {number} radius - 圆角默认0
   * @param {string} color - 颜色
   * @param {string} type - 风格，默认为fill，可选值为fill、stroke
   * @memberof CanvasDrawer
   */
  drawRect(x, y, w, h, radius, color, type = 'fill') {
    // eslint-disable-next-line no-param-reassign
    x = this.toPx(x); y = this.toPx(y); w = this.toPx(w); h = this.toPx(h);
    this.ctx.save();
    const { ctx } = this;
    const rad = this.toPx(radius) || 0;
    ctx.beginPath();  // 开始创建一个路径
    ctx.moveTo(x, y + rad); // 把路径移动到画布中的指定点
    console.log("🚀 ~ file: canvasDrawer.js ~ line 79 ~ CanvasDrawer ~ drawRect ~ y + rad", y + rad)
    // 创建左边框
    ctx.lineTo(x, y + h - rad); // 增加一个新点，然后创建一条从上次指定点到目标点的线
    // 创建左下角圆角曲线
    ctx.quadraticCurveTo(x, y + h, x + rad, y + h); // 创建二次贝塞尔曲线路径，传入控制点x,y和终点x,y
    // 创建下边框
    ctx.lineTo(x + w - rad, y + h);
    // 创建右下角圆角曲线
    ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - rad);
    ctx.lineTo(x + w, y + rad);
    ctx.quadraticCurveTo(x + w, y, x + w - rad, y);
    ctx.lineTo(x + rad, y);
    ctx.quadraticCurveTo(x, y, x, y + rad);
    ctx[`${type}Style`] = color;  // 设置颜色
    ctx.closePath();  // 关闭路径
    ctx[type](); // 绘制或填充线条
    this.ctx.restore();
  }

  /**
   * 绘制圆形
   *
   * @param {number} x - 左上角x坐标
   * @param {number} y - 左上角y坐标
   * @param {number} r - 半径
   * @param {string} color - 颜色
   * @param {string} type - 风格，默认为fill，可选值为fill、stroke
   * @memberof CanvasDrawer
   */
  drawCircular(x, y, r, color = '#ffffff', type = 'fill') {
    const { ctx } = this;
    ctx.beginPath();
    // 创建一条弧线
    ctx.arc(this.toPx(x + r), this.toPx(y + r), this.toPx(r), 0, 2 * Math.PI);
    ctx.closePath();
    ctx[`${type}Style`] = color;
    ctx[type]();
  }

  /**
   * 绘制图片
   *
   * @param {string} src - 图片路径
   * @param {number} x - 左上角x坐标
   * @param {number} y - 左上角y坐标
   * @param {number} width - 宽
   * @param {number} height - 高
   * @param {number} round - 是否切成圆形图片
   * @param {number} borderwidth - 圆形模式下边框宽度
   * @param {string} borderColor - 圆形模式下边框颜色
   * @returns {Promise<void>}
   * @memberof CanvasDrawer
   */
  drawImage(src, x, y, width, height, round, borderwidth = 0, borderColor = '#ffffff') {
    return new Promise((resolve, reject) => {
      const img = this.canvas.createImage();
      img.onerror = reject;
      img.src = src;
      img.onload = () => {
        this.ctx.save();
        if (round) {
          const r = (width / 2) + borderwidth; // 半径
          this.drawCircular(x - borderwidth, y - borderwidth, r, borderColor);
          this.ctx.clip();
        }
        this.ctx.drawImage(img, this.toPx(x), this.toPx(y), this.toPx(width), this.toPx(height));
        this.ctx.restore();
        resolve();
      };
    });
  };

  /**
   * 绘制文本
   *
   * @param {string} text 文本字符串
   * @param {number} x - 横坐标位置
   * @param {number} y - 纵坐标位置
   * @param {number} size - 字体大小
   * @param {string} color - 字体颜色
   * @param {string} [bold='normal'] 字重，值同css font-weight属性，默认normal
   * @param {string} [align='left'] 对齐方式 left(x值不包含字体宽度), center(x值包含一半字体宽度), right(x值包含整个字体宽度)
   * @param {string} [baseLine='top'] top(y值不包含字体高度), middle(y值包含一半字体高度)，bottom(y值包含整个字体高度)
   * @returns 文本占用宽度
   * @memberof CanvasDrawer
   */
  drawText(text, x, y, size, color, bold = 'normal', align = 'left', baseLine = 'top', calWidth = false) {
    const str = `${text}`;  // 避免某些环境下字体宽度计算异常（如手图），这里统一将绘制文本转为字符串
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = `normal ${bold} ${~~(this.toPx(size))}px sans-serif`;
    let width = 0;
    if (calWidth) width = this.ctx.measureText(str).width; // 必须在设置字体属性后未绘制前计算才能拿到准确值; 无需计算时避免耗费性能
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseLine;
    this.ctx.fillText(str, this.toPx(x), this.toPx(y));
    this.ctx.restore();
    return width;
  }

  /**
   * 绘制文本并返回文本占用宽度
   *
   * @param {string} text 文本字符串
   * @param {number} x - 横坐标位置
   * @param {number} y - 纵坐标位置
   * @param {number} size - 字体大小
   * @param {string} color - 字体颜色
   * @param {string} [bold='normal'] 字重，值同css font-weight属性，默认normal
   * @param {string} [align='left'] 对齐方式 left(x值不包含字体宽度), center(x值包含一半字体宽度), right(x值包含整个字体宽度)
   * @param {string} [baseLine='top'] top(y值不包含字体高度), middle(y值包含一半字体高度)，bottom(y值包含整个字体高度)
   * @returns {object} 文本占用宽度&x坐标
   * @memberof CanvasDrawer
   */
  drawTextWithWidth(text, x, y, size, color, bold = 'normal', align = 'left', baseLine = 'top') {
    const width = this.drawText(text, x, y, size, color, bold, align, baseLine, true);
    return {
      width: width / this.ratio,
      x,
    };
  }

  /**
   * 绘制由动态文本组成的行
   * 可传入要绘制的文本数组或文本属性数组
   * 若该行文本样式一致时直接传入文本数组即可
   * 若需要个性化单个文本可传入文本属性数组
   * 个性化属性未填写时默认使用全局属性
   *
   * @param {Object}   textObj - 文本对象
   * @param {string[]|Object[]} textObj.texts - 要绘制的文本数组或文本属性数组
   * @param {string}   textObj.texts[].text - 要绘制的文本
   * @param {number}   textObj.texts[].textMargin - 文本间距
   * @param {number}   textObj.texts[].size - 字体大小
   * @param {string}   textObj.texts[].color - 字体颜色
   * @param {string}   textObj.texts[].bold - 字重
   * @param {string}   textObj.texts[].originY - 起始y
   * @param {number}   textObj.originX - 起始x
   * @param {number}   textObj.originY - 起始y
   * @param {number}   textObj.textMargin - 文本间距
   * @param {number}   textObj.size - 字体大小
   * @param {string}   textObj.color - 字体颜色
   * @param {string}   textObj.bold - 字重
   * @memberof CanvasDrawer
   */
  drawDynamicTextsRow({ texts = [], originX = 0, originY, textMargin = 0, size, color, bold = 'normal' } = {}) {
    texts.reduce((totalX, item) => {
      let text = item; let oy = originY; let tm = textMargin; let cl = color; let sz = size; let bl = bold;
      if (typeof item === 'object') {
        text = item.text;
        oy = item.originY || originY;
        tm = item.textMargin || textMargin;
        cl = item.color || color;
        sz = item.size || size;
        bl = item.bold || bold;
      }
      const { width } = this.drawTextWithWidth(text, totalX, oy, sz, cl, bl, 'left', 'top');
      return totalX + width + tm;
    }, originX);
  }

  /**
   * 批量绘制文本
   * @param {Object[]} texts 文字数组
   * @param {Object} texts[i], 文字属性 { text, x, y, size, color, align = 'left', bold = 'normal', baseLine = 'middle' }
   */
  drawTexts(texts) {
    texts.forEach((item) => {
      const { text, x, y, size, color, bold = 'normal', align = 'left', baseLine = 'middle' } = item;
      this.drawText(text, x, y, size, color, bold, align, baseLine);
    });
  }

  /**
   * 获取相册权限
   *
   * @returns {*}
   */
  getAlbumAuth() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success(res) {
          if (res.authSetting['scope.writePhotosAlbum']) return resolve();
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(),
            fail: () => {
              reject();
              wx.showModal({
                title: '',
                content: '监测到您没有授权保存到相册权限，无法使用该功能，是否去授权？',
                showCancel: true,
                cancelText: '取消',
                cancelColor: '#000000',
                confirmText: '现在去',
                success: (result) => {
                  if (result.confirm) wx.openSetting();
                },
              });
            },
          });
        },
      });
    });
  }

  /**
   * 保存图片到相册
   *
   * @param {*} [{ customSuccToast = false, customFailToast = false }={}]
   * @returns
   * @memberof CanvasDrawer
   */
  saveImage({ customSuccToast = false, customFailToast = false } = {}) {
    wx.showLoading({ title: '请稍等...', mask: true })
    return new Promise((resolve, reject) => {
      if (!this.tempFilePath) {
        wx.showToast({ title: '海报未准备好，请稍等', icon: 'none' });
        reject('资源还未绘制完成');
      };
      this.getAlbumAuth().then(() => {
        wx.saveImageToPhotosAlbum({
          filePath: this.tempFilePath,
          success: () => {
            !customSuccToast && wx.showToast({ title: '保存成功', icon: 'success', duration: 2000 });
            resolve(this.tempFilePath);
          },
          fail: () => {
            !customFailToast && wx.showToast({ title: '保存失败，请重试', icon: 'none' });
            reject('取消保存');
          },
        });
      });
    });
  }

  /**
   * 导出画布(先导出，再saveImage)
   *
   * @returns {*}
   */
  canvasExport() {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: (res) => {
          this.tempFilePath = res.tempFilePath;
          resolve(res.tempFilePath);
        },
        fail: () => {
          reject();
        },
      }, this.compInstance);
    });
  }

  /**
   * 获取画布导出状态
   *
   * @returns {boolean}
   */
  getExportDone() {
    return !!this.tempFilePath;
  }
};

