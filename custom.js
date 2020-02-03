document.addEventListener('DOMContentLoaded', () => {

  // 手机端不允许缩放
  var meta = document.createElement('meta')
  meta.setAttribute('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no')
  meta.setAttribute('name', 'viewport')
  document.head.append(meta)

  // table横向滚动
  document.querySelectorAll('table').forEach(t => {
    var d = document.createElement('div')
    d.style.overflowX = 'auto'
    d.style.maxWidth = '100%'
    t.parentNode.insertBefore(d, t)
    d.appendChild(t)
  })
})
