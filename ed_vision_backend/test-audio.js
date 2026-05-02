async function test() {
  try {
    const res = await fetch('http://127.0.0.1:3000/audio/passages/3a944e79-3ef3-460a-81bc-eaf3c22d2d1f.mp3')
    console.log('Status:', res.status)
    console.log('Content-Type:', res.headers.get('content-type'))
    console.log('Content-Length:', res.headers.get('content-length'))
  } catch (e) {
    console.error(e)
  }
}
test()
