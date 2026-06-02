'use strict'

// Time River (时光河流) Archive Page Generator
// Creates /timeline/ with SVG path timeline + horizontal drag navigation

hexo.extend.generator.register('timeline', function (locals) {
  var posts = locals.posts.sort('-date').toArray()

  if (!posts.length) {
    return {
      path: 'timeline/index.html',
      data: {
        type: 'timeline',
        title: '时光河流',
        content: '<p>暂无文章</p>',
        aside: false,
        top_img: false,
        comments: false,
      },
      layout: 'page',
    }
  }

  var postData = posts.map(function (post, index) {
    var tags = post.tags && post.tags.data
      ? post.tags.data.map(function (t) { return t.name })
      : []

    return {
      id: index,
      title: post.title,
      date: post.date.format('YYYY-MM-DD'),
      year: post.date.format('YYYY'),
      month: post.date.format('MM'),
      url: hexo.config.root + (post.path || ''),
      tags: tags,
    }
  })

  var content = [
    '<link rel="stylesheet" href="/css/timeline.css">',
    '<div id="timeline-container">',
    '  <svg id="timeline-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg>',
    '</div>',
    '<script id="timeline-data" type="application/json">' +
      JSON.stringify(postData) +
      '</script>',
    '<script src="/js/timeline.js"></script>',
  ].join('\n')

  return {
    path: 'timeline/index.html',
    data: {
      type: 'timeline',
      title: '时光河流',
      date: posts[0].date,
      content: content,
      aside: false,
      top_img: false,
      comments: false,
    },
    layout: 'page',
  }
})
