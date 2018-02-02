'use strict'
/* global MediaRecorder, Blob, URL */

/**
 * Get DOM element
 */
// <video> element
let inputVideo = document.querySelector('#inputVideo')
let outputVideo = document.querySelector('#outputVideo')

// <button> element
let startBtn = document.querySelector('#startBtn')
let stopBtn = document.querySelector('#stopBtn')

// error message
let errorElement = document.querySelector('#errorMsg')
let isRecordingElement = document.querySelector('.is-recording')

/**
 * Global variables
 */
// 在 mediaRecord 要用的 chunks
let chunks = []

// 在 getUserMedia 使用的 constraints 變數
let constraints = {
  audio: true,
  video: true
}

isRecordingBtn(false)
mediaRecorderSetup(1000)

function mediaRecorderSetup (sliceTime) {
  // mediaDevices.getUserMedia() 取得使用者媒體影音檔
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {

      /**
       * === 開始：透過 MediaRecorder 錄影 ===
      **/
      // 建立 MediaRecorder 準備錄影
      let mediaRecorder = new MediaRecorder(stream)

      /**
       * MediaRecorder methods
       */
      // Start Recording: mediaRecorder.start()
      startBtn.addEventListener('click', e => {
        e.preventDefault()
        e.stopPropagation()
        isRecordingBtn(true)
        mediaRecorder.start(sliceTime)
        console.log('mediaRecorder.start()')
        console.log('mediaRecorder.state: ', mediaRecorder.state)
      })

      // Stop Recording: mediaRecorder.stop()
      stopBtn.addEventListener('click', e => {
        e.preventDefault()
        e.stopPropagation()
        isRecordingBtn(false)
        mediaRecorder.stop()
        console.log('mediaRecorder.stop()')
        console.log('mediaRecorder.state: ', mediaRecorder.state)
      })

      /**
       * MediaRecorder EventHandler
       */
      // 有資料傳入時觸發
      mediaRecorder.addEventListener('dataavailable', e => {
        console.log('mediaRecorder on dataavailable', e.data)
        chunks.push(e.data)
      })

      // 停止錄影時觸發
      mediaRecorder.addEventListener('stop', () => {
        console.log('mediaRecorder on stop')
        outputVideo.controls = true
        var blob = new Blob(chunks, { 'type': 'video/webm; codecs=vp9' })
        chunks = []
        let outputVideoURL = URL.createObjectURL(blob)
        outputVideo.src = outputVideoURL

        // saveData(outputVideoURL)
        mediaRecorderSetup()
        // 停止所有的輸入或輸出的串流裝置（例如，關攝影機）
        stream.getTracks().forEach(function (track) {
          track.stop()
        })

        // 在這裡 revokeObjectURL(dataURL) 將會使得 outputVideo 無法取得影片
        // URL.revokeObjectURL(outputVideoURL)
      })

      /**
       * === 結束：透過 MediaRecorder 錄影 ===
      **/

      /**
       * inputVideo Element
       * 將串流的 inputVideo 設定到 <video> 上
       **/
      let inputVideoURL = URL.createObjectURL(stream)
      inputVideo.src = inputVideoURL
      inputVideo.controls = false

      inputVideo.addEventListener('loadedmetadata', e => {
        inputVideo.play()
        console.log('inputputVideo on loadedmetadata')
      })
    })
    .catch(function (error) {
      if (error.name === 'ConstraintNotSatisfiedError') {
        errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
          constraints.video.width.exact + ' px is not supported by your device.')
      } else if (error.name === 'PermissionDeniedError') {
        errorMsg('Permissions have not been granted to use your media devices')
      }
      errorMsg('getUserMedia error: ' + error.name, error)
    })
}

function errorMsg(msg, error) {
  console.log('errorElement', errorElement)
  errorElement.classList.add('alert', 'alert-warning')
  errorElement.innerHTML += msg
  if (typeof error !== 'undefined') {
    console.error(error)
  }
}

function saveData(dataURL) {
  var fileName = 'my-download-' + Date.now() + '.webm'
  var a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = dataURL
  a.download = fileName
  a.click()

  // 在這裡 revokeObjectURL(dataURL) 將會使得 outputVideo 無法取得影片
  // window.URL.revokeObjectURL(dataURL);
}

function isRecordingBtn (isRecording) {
  if (isRecording) {
    startBtn.style.display = 'none'
    stopBtn.style.display = 'block'
    isRecordingElement.style.display = 'block'
  } else {
    startBtn.style.display = 'block'
    stopBtn.style.display = 'none'
    isRecordingElement.style.display = 'none'
  }
}
