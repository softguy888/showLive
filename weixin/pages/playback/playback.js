Page({

  data: {
    videoUrl: '',
    title: '',
    time: ''
  },
  
  onLoad: function (option) {
    this.setData({
      videoUrl: option.videoUrl,
      title: option.title,
      time: option.time
    })
  },

})