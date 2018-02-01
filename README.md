# webapis-media-recorder
這個範例示範如何透過瀏覽器內建的 MediaStream API 來打造影音錄影的功能


## HTML <video> Event

```js
video = document.querySelector('video')
/**
 * outputVideo Element Event
 */
video.addEventListener('canplay', e => {
  console.log('video on canplay')
})

video.addEventListener('canplaythrough', e => {
  console.log('video on canplaythrough')
  video.controls = true
})

video.addEventListener('loadedmetadata', e => {
  console.log('video on loadedmetadata')
})
```


## MediaDevices API

```js
// mediaDevices.enumerateDevices() 用來取得所有的裝置
navigator.mediaDevices.enumerateDevices()
  .then(function (devices) {
    devices.forEach(function (device) {
      console.log(`${device.kind}: ${device.label}, id = ${device.deviceId}`)
    })
  })
  .catch(function (err) {
    console.log(err.name + ': ' + err.message)
  })
```

## MediaRecorder API

```js
 // Reuest Data: mediaRecorder.requestData()
  requestDataBtn.addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    mediaRecorder.requestData()
    console.log('mediaRecorder.requestData()')
    console.log('mediaRecorder.state: ', mediaRecorder.state)
  })
```
