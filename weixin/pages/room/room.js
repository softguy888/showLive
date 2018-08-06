const app = getApp();
var sliderWidth = 96;
var Base64 = require('../../utils/base64.js');
var CryptoJS = require("../../utils/crypto-js");
var WxParse = require('../../wxParse/wxParse.js');
var userListUrl = "https://api.imbcloud.cn:5443/access/channels/";
var commentsUrl = "https://api.imbcloud.cn:5443/access/comments/";
var replayUrl = 'https://api.imbcloud.cn:5443/access/playback/'
var timer_channels;
var timer_comments;
var timer_live;
var message = '';
var date_comments = '';
var date_channels = '';

var page = 1;
var page_size = 5;
var sort = "last";
var is_easy = 0;
var lange_id = 0;
var pos_id = 0;
var unlearn = 0;

Page({
  data: {
    news_input_val: '',
    channel: '',
    rtmpUrl: 'rtmp://23576.liveplay.myqcloud.com/live/23576_1',
    liveImage: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
    coverLogo: 'https://api.imbcloud.cn/res/img/left_logo.png',
    liveStatus: '0',
    detail: {},
    name: '',
    visitId: '',
    startTime: '',
    endTime: '',
    historyUserNum: '',
    userName: '',
    tabs: ["简介", "聊天", "成员", "回放"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    comments: [],
    playbacks: [],
    windowHeight: 0,
    windowWidth: 0,
    hidden: true,
    list: [],
    scrollTop: 0,
    scrollHeight: 0,
    focus: false,
    flag_comments: true,
    flag_channels: true,
    showControl: true,
    showFullControl: true,
    fullScreen: false
  },

  onShareAppMessage: function(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: this.data.name,
      path: 'pages/room/room?rtmpUrl=' + this.data.rtmpUrl + ' &coverLogo=' + this.data.coverLogo + '&liveImage=' + this.data.liveImage + '&liveStatus=' + this.data.liveStatus + '&detail=' + this.data.detaiBase64 + '&name=' + this.data.name + '&startTime=' + this.data.startTime + '&channel=' + this.data.channel + '&visitId=' + this.data.visitId + '&userName=' + this.data.userName + '&endTime=' + this.data.endTime + '&historyUserNum=' + this.data.historyUserNum
    }
  },

  onLoad: function(option) {
    var that = this;
    wx.showShareMenu();
    // var comment = {
    //   name: 'wfj',
    //   message: '还好',
    //   time: '10:00:00'
    // }
    // var arr = new Array();
    // for (var i = 0; i < 10; i++) {
    //   arr.push(comment);
    // }
    // this.setData({
    //   comments: arr
    // })

    //导航页设置,设置屏幕高度
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex,
          scrollHeight: res.windowHeight,
          windowHeight: res.windowHeight,
          windowWidth: res.windowWidth
        });
      }
    });
    var detail = option.detail;
    //base64 解码
    var parsedWordArray = CryptoJS.enc.Base64.parse(option.detail);
    var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
    WxParse.wxParse('article', 'html', parsedStr, that, 5);
    //设置从index页面传过来的频道信息
    this.setData({
      rtmpUrl: option.rtmpUrl,
      liveImage: option.liveImage,
      coverLogo: option.coverLogo,
      liveStatus: option.liveStatus,
      name: option.name,
      startTime: option.startTime,
      channel: option.channel,
      visitId: option.visitId,
      userName: option.userName,
      endTime: option.endTime,
      historyUserNum: option.historyUserNum,
      detaiBase64: detail
    });
  },

  onUnload: function(option) {
    this.data.flag_comments = false;
    this.data.flag_channels = false;
    if (this.data.liveStatus == '0') {
      clearInterval(timer_live);
    }
  },

  onReady(res) {
    this.ctx = wx.createLivePlayerContext('player');
  },

  onShow() {
    var that = this;
    timer_comments = setTimeout(function() {
      getComments(that);
    }, 100);
    timer_channels = setTimeout(function() {
      getChannels(that);
    }, 100);
    if (this.data.liveStatus == '0') {
      waitTime(that);
      timer_live = setInterval(function() {
        waitTime(that);
      }, 60000);
    }


    //向服务器轮询请求评论
    function getComments(page) {
      var StringToSign =
        "GET" + "\n" +
        new Date().toGMTString() + "\n" +
        "\n\n" +
        commentsUrl + page.data.channel + "?visit_id=" + page.data.visitId +
        "&date=" + date_comments;
      var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
      var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
      var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
      var that = page;
      wx.request({
        url: commentsUrl + page.data.channel,
        data: {
          visit_id: page.data.visitId,
          date: date_comments
        },
        header: {
          'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
          'Date': new Date().toGMTString(),
          'Poll-Connection': 'keep-alive',
          'content-type': 'application/json' // 默认值
        },
        method: 'GET',
        dataType: 'json',
        success: function(res) {
          var data = res.data;
          if (data.result == 'success') {
            console.log(data);
            date_comments = data.date;
            if (data.message && data.message == 'poll') { //没有新评论
              console.log('poll');
            } else {
              var commentArr = page.data.comments;
              for (var i = 0; i < data.comments.length; i++) { //遍历新评论，放进页面数据中
                var comment = data.comments[i];
                var message = comment.message;
                var time = comment.message_time;
                var parsedWordArray = CryptoJS.enc.Base64.parse(comment.visit_name);
                var name = parsedWordArray.toString(CryptoJS.enc.Utf8);
                var comment_obj = {
                  message: message,
                  time: time,
                  name: name
                }
                commentArr.push(comment_obj);
              }
              page.setData({
                comments: commentArr
              })
            }
          }
          if (page.data.flag_comments) {
            getComments(page);
          }
        },
        fail: function(res) {
          console.log(res);
          if (page.data.flag_comments) {
            getComments(page);
          }
        }
      })
    }
    //向服务器轮询请求频道信息
    function getChannels(page) {
      //      var datetmp = new Date().getTime();
      var StringToSign =
        "GET" + "\n" +
        new Date().toGMTString() + "\n" +
        "\n\n" +
        userListUrl + page.data.channel + "?direct_code=&visit_name=" +
        page.data.userName + "&visit_id=" + page.data.visitId + "&date=" + date_channels;
      var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
      var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
      var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
      wx.request({
        url: userListUrl + page.data.channel,
        data: {
          direct_code: '',
          visit_name: page.data.userName,
          visit_id: page.data.visitId,
          date: date_channels

        },
        header: {
          'content-type': 'application/json', // 默认值
          'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
          'Poll-Connection': 'keep-alive',
          'Date': new Date().toGMTString()
        },
        method: 'GET',
        dataType: 'json',
        success: function(res) {
          var data = res.data;
          console.log(data);
          if (data.result == 'success') {
            date_channels = data.date;
            var parsedWordArray = CryptoJS.enc.Base64.parse(data.detail);
            var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
            var detail = parsedStr.split("</p>");
            for (var i = 0; i < detail.length; i++) {
              detail[i] = detail[i].replace("<p>", "");
            }
            page.setData({
              rtmpUrl: data.streams.rtmp_play_url,
              liveImage: data.live_image,
              coverLogo: data.cover_logo,
              liveStatus: data.live_status,
              name: data.name,
              startTime: data.start_time,
            });

          } else if (data.result == 'fail') {
            // wx.showToast({
            //   title: '获取频道失败：' + data.reason,
            //   icon: 'none',
            //   duration: 2000
            // })
            console.log('获取频道失败：' + data.reason);
          }
          if (page.data.flag_channels) {
            getChannels(page);
          }
        },
        fail: function(res) {
          console.log(res);
          if (page.data.flag_channels) {
            getChannels(page);
          }
        }
      })
    }

    function waitTime(page) {
      var startTime = page.data.startTime;
      var dateEnd = new Date(startTime.replace(/-/g, "/")); //replace方法将-转为/
      console.log(dateBegin);
      var dateBegin = new Date();
      var dateDiff = dateEnd.getTime() - dateBegin.getTime(); //时间差的毫秒数
      var dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000)); //计算出相差天数
      var leave1 = dateDiff % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
      var hours = Math.floor(leave1 / (3600 * 1000)) //计算出小时数
      //计算相差分钟数
      var leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数
      var minutes = Math.floor(leave2 / (60 * 1000)) //计算相差分钟数
      console.log(dayDiff + ' ' + hours + ' ' + minutes);
      that.setData({
        day: dayDiff,
        hour: hours,
        minute: minutes
      });
    }
  },


  tabClick: function(e) {
    // var users = new Array(40);
    // var user = {
    //   visit_name: 'wfj'
    // }
    // for (var i = 0; i < users.length; i++) {
    //   users[i] = user;
    // }
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id,
      // users: users
    });
    if (e.currentTarget.id == 1) { //点击聊天tab
      // this.setData({
      //   focus: true
      // });
    } else if (e.currentTarget.id == 2) { //点击成员tab
      page = 1;
      var StringToSign =
        "GET" + "\n" +
        new Date().toGMTString() + "\n" +
        "\n\n" +
        userListUrl + this.data.channel + "/users?page=1&filter=1" +
        "&sort=asc";
      var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
      var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
      var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)

      var that = this;
      wx.request({
        url: userListUrl + this.data.channel + "/users",
        data: {
          page: 1,
          filter: 1,
          sort: 'asc'
        },
        header: {
          'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
          'Date': new Date().toGMTString(),
          'content-type': 'application/json' // 默认值
        },
        method: 'GET',
        dataType: 'json',
        success: function(res) {
          var data = res.data;
          console.log(data);
          if (data.result == 'success') {
            var users = data.users;
            for (var i = 0; i < users.length; i++) {
              var parsedWordArray = CryptoJS.enc.Base64.parse(users[i].visit_name);
              var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
              users[i].visit_name = parsedStr;
            }
            that.setData({
              users: users
            });
          } else {
            console.log('fail reason:' + data.reason);
          }
        }
      });
    } else if (e.currentTarget.id == 3) { //点击回放tab
      //page_replay = 1;
      var playback_demo = [{
        title: '2018-07-26 16:31:47_2018-07-26 18:01:45',
        coverUrl: 'http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/718114f05285890780734647008/1532599567_3715980542.100_0.jpg',
        videoUrl: 'http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/718114f05285890780734647008/f0.mp4'
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }, {
        title: "2018-07-26 18:01:45_2018-07-26 18:30:52",
        coverUrl: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtransgzp1256653728/78a4c8725285890780734967212/1532601116_4028727800.100_0.jpg",
        videoUrl: "http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/78a4c8725285890780734967212/f0.mp4"
      }];
      this.setData({
        //playbacks: playback_demo
      });
      var StringToSign =
        "GET" + "\n" +
        new Date().toGMTString() + "\n" +
        "\n\n" +
        replayUrl + this.data.channel + "?title=&status=1&page=1";
      var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
      var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
      var base64_auth = CryptoJS.enc.Base64.stringify(wordArray);
      var that = this;
      wx.request({
        url: replayUrl + this.data.channel,
        data: {
          title: '',
          status: 1,
          page: 1
        },
        header: {
          'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
          'Date': new Date().toGMTString(),
          'content-type': 'application/json' // 默认值
        },
        method: 'GET',
        dataType: 'json',
        success: function(res) {
          var data = res.data;
          console.log(data);
          if (data.result == 'success') {
            var videos = data.videos;
            var videoArr = new Array();
            for (var i = 0; i < videos.length; i++) {
              var video = videos[i];
              var coverUrl = video.cover_url;
              var title = video.title;
              var videoUrl = video.video_url;
              var time = video.create_time;
              var videoObj = {
                coverUrl: coverUrl,
                title: title,
                videoUrl: videoUrl,
                time: time
              }
              videoArr.push(videoObj);
            }
            that.setData({
              playbacks: videoArr
            });
          } else {
            console.log('fail reason:' + data.reason);
          }
        }
      });
    }
  },

  statechange(e) {
    console.log('live-player code:', e.detail.code)
  },
  error(e) {
    console.error('live-player error:', e.detail.errMsg)
  },
  bindPlay() {
    this.ctx.play({
      success: res => {
        console.log('play success')
      },
      fail: res => {
        console.log('play fail')
      }
    })
  },
  bindPause() {
    this.ctx.pause({
      success: res => {
        console.log('pause success')
      },
      fail: res => {
        console.log('pause fail')
      }
    })
  },
  bindStop() {
    this.ctx.stop({
      success: res => {
        console.log('stop success')
      },
      fail: res => {
        console.log('stop fail')
      }
    })
  },
  bindResume() {
    this.ctx.resume({
      success: res => {
        console.log('resume success')
      },
      fail: res => {
        console.log('resume fail')
      }
    })
  },
  bindMute() {
    this.ctx.mute({
      success: res => {
        console.log('mute success')
      },
      fail: res => {
        console.log('mute fail')
      }
    })
  },

  bindFullScreen() {
    var that = this;
    that.setData({
      showControl: true,
      fullScreen: true
    });
    this.ctx.requestFullScreen({
      success: res => {
        that.setData({
          orientation: 'horizontal'
        })
      },
      fail: res => {
        console.log('fullScreen fail')
      }
    })
  },
  bindExistFullScreen() {
    var that = this;
    that.setData({
      showFullControl: true,
      fullScreen: false
    });
    this.ctx.exitFullScreen({
      success: res => {
        that.setData({
          orientation: 'vertical'
        })
      },
      fail: res => {
        console.log('exist ullScreen fail')
      }
    })
  },

  //页面滑动到底部
  bindDownLoad: function() {
    console.log("lower");
    var that = this;
    loadMore(that);
  },
  scroll: function(event) {
    //该方法绑定了页面滚动时的事件，我这里记录了当前的position.y的值,为了请求数据之后把页面定位到这里来。
    this.setData({
      scrollTop: event.detail.scrollTop
    });

  },


  bindChange: function(e) {
    message = e.detail.value
  },

  add: function(e) {
    var that = this;
    //var messageArray = CryptoJS.enc.Utf8.parse(message);
    //var base64_message = CryptoJS.enc.Base64.stringify(messageArray)
    var body = "{\"visit_id\":\"" + that.data.visitId + "\",\"visit_name\":\"" +
      that.data.userName + "\",\"message\":\"" + message + "\"}";
    var body_md5 = CryptoJS.MD5(body).toString();
    var StringToSign =
      "POST" + "\n" +
      new Date().toGMTString() + "\n" +
      body_md5 + "\n" +
      commentsUrl + this.data.channel;
    var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
    var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
    var base64_auth = CryptoJS.enc.Base64.stringify(wordArray);
    wx.request({
      url: commentsUrl + that.data.channel,
      data: {
        visit_id: that.data.visitId,
        visit_name: that.data.userName,
        message: message
      },
      header: {
        'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
        'Date': new Date().toGMTString(),
        'content-type': 'application/json' // 默认值
      },
      method: 'POST',
      dataType: 'json',
      success: function(res) {
        var data = res.data;
        console.log(data);
        if (data.result == 'success') {
          wx.showToast({
            title: '发送成功',
            icon: 'none',
            duration: 2000
          })
        } else {
          wx.showToast({
            title: '发送失败:' + data.reason,
            icon: 'none',
            duration: 2000
          })
        }
        that.setData({
          news_input_val: ''
        })
        message = '';
      },
      fail: function(res) {
        wx.showToast({
          title: '发送失败:' + res,
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  playback: function(e) {
    // console.log(e.currentTarget.dataset.video);
    var video = e.currentTarget.dataset.video;
    wx.navigateTo({
      url: '../playback/playback?videoUrl=' + video.videoUrl + '&time=' + video.time +
        '&title=' + video.title,
      success: function() {

      }, //成功后的回调；  
      fail: function() {}, //失败后的回调；  
      complete: function() {} //结束后的回调(成功，失败都会执行)  
    })
  },

  clickScreen: function() {
    var that = this;
    if (this.data.fullScreen) {
      if (this.data.showFullControl) {
        this.setData({
          showFullControl: false
        });
        // setTimeout(function () {
        //   that.setData({
        //     showFullControl: true
        //   });
        // }, 2000);
      } else {
        this.setData({
          showFullControl: true
        });
      }
    } else {
      if (this.data.showControl) {
        this.setData({
          showControl: false
        });
        // setTimeout(function() {
        //   that.setData({
        //     showControl: true
        //   });
        // }, 2000);
      } else {
        this.setData({
          showControl: true
        });
      }
    }
  }

})


// 请求数据
var loadMore = function(that) {
  page++;
  that.setData({
    //hidden: false
  });
  var StringToSign =
    "GET" + "\n" +
    new Date().toGMTString() + "\n" +
    "\n\n" +
    userListUrl + that.data.channel + "/users?page=" + page + "&filter=1" +
    "&sort=asc";
  var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
  var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
  var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
  wx.request({
    url: userListUrl + that.data.channel + "/users",
    data: {
      page: page,
      filter: 1,
      sort: 'asc'

    },
    header: {
      'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
      'Date': new Date().toGMTString(),
      'content-type': 'application/json' // 默认值
    },
    method: 'GET',
    dataType: 'json',
    success: function(res) {
      var data = res.data;
      console.log(data);
      if (data.result == 'success') {
        var users = data.users;
        for (var i = 0; i < users.length; i++) {
          var parsedWordArray = CryptoJS.enc.Base64.parse(users[i].visit_name);
          var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
          users[i].visit_name = parsedStr;
        }
        var tmp = that.data.users.concat(users);
        that.setData({
          users: tmp
        });
      } else {
        console.log("fail reason:" + data.reason);
      }
    }
  });
}