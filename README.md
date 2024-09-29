# kl-camera-frontend  

## 安装   

Install with npm:
```
npm install kl-camera-frontend
```

## 设置采集等配置项
- `setConfig(param)`
  - 开始采集
    - `grabStart: (camera: Camera)=> Promise<boolean>`
  - 停止采集
    - `grabStop: (camera: Camera)=> Promise<boolean>`
  - 获取曝光
    - `getExposureTime: (camera: Camera)=> Promise<number>`
  - 设置曝光
    - `setExposureTime: (camera: Camera), expTime: number)=> void`
  - 设置畸变参数
    - `undistort: (camera: Camera, undistortParam: number[] | null)=> void`
  - 开始订阅
    - `startSubscribe: (subscribe: Subscribe, cb: (imageData: ImageData)=> void`
  - 停止订阅
    - `stopSubscribe: (subscribe: Subscribe)=> void`
  - 更新订阅参数
    - `updateSubscribe: (subscribe: Subscribe)=> void`



## class Camera

### Constructor   

`new Camera(param: param) => Camera`    

- param
  - `id: number` 相机id
  - `name: number` 相机名称
  - `model: number` 相机型号
  - `sn: number` 相机SN
  - `width: number` 相机输出图像宽
  - `height: number` 相机输出图像高
  - `channel: number` 相机输出图像通道

### 实例方法

`.createSubscribe(listener: (imageData: ImageData, sub: Subscribe) => void)` 创建订阅对象

`.grabStart()` 开始采集

`.grabStop()` 停止采集

`.swicthGrabType(type: string)` 切换采集模式
  - type: grabInternal|grabExternal

- `.setExposureTime(expTime: number)` 设置曝光
  - expTime: 曝光值

`.getExposureTime(): Promise<number>` 获取曝光

- `.undistort(undistortParam: number[] | null)` 设置畸变参数

`.removeName()` 移除相机名称

`.addName(name: string): boolean` 添加相机名称



## class Subscribe

### Constructor   

`new Subscribe(camera: Camera, listener: (imageData: ImageData, sub: Subscribe) => void) => Subscribe`    

### 实例方法

`.startSubscribe(silent?: boolean)` 开始订阅
  - `silent` 对应相机是否静默，否则开始采集图像

`.stopSubscribe()` 取消订阅
  - `silent` 对应相机是否静默，否则停止采集图像

`.updateParam(param: number[])` 更新订阅参数
  - param: [width, height, scale, dx, dy]



## 使用
```
import { Camera, setConfig } from 'kl-camera-frontend';

const camera = new Camera({
  id: 1,
  name: 'test',
  model: 'MODEL',
  sn: 'SN-TEST',
  width: 5120,
  height: 5120,
  channel: 3,
})
const sub = camera.createSubscribe((imageData) => {
  console.log(imageData.width, imageData.height);
});

setConfig({
  async grabStart(camera: Camera) {
    console.log(`${camera.desc}: ${camera.grabType} grabStart...`);
    return true;
  },
  async grabStop(camera: Camera) {
    console.log(`${camera.desc}: grabStop...`);
    return false;
  },
  async startSubscribe(subscribe: Subscribe, cb: (imageData: ImageData) => void) {
    console.log(`${subscribe.camera.desc}/${subscribe.name}: startSubscribe...`);
    cb(new ImageData(subscribe.width, subscribe.height));
  },
  async stopSubscribe(subscribe: Subscribe) {
    console.log(`${subscribe.camera.desc}/${subscribe.name}: stopSubscribe...`);
  },
  async updateSubscribe(subscribe: Subscribe) {
    console.log(`${subscribe.name}/${subscribe.camera.desc}: updateSubscribe...`);
  }
})


sub.startSubscribe();
setTimeout(() => {
  sub.stopSubscribe();
}, 10000)
```