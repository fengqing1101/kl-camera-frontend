const globalConfig = {
  async grabStart(camera: Camera) {
    console.log(`${camera.desc}: ${camera.grabType} grabStart...`);
    return true;
  },
  async grabStop(camera: Camera) {
    console.log(`${camera.desc}: grabStop...`);
    return false;
  },
  async setExposureTime(camera: Camera, expTime: number) {
    console.log(`${camera.desc}: setExposureTime=${expTime}`);
  },
  async getExposureTime(camera: Camera): Promise<number> {
    console.log(`${camera.desc}: getExposureTime`);
    return 1000;
  },
  async undistort(camera: Camera, undistortParam: number[] | null) {
    console.log(`${camera.desc}: undistort=${undistortParam}`);
  },
  async startSubscribe(subscribe: Subscribe, cb: (imageData: ImageData) => void) {
    console.log(`${subscribe.camera.desc}/${subscribe.name}: startSubscribe...`);
    cb(new ImageData(subscribe.width, subscribe.height));
  },
  async stopSubscribe(subscribe: Subscribe) {
    console.log(`${subscribe.camera.desc}/${subscribe.name}: stopSubscribe...`);
  },
  async updateSubscribe(subscribe: Subscribe) {
    console.log(`${subscribe.camera.desc}/${subscribe.name}: updateSubscribe...`);
  },
}

export const setConfig = function (param: Partial<typeof globalConfig>) {
  Object.assign(globalConfig, param);
}

export type listener = (imageData: ImageData, sub: Subscribe) => void;
export class Subscribe {
  /** 订阅的相机 */
  camera: Camera;
  /** 订阅名称 */
  name: string;
  /** 订阅的回调函数 */
  listener: listener;
  /** 订阅的宽 */
  width: number = 192;
  /** 订阅的高 */
  height: number = 108;
  /** 订阅的缩放比例 */
  scale: number = 1;
  /** 订阅的dx */
  dx: number = 0;
  /** 订阅的dy */
  dy: number = 0;
  /** 是否已订阅 */
  isSubscribed: boolean = false;
  constructor(camera: Camera, listener: listener) {
    this.camera = camera;
    this.listener = listener;
    this.name = Date.now() + '';
    this.subscribeCb = this.subscribeCb.bind(this);
  }

  /**
   * 订阅相机采集图像的回调函数
   */
  async subscribeCb(imageData: ImageData) {
    this.listener(imageData, this);
  }


  /**
   * 开始订阅；调用之前可以upateSubscribeParam更新一下参数
   * @param silent 对应相机是否静默，否则开始采集图像
   */
  async startSubscribe(silent?: boolean): Promise<void> {
    if (this.isSubscribed) return;
    await this.camera.addSubscribe(this, silent);
    await globalConfig.startSubscribe(this, this.subscribeCb);
    this.isSubscribed = true;
  }

  /**
   * 更新订阅参数；[width, height, scale, dx, dy]
   */
  updateParam(param: number[]) {
    const [width, height, scale, dx, dy] = param;
    this.scale = scale;
    this.dx = dx;
    this.dy = dy;
    this.width = width;
    this.height = height;
    if (!this.isSubscribed) return;
    globalConfig.updateSubscribe(this);
  }

  /**
   * 取消订阅
   * @param silent 对应相机是否静默，否则停止采集图像
   */
  async stopSubscribe(silent?: boolean): Promise<void> {
    if (!this.isSubscribed) return;
    await globalConfig.stopSubscribe(this);
    this.isSubscribed = false;
    await this.camera.removeSubscribe(this, silent);
  }
}

export const GrabTypes = [
  { value: 'grabInternal', label: '内触发' },
  { value: 'grabExternal', label: '外触发' },
]

interface cameraParam {
  /** 相机id（唯一） */
  readonly id: number;
  /** 相机型号（不唯一） */
  readonly model: string;
  /** 相机sn（唯一） */
  readonly sn: string;
  /** 相机名称（不唯一） */
  name: string;
  /** 相机出图的宽 */
  width: number;
  /** 相机出图的高 */
  height: number;
  /** 相机出图的通道 */
  channel: number;
}

export class Camera {
  /** 相机id（唯一） */
  readonly id: number;
  /** 相机型号（不唯一） */
  readonly model: string = '';
  /** 相机sn（唯一） */
  readonly sn: string = '';
  /** 相机名称（不唯一） */
  name: string = '';
  /** 相机出图的宽 */
  width: number;
  /** 相机出图的高 */
  height: number;
  /** 相机出图的通道 */
  channel: number;
  /** 订阅列表 */
  subscribes: Subscribe[] = [];
  /** 是否正在采集图像 */
  isGrabing: boolean = false;
  /** 触发方式；默认内触发 */
  grabType: string = 'grabInternal';
  constructor(param: cameraParam) {
    const { id, name, model, sn, width, height, channel } = param;
    this.id = id;
    this.model = model;
    this.sn = sn;
    this.width = width || 5120;
    this.height = height || 5120;
    this.channel = channel || 1;
    this.name = name || '';
  }

  /**
   * 获取描述
   */
  get desc(): string {
    return `${this.name}(${this.sn})`;
  }

  /**
   * 创建订阅对象
   */
  createSubscribe(listener: listener): Subscribe {
    const subscribe = new Subscribe(this, listener);
    this.subscribes.push(subscribe);
    return subscribe;
  }

  /**
   * 添加订阅
   * @param silent 相机是否静默，否则开始采集图像
   */
  addSubscribe(subscribe: Subscribe, silent?: boolean) {
    this.subscribes.indexOf(subscribe) === -1 && this.subscribes.push(subscribe);
    return silent ? Promise.resolve() : this.grabStart();
  }

  /**
   * 删除订阅
   */
  removeSubscribe(subscribe: Subscribe, silent?: boolean) {
    const index = this.subscribes.indexOf(subscribe);
    index === -1 || this.subscribes.splice(index, 1);
    return silent ? Promise.resolve() : this.grabStop();
  }

  /**
   * 开始采集
   */
  async grabStart(): Promise<void> {
    if (this.isGrabing) return;
    globalConfig.grabStart(this).then((isGrabing: boolean) => {
      this.isGrabing = isGrabing;
    }).catch((isGrabing: boolean) => {
      this.isGrabing = isGrabing;
    })
  }

  /**
   * 停止采集
   */
  async grabStop(): Promise<void> {
    if (!this.isGrabing) return;
    globalConfig.grabStop(this).then((isGrabing: boolean) => {
      this.isGrabing = isGrabing;
    }).catch((isGrabing: boolean) => {
      this.isGrabing = isGrabing;
    })
  }

  /**
   * 切换采集模式
   */
  async swicthGrabType(type: string) {
    if (this.grabType === type) return;
    const isGrabing = this.isGrabing;
    if (isGrabing) await this.grabStop();
    this.grabType = type;
    if (isGrabing) return this.grabStart();
  }

  /**
   * 设置曝光
   */
  async setExposureTime(expTime: number) {
    return globalConfig.setExposureTime(this, expTime);
  }

  /**
   * 获取曝光
   */
  async getExposureTime(): Promise<number> {
    return globalConfig.getExposureTime(this);
  }

  /**
   * 设置畸变参数
   */
  async undistort(undistortParam: number[] | null): Promise<void> {
    return globalConfig.undistort(this, undistortParam);
  }

  /**
   * 移除相机名称
   */
  removeName() {
    this.name = "";
  }

  /**
   * 添加相机名称
   */
  addName(name: string) {
    this.name = name;
  }
}
