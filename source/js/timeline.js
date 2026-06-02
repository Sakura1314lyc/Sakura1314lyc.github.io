/*!
 * Timeline.js — SVG Time River Visualization
 * 时光河流：贝塞尔曲线路径 + 横向拖拽浏览
 */
;(function () {
  'use strict'

  var CONFIG = {
    nodeRadius: 7,
    nodeHoverRadius: 12,
    yearNodeRadius: 11,
    pathAmplitude: 140,
    nodeSpacing: 100,
    leftPadding: 100,
    rightPadding: 300,
    topPadding: 180,
    animationDelay: 60,
    autoScrollDelay: 400,
  }

  var state = {
    posts: [],
    svg: null,
    container: null,
    tooltip: null,
    totalWidth: 0,
    totalHeight: 0,
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  }

  // ── Init ────────────────────────────────────
  function init() {
    var dataScript = document.getElementById('timeline-data')
    if (!dataScript) return
    try {
      state.posts = JSON.parse(dataScript.textContent)
    } catch (e) {
      return
    }
    if (!state.posts.length) return

    state.svg = document.getElementById('timeline-svg')
    state.container = document.getElementById('timeline-container')
    if (!state.svg || !state.container) return

    createTooltip()
    calculateDimensions()
    drawPath()
    drawYearMarkers()
    drawNodes()
    setupInteraction()
    setupKeyboard()
    addNavHint()
    animateEntrance()
  }

  // ── Dimensions ──────────────────────────────
  function calculateDimensions() {
    var viewHeight = window.innerHeight * 0.85
    state.totalWidth =
      CONFIG.leftPadding +
      (state.posts.length - 1) * CONFIG.nodeSpacing +
      CONFIG.rightPadding
    state.totalHeight = viewHeight
    state.viewHeight = viewHeight

    state.svg.setAttribute(
      'viewBox',
      '0 0 ' + state.totalWidth + ' ' + viewHeight
    )
    state.svg.style.width = state.totalWidth + 'px'
    state.svg.style.height = '100%'
    state.container.style.height = 'calc(100vh - 60px)'
  }

  // ── Tooltip ─────────────────────────────────
  function createTooltip() {
    state.tooltip = document.createElement('div')
    state.tooltip.className = 'timeline-tooltip'
    state.container.appendChild(state.tooltip)
  }

  function showTooltip(evt, post) {
    state.tooltip.innerHTML =
      '<div style="font-weight:700;margin-bottom:4px;font-size:14px">' +
      escapeHtml(post.title) +
      '</div>' +
      '<div style="font-size:11px;opacity:0.75">' +
      escapeHtml(post.date) +
      '</div>'
    state.tooltip.classList.add('visible')
    moveTooltip(evt)
  }

  function moveTooltip(evt) {
    var rect = state.container.getBoundingClientRect()
    var x, y
    if (evt.touches && evt.touches.length) {
      x = evt.touches[0].clientX - rect.left + state.container.scrollLeft
      y = evt.touches[0].clientY - rect.top
    } else {
      x = evt.clientX - rect.left + state.container.scrollLeft
      y = evt.clientY - rect.top
    }
    state.tooltip.style.left = x + 'px'
    state.tooltip.style.top = y - 36 + 'px'
  }

  function hideTooltip() {
    state.tooltip.classList.remove('visible')
  }

  function escapeHtml(str) {
    var div = document.createElement('div')
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  }

  // ── Draw Path ───────────────────────────────
  function drawPath() {
    var points = []
    var n = state.posts.length
    var midY = state.viewHeight / 2

    for (var i = 0; i <= n; i++) {
      var x = CONFIG.leftPadding + i * CONFIG.nodeSpacing
      var y =
        midY +
        Math.sin(i * 0.35) * CONFIG.pathAmplitude +
        Math.sin(i * 0.7 + 1.3) * CONFIG.pathAmplitude * 0.5 +
        Math.sin(i * 0.12 + 2.1) * CONFIG.pathAmplitude * 0.3
      points.push({ x: x, y: y })
    }

    // Build smooth cubic bezier path
    var d = 'M ' + points[0].x + ' ' + points[0].y
    for (i = 0; i < points.length - 1; i++) {
      var p0 = points[i]
      var p3 = points[i + 1]
      var dx = p3.x - p0.x
      var cp1x = p0.x + dx * 0.35
      var cp2x = p0.x + dx * 0.65
      d +=
        ' C ' + cp1x + ' ' + p0.y + ', ' + cp2x + ' ' + p3.y + ', ' + p3.x + ' ' + p3.y
    }

    var pathEl = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    pathEl.setAttribute('id', 'timeline-path')
    pathEl.setAttribute('d', d)

    // Add glow filter
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
    filter.setAttribute('id', 'path-glow')
    filter.innerHTML =
      '<feGaussianBlur stdDeviation="3" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>'
    defs.appendChild(filter)
    state.svg.appendChild(defs)

    pathEl.setAttribute('filter', 'url(#path-glow)')
    state.svg.appendChild(pathEl)

    // Hidden measurement path
    state.measurePath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    state.measurePath.setAttribute('d', d)
    state.pathPoints = points
  }

  // ── Node Color Gradient ─────────────────────
  function getNodeColor(index) {
    var t = index / Math.max(state.posts.length - 1, 1)
    var r = Math.round(73 + (155 - 73) * t)
    var g = Math.round(177 + (89 - 177) * t)
    var b = Math.round(245 + (182 - 245) * t)
    return 'rgb(' + r + ',' + g + ',' + b + ')'
  }

  // ── Draw Nodes ──────────────────────────────
  function drawNodes() {
    var measurePath = state.measurePath
    if (!measurePath || !state.pathPoints) return

    // Estimate total path length
    var d = measurePath.getAttribute('d')
    // Create a temp path for measurement
    var tempSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    )
    tempSvg.style.position = 'absolute'
    tempSvg.style.visibility = 'hidden'
    document.body.appendChild(tempSvg)
    var tempPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    tempPath.setAttribute('d', d)
    tempSvg.appendChild(tempPath)

    var totalLength = 0
    try {
      totalLength = tempPath.getTotalLength()
    } catch (e) {
      totalLength = (state.posts.length - 1) * CONFIG.nodeSpacing
    }
    document.body.removeChild(tempSvg)

    var nodeGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    )
    nodeGroup.setAttribute('id', 'timeline-nodes')

    state.posts.forEach(function (post, i) {
      var t =
        state.posts.length === 1
          ? 0.5
          : i / (state.posts.length - 1)
      var length = t * totalLength

      // Get point along the path
      var pt
      try {
        pt = tempPath.getPointAtLength(length)
      } catch (e) {
        // Fallback: use the precomputed points
        var idx = Math.min(i, state.pathPoints.length - 1)
        pt = state.pathPoints[idx]
      }

      var circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      )
      circle.setAttribute('cx', pt.x)
      circle.setAttribute('cy', pt.y)
      circle.setAttribute('r', CONFIG.nodeRadius)
      circle.setAttribute('class', 'timeline-node')
      circle.setAttribute('fill', getNodeColor(i))
      circle.setAttribute('stroke', '#fff')
      circle.setAttribute('stroke-width', '2')
      circle.setAttribute('data-index', i)
      circle.setAttribute('data-url', post.url)
      circle.setAttribute('data-title', post.title)
      circle.setAttribute('data-date', post.date)

      // Hover
      circle.addEventListener('mouseenter', function (evt) {
        circle.setAttribute('r', CONFIG.nodeHoverRadius)
        showTooltip(evt, post)
      })
      circle.addEventListener('mouseleave', function () {
        circle.setAttribute('r', CONFIG.nodeRadius)
        hideTooltip()
      })
      circle.addEventListener('mousemove', function (evt) {
        moveTooltip(evt)
      })

      // Click: navigate to post
      circle.addEventListener('click', function () {
        window.location.href = post.url
      })

      // Touch
      circle.addEventListener('touchstart', function (evt) {
        evt.preventDefault()
        circle.setAttribute('r', CONFIG.nodeHoverRadius)
        showTooltip(evt, post)
      })
      circle.addEventListener('touchend', function (evt) {
        hideTooltip()
        circle.setAttribute('r', CONFIG.nodeRadius)
        window.location.href = post.url
      })

      nodeGroup.appendChild(circle)
    })

    state.svg.appendChild(nodeGroup)
  }

  // ── Year Markers ────────────────────────────
  function drawYearMarkers() {
    var measurePath = state.measurePath
    if (!measurePath || !state.pathPoints) return

    var years = {}
    state.posts.forEach(function (post, i) {
      if (!years[post.year]) {
        years[post.year] = i
      }
    })

    // Temp path for pointAtLength
    var d = measurePath.getAttribute('d')
    var tempSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    )
    tempSvg.style.cssText =
      'position:absolute;visibility:hidden;'
    document.body.appendChild(tempSvg)
    var tempPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    )
    tempPath.setAttribute('d', d)
    tempSvg.appendChild(tempPath)

    var totalLength = 0
    try {
      totalLength = tempPath.getTotalLength()
    } catch (e) {
      totalLength = (state.posts.length - 1) * CONFIG.nodeSpacing
    }

    var yearsSorted = Object.keys(years).sort()
    yearsSorted.forEach(function (year) {
      var i = years[year]
      var t =
        state.posts.length === 1
          ? 0.5
          : i / (state.posts.length - 1)
      var length = t * totalLength

      var pt
      try {
        pt = tempPath.getPointAtLength(Math.min(length, totalLength))
      } catch (e) {
        pt = state.pathPoints[Math.min(i, state.pathPoints.length - 1)]
      }
      if (!pt) return

      // Background circle
      var bgCircle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      )
      bgCircle.setAttribute('cx', pt.x)
      bgCircle.setAttribute('cy', pt.y)
      bgCircle.setAttribute('r', CONFIG.yearNodeRadius + 4)
      bgCircle.setAttribute('fill', '#49b1f5')
      bgCircle.setAttribute('fill-opacity', '0.12')
      bgCircle.setAttribute('stroke', '#49b1f5')
      bgCircle.setAttribute('stroke-width', '1.5')
      bgCircle.setAttribute('stroke-opacity', '0.4')
      state.svg.appendChild(bgCircle)

      // Year text
      var text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      )
      text.setAttribute('x', pt.x)
      text.setAttribute('y', pt.y - 22)
      text.setAttribute('class', 'timeline-year-label')
      text.setAttribute('text-anchor', 'middle')
      text.textContent = year
      state.svg.appendChild(text)
    })

    document.body.removeChild(tempSvg)
  }

  // ── Drag to Scroll ──────────────────────────
  function setupInteraction() {
    // Mouse drag
    state.container.addEventListener('mousedown', function (e) {
      state.isDragging = true
      state.startX = e.pageX - state.container.offsetLeft
      state.scrollLeft = state.container.scrollLeft
      state.container.classList.add('dragging')
    })

    state.container.addEventListener('mouseleave', function () {
      state.isDragging = false
      state.container.classList.remove('dragging')
    })

    state.container.addEventListener('mouseup', function () {
      state.isDragging = false
      state.container.classList.remove('dragging')
    })

    state.container.addEventListener('mousemove', function (e) {
      if (!state.isDragging) return
      e.preventDefault()
      var x = e.pageX - state.container.offsetLeft
      var walk = (x - state.startX) * 2
      state.container.scrollLeft = state.scrollLeft - walk
    })

    // Touch drag
    state.container.addEventListener('touchstart', function (e) {
      if (e.target.classList.contains('timeline-node')) return
      state.isDragging = true
      state.startX =
        e.touches[0].pageX - state.container.offsetLeft
      state.scrollLeft = state.container.scrollLeft
    }, { passive: true })

    state.container.addEventListener('touchend', function () {
      state.isDragging = false
    })

    state.container.addEventListener('touchmove', function (e) {
      if (!state.isDragging) return
      var x =
        e.touches[0].pageX - state.container.offsetLeft
      var walk = (x - state.startX) * 2
      state.container.scrollLeft = state.scrollLeft - walk
    })

    // Mouse wheel → horizontal scroll
    state.container.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault()
        state.container.scrollLeft += e.deltaY + e.deltaX
      },
      { passive: false }
    )
  }

  // ── Keyboard Navigation ─────────────────────
  function setupKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (document.activeElement !== document.body) return
      var scrollAmount = 300
      switch (e.key) {
        case 'ArrowRight':
          state.container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth',
          })
          break
        case 'ArrowLeft':
          state.container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth',
          })
          break
        case 'Home':
          state.container.scrollTo({ left: 0, behavior: 'smooth' })
          break
        case 'End':
          state.container.scrollTo({
            left: state.container.scrollWidth,
            behavior: 'smooth',
          })
          break
      }
    })
  }

  // ── Navigation Hint ─────────────────────────
  function addNavHint() {
    var hint = document.createElement('div')
    hint.className = 'timeline-nav-hint'
    hint.textContent = '← 拖拽或滚轮浏览时光河流 →'
    state.container.parentNode.appendChild(hint)

    // Show briefly on load, then fade
    setTimeout(function () {
      hint.classList.add('show')
    }, 600)
    setTimeout(function () {
      hint.classList.remove('show')
    }, 4000)

    // Show on first interaction after 10s of idle
    var idleTimer
    function resetIdle() {
      clearTimeout(idleTimer)
      hint.classList.remove('show')
      idleTimer = setTimeout(function () {
        hint.classList.add('show')
        setTimeout(function () {
          hint.classList.remove('show')
        }, 3000)
      }, 10000)
    }

    state.container.addEventListener('mousedown', resetIdle)
    state.container.addEventListener('wheel', resetIdle)
    state.container.addEventListener('touchstart', resetIdle)
    resetIdle()
  }

  // ── Entrance Animation ──────────────────────
  function animateEntrance() {
    var nodes = state.svg.querySelectorAll('.timeline-node')
    nodes.forEach(function (node, i) {
      var cx = node.getAttribute('cx')
      var cy = node.getAttribute('cy')
      node.style.opacity = '0'

      setTimeout(function () {
        node.style.opacity = '1'
      }, i * CONFIG.animationDelay)
    })

    // Auto-scroll to center
    setTimeout(function () {
      var centerScroll =
        (state.container.scrollWidth - state.container.clientWidth) /
        2
      if (centerScroll > 0) {
        state.container.scrollTo({
          left: centerScroll,
          behavior: 'smooth',
        })
      }
    }, CONFIG.autoScrollDelay)
  }

  // ── Start ───────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
