# 考拉悠然前端公共相机订阅模块

## 安装   

Install with npm:
```
npm install kl-camera-frontend
```

## 设置采集等配置项   
```typescript
setConfig({
  // 开始采集
  grabStart?: (camera: Camera) => Promise<boolean>,
  // 停止采集
  grabStop?: (camera: Camera) => Promise<boolean>,
  // 设置曝光
  setExposureTime?: (camera: Camera, expTime: number) => Promise<void>,
  // 获取曝光
  getExposureTime?: (camera: Camera) => Promise<number>,
  // 设置畸变参数
  undistort?: (camera: Camera, undistortParam: number[] | null) => Promise<void>,
  // 开始订阅
  startSubscribe?: (subscribe: Subscribe, cb: (imageData: ImageData) => void) => Promise<void>,
  // 停止订阅
  stopSubscribe?: (subscribe: Subscribe) => Promise<void>,
  // 更新订阅参数
  updateSubscribe?: (subscribe: Subscribe) => Promise<void>,
});
```

## 相机

### 1. 构造  
```typescript
new Camera(param: {
  // 相机id
  id: number,
  // 相机名称
  name: string,
  // 相机型号
  model: string,
  // 相机SN
  sn: string,
  // 相机输出图像宽
  width: number,
  // 相机输出图像高
  height: number,
  // 相机输出图像通道
  channel: number,
}) => Camera
``` 

### 2. 关键数据结构
```typescript
{
  // 相机id
  id: number,
  // 相机名称
  name: string,
  // 相机型号
  model: string,
  // 相机SN
  sn: string,
  // 相机输出图像宽
  width: number,
  // 相机输出图像高
  height: number,
  // 相机输出图像通道
  channel: number,
  // 描述：name + sn
  desc: string,
  // 订阅列表
  subscribes: Subscribe[],
  // 是否正在采集图像
  isGrabing: boolean;
  // 触发方式；grabInternal|grabExternal
  grabType: string;
}
``` 

### 3. API

- 创建订阅对象
```typescript
createSubscribe(listener: (imageData: ImageData, sub: Subscribe) => void) => Subscribe
```

- 开始采集
```typescript
grabStart() => Promise<void>
```

- 停止采集
```typescript
grabStop() => Promise<void>
```

- 切换采集模式
```typescript
swicthGrabType(type: 'grabInternal' | 'grabExternal') => void
```

- 设置曝光
```typescript
setExposureTime(expTime: number) => Promise<void>
```

- 获取曝光
```typescript
getExposureTime() => Promise<number>
```

- 设置畸变参数
```typescript
undistort(undistortParam: number[] | null) => Promise<void>
```

- 移除相机名称
```typescript
removeName() => void
```

- 添加相机名称
```typescript
addName(name: string) => void
```

## 订阅

### 1. 关键数据结构   
```typescript
{
  // 订阅的相机
  camera: Camera;
  // 订阅名称
  name: string;
  // 订阅的回调函数
  listener: (imageData: ImageData, sub: Subscribe) => void;
  // 订阅的宽
  width: number;
  // 订阅的高
  height: number;
  // 订阅的缩放比例
  scale: number;
  // 订阅的dx
  dx: number;
  // 订阅的dy
  dy: number;
  // 是否已订阅
  isSubscribed: boolean;
}
```  

### 2. API

- 开始订阅
```typescript
/**
 * @param silent 对应相机是否静默，否则开始采集图像
 */
startSubscribe(silent?: boolean) => Promise<void>
```
- 取消订阅
```typescript
/**
 * @param silent 对应相机是否静默，否则停止采集图像
 */
stopSubscribe(silent?: boolean) => Promise<void>
```
- 更新订阅参数
```typescript
/**
 * @param param 订阅参数：[width, height, scale, dx, dy]
 */
updateParam(param: number[]) => void
```


## 使用
```typescript
import { Camera, setConfig } from 'kl-camera-frontend';

// 创建相机
const camera = new Camera({
  id: 1,
  name: 'test',
  model: 'MODEL',
  sn: 'SN-TEST',
  width: 5120,
  height: 5120,
  channel: 3,
})
// 创建订阅
const sub = camera.createSubscribe((imageData) => {
  console.log(imageData.width, imageData.height);
});

// 设置全局参数
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

// 开始订阅
sub.startSubscribe();
setTimeout(() => {
  // 停止订阅
  sub.stopSubscribe();
}, 10000)
```