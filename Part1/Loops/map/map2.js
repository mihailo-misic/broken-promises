const { writeFile } = require('fs').promises;
const data = require('./a.json')
const http = require('http')

const { monitorEventLoopDelay } = require('perf_hooks')
const h = monitorEventLoopDelay()
h.enable()

const start = process.hrtime.bigint()

let done = false
let counter = 0
let maxHeapUsed = 0;
let maxHeapTotal = 0;


function a() {
  const mu = process.memoryUsage()
  maxHeapUsed = Math.max(maxHeapUsed, mu.heapUsed)
  maxHeapTotal = Math.max(maxHeapTotal, mu.heapTotal)
  counter++
  if (!done) setImmediate(a)
}
setImmediate(a)

async function write(data) {
  await writeFile('a1.json', JSON.stringify(data))
  done = true
}

Promise.all(data.items.map((i) => {
  return new Promise((resolve, rej) => {
    http.get('http://localhost:8000', { headers: { num: i } }, (res) => {
      let data = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => data += chunk)
      res.on('close', () => {
        resolve(data)
      })
      res.on('error', rej)
    })
  })
})).then(write)

process.on('exit', () => {
  console.log(
    process.hrtime.bigint() - start,
    h.min,
    h.max,
    h.mean,
    h.percentile(50),
    h.percentile(99),
    maxHeapUsed,
    maxHeapTotal,
    counter)
})
