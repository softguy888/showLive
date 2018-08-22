const app = getApp();
var channelsUrl = "https://api.imbcloud.cn:5443/access/channels";
var playbacksUrl = "https://api.imbcloud.cn:5443/access/playbacks";
var CusBase64 = require('../../utils/base64.js');
var CryptoJS = require("../../utils/crypto-js");
var page_channel = 1;
var page_playback = 1;
var isChannelLoadAll = false;
var isPlaybackLoadAll = false;

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    liveChannels: [],
    waitChannels: [],
    endChannels: [],
    windowHeight: '',
    windowWidth: '',
    userInfo: {},
    hasUserInfo: false,
    isHideLoadMore: true,
    isLoadAll: true,
    searchValue: ''
  },

  onLoad: function() {
    wx.showShareMenu();
    var that = this;
    try {
      var AccessKeyId = wx.getStorageSync('AccessKeyId');
      var AccessKeySecret = wx.getStorageSync('AccessKeySecret')
      if (AccessKeyId && AccessKeySecret) {
        // Do something with return value
        console.log('------------' + AccessKeyId);
      } else {
        console.log('------------no info');
        // wx.redirectTo({
        //   url: '../login/login'
        // })
      }
    } catch (e) {
      wx.showToast({
        title: '获取账号信息失败',
        icon: 'none',
        duration: 2000
      });
    }
    // 查看是否授权
    wx.getSetting({
      success: function(res) {
        if (!res.authSetting['scope.userInfo']) {
          wx.redirectTo({
            url: '../auth/auth'
          })
        } else {
          wx.getUserInfo({
            success: function(res) {
              //用户已经授权过
              that.setData({
                userInfo: res.userInfo
              })
            }
          });
        }
      }
    })
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          windowHeight: res.windowHeight,
          windowWidth: res.windowWidth
        });
      }
    });
  },

  onShareAppMessage: function(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '美播云互动',
      path: 'pages/main/main'
    }
  },

  onShow: function() {
    isChannelLoadAll = false;
    isPlaybackLoadAll = false;
    page_playback = 1;
    page_channel = 1;
    getChannelList(this, '', 1, false);
    if (isChannelLoadAll) {
      getPlaybackList(this, '', 1, false);
      page_playback ++;
    }
  },
/**触底加载更多
 * 依次判断是否加载频道，回放，如果到以全部加载则显示加载完毕
 */
  onReachBottom: function() {
    this.setData({
      isHideLoadMore: false,
      isLoadAll: true
    });
    if (!isChannelLoadAll) {
      page_channel++;
      getChannelList(this, '', page_channel, true);
    } else if (!isPlaybackLoadAll) {
      getPlaybackList(this, '', page_playback, true);
      page_playback++;
    } else {
      this.setData({
        isHideLoadMore: true,
        isLoadAll: false
      });
    }
  },

/**下拉刷新
 * 频道页数，回放页数置为1。频道全部加载标志位，回放全部加载标志位置为false
 * 加载第一页频道
 * 如果只有一页，频道全部加载标志位置为true，并加载回放
 */
  onPullDownRefresh: function() {
    wx.showNavigationBarLoading();
    isChannelLoadAll = false;
    isPlaybackLoadAll = false;
    page_channel = 1;
    page_playback = 1;
    getChannelList(this, '', page_channel, false);
    if (isChannelLoadAll) {
      getPlaybackList(this, '', page_playback, false);
      page_playback ++;
    }
  },

  bindGetUserInfo: function(e) {
    console.log(e.detail.userInfo)
  },

  enterChannel: function(e) {
    var channel = e.currentTarget.dataset.channel;
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    var id = channel.id;
    var datetmp = new Date().getTime();
    //var userName = CusBase64.CusBASE64.encoder(that.data.userInfo.nickName);
    var userName = CusBase64.CusBASE64.encoder(that.data.userInfo.nickName);
    var StringToSign =
      "GET" + "\n" +
      new Date().toGMTString() + "\n" +
      "\n\n" +
      channelsUrl + '/' + id + "?direct_code=&visit_name=" +
      userName + "&visit_id=&date=";
    var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
    var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
    var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
    wx.request({
      url: channelsUrl + '/' + id,
      data: {
        direct_code: '',
        visit_name: userName,
        visit_id: '',
        date: ''

      },
      header: {
        'content-type': 'application/json', // 默认值
        'Authorization': 'iMBCloud ' + app.globalData.AccessKeyId + ':' + base64_auth,
        'Poll-Connection': 'close',
        'Date': new Date().toGMTString()
      },
      method: 'GET',
      dataType: 'json',
      success: function(res) {
        wx.hideLoading();
        var data = res.data;
        console.log(data);
        if (data.result == 'success') {
          var rtmpUrl = data.streams.rtmp_play_url;
          var flvUrl = data.streams.http_play_url;
          var coverLogo = data.cover_logo;
          var liveImage = data.live_image;
          var liveStatus = data.live_status;
          var detail = data.detail;
          var name = data.name;
          var startTime = data.start_time;
          var visitId = data.visit_id;
          var endTime = data.end_time;
          var historyUserNum = data.history_user_num;
          wx.navigateTo({
            url: '../room/room?rtmpUrl=' + flvUrl + '&coverLogo=' + coverLogo +
              '&liveImage=' + liveImage + '&liveStatus=' + liveStatus + '&detail=' +
              detail + '&name=' + name + '&startTime=' + startTime + '&channel=' +
              id + '&visitId=' + visitId + '&userName=' + userName + '&endTime=' +
              endTime + '&historyUserNum=' + historyUserNum,
            success: function() {

            }, //成功后的回调；  
            fail: function() {}, //失败后的回调；  
            complete: function() {} //结束后的回调(成功，失败都会执行)  
          })
        } else if (data.result == 'fail') {
          that.setData({
            button: false
          });
          wx.showToast({
            title: '获取频道失败：' + data.reason,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: function() {
        wx.hideLoading();
        that.setData({
          button: false
        });
        wx.showToast({
          title: '美播云互动：获取频道失败。',
          icon: 'none',
          duration: 2000
        })

      }
    })
  },

  enterPlayback: function(e){
    var playback = e.currentTarget.dataset.playback;
    wx.navigateTo({
      url: '../playback/playback?videoUrl=' + playback.videoUrl + '&time=' + playback.time +
        '&title=' + playback.name,
      success: function () {

      }, //成功后的回调；  
      fail: function () { }, //失败后的回调；  
      complete: function () { } //结束后的回调(成功，失败都会执行)  
    })
  },

  // reload: function() {
  //   wx.showNavigationBarLoading()
  //   page_channel = 1;
  //   page_playback = 1;
  //   getChannelList(this, '', page_channel, false);
  //   if (isChannelLoadAll) {
  //     getPlaybackList(this, '', 1, false);
  //   } 
  // },

  // loadmore: function() {
  //   page_channel++;
  //   getChannelList(this, '', page_channel, true);
  //   if (isChannelLoadAll) {
  //     page_playback++;
  //     getPlaybackList(this, '', 1, true);
  //   } 
  // },

  searchValueInput: function(e) {
    var value = e.detail.value;
    this.setData({
      searchValue: value,
    });
  },

  search: function() {
    var filter = this.data.searchValue;
    getChannelList(this, filter, 1, false);
  }

})


function getChannelList(that, filter, page, loadmore) {
  // var channelive = [{
  //   channel: '1',
  //   name: 'And loved the sorrows of your changing face',
  //   status: 1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1',
  //   time: '2018-06-19 20:36:44',
  //   userNum: '23',
  //   commentCount: '33'
  // }, {
  //   channel: '1',
  //   name: '我是一个名字很长很长很长很长的标题，好像还不够长，怎么办。',
  //   status: 1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1',
  //   time: '2018-06-19 20:36:44',
  //   userNum: '23',
  //   commentCount: '33'
  // }, ]
  // var channewait = [{
  //   channel: '1',
  //   name: '人生若只如初见，何事秋风悲画扇。',
  //   status: 0,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1',
  //   time: '2018-06-19 20:36:44',
  //   userNum: '23',
  //   commentCount: '33'
  // }, {
  //   channel: '1',
  //   name: 'test',
  //   status: 0,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1',
  //   time: '2018-06-19 20:36:44',
  //   userNum: '23',
  //   commentCount: '33'
  // }, ]
  // var channeend = [{
  //   channel: '1',
  //   name: 'test',
  //   status: -1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1',
  //   time: '2018-06-19 20:36:44',
  //   userNum: '23',
  //   commentCount: '33'
  // }, {
  //   channel: '1',
  //   name: 'test',
  //   status: -1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1',
  //   time: '2018-06-19 20:36:44',
  //   userNum: '23',
  //   commentCount: '33'
  // }, ]
//http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/19317ad05285890781006571667/f0.mp4", transcodeList: Array(1), start_time: "2018-08-09 18:27:27", cover_url: "http://1256653728.vod2.myqcloud.com/cdd899f4vodtra…85890781006571667/1533812511_3195201632.100_0.jpg
  // var p = [{
  //   videoUrl: 'http://1256653728.vod2.myqcloud.com/19b0f74cvodgzp1256653728/19317ad05285890781006571667/f0.mp4',
  //   name: '宽窄带',
  //   image: "https://api.imbcloud.cn/res/img/login_bg.jpg",
  //   time: '2018-08-09 18:27:27',
  //   userNum: '22'
  // }];
  // that.setData({
  //   liveChannels: channelive,
  //   waitChannels: channewait,
  //   endChannels: channeend,
  //   playbacks: p
  // })

  var StringToSign =
    "GET" + "\n" +
    new Date().toGMTString() + "\n" +
    "\n\n" +
    channelsUrl + "?live=&channel_id=" + filter + "&order=live_status|desc&page=" + page;
  var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
  var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
  var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
  wx.request({
    url: channelsUrl,
    data: {
      live: '',
      channel_id: filter,
      order: 'live_status|desc',
      page: page
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
      console.log(data);
      if (data.result == 'success') {
        var current = data.meta.current;
        var pages = data.meta.pages;
        if (current == pages) {
          isChannelLoadAll = true;
        }
        var channels = data.channels;
        //如果是刷新，重置liveChannels等数组。如果是加载更多，在原本的liveChannels数组上添加。
        if (loadmore) {
          var liveChannels = that.data.liveChannels;
          var waitChannels = that.data.waitChannels;
          var endChannels = that.data.endChannels;
        } else {
          var liveChannels = new Array();
          var waitChannels = new Array();
          var endChannels = new Array();
        }
        for (var i = 0; i < channels.length; i++) {
          var channel = channels[i];
          var name = channel.name;
          var status = channel.live_status;
          var image = '../../images/login_bg.jpg';
          if (channel.live_image && channel.live_image != '') {
            image = channel.live_image;;
          }
          var id = channel.channel_id;
          var time = channel.start_time;
          var commentCount = channel.comment_count;
          var userNum;
          if (status == -1) {
            userNum = channel.online_user_num;
          } else {
            userNum = channel.history_user_num;
          }
          if (userNum == '' || userNum == null) {
            userNum = 0;
          }
          if (commentCount == '' || commentCount == null) {
            commentCount = 0;
          }
          var channelObj = {
            channel: channel,
            name: name,
            status: status,
            image: image,
            id: id,
            time: time,
            commentCount: commentCount,
            userNum: userNum
          }
          if (status == 1) {
            liveChannels.push(channelObj);
          } else if (status == 0) {
            waitChannels.push(channelObj);
          } else {
            endChannels.push(channelObj);
          }
        }
        that.setData({
          liveChannels: liveChannels,
          waitChannels: waitChannels,
          endChannels: endChannels,
          isHideLoadMore: true
        })
      } else {
        // wx.showToast({
        //   title: '获取频道列表失败：' + data.reason,
        //   icon: 'none',
        //   duration: 2000
        // });
        that.setData({
          isHideLoadMore: true,
          isLoadAll: false
        });
      }
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    },
    fail: function(res) {
      console.log(res);
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      that.setData({
        isHideLoadMore: true,
        isLoadAll: false
      });
    }
  })
}

function getPlaybackList(that, filter, page, loadmore) {
  var StringToSign =
    "GET" + "\n" +
    new Date().toGMTString() + "\n" +
    "\n\n" +
    playbacksUrl + "?title=" + filter + "&status=1&page=" + page;
  var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
  var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
  var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
  wx.request({
    url: playbacksUrl,
    data: {
      title: filter,
      status: 1,
      page: page
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
        var current = data.meta.current;
        var pages = data.meta.pages;
        if (current == pages) {
          isPlayBackLoadAll = true;
        }
        var videos = data.videos;
        //如果是刷新，重置liveChannels等数组。如果是加载更多，在原本的liveChannels数组上添加。
        if (loadmore) {
          var playbacks = that.data.playbacks;
        } else {
          var playbacks = new Array();
        }
        for (var i = 0; i < videos.length; i++) {
          var video = videos[i];
          var name = video.title;
          var image = video.cover_url;
          var time = video.start_time;
          var userNum = video.history_visitor_num;
          var videoUrl = video_url;
          if (userNum == '' || userNum == null) {
            userNum = 0;
          }
          var playbackObj = {
            videoUrl: videoUrl,
            name: name,
            image: image,
            time: time,
            userNum: userNum
          }
          playbacks.push(playbackObj);
        }
        that.setData({
          playbacks: playbacks,
          isHideLoadMore: true
        })
      } else {
        // wx.showToast({
        //   title: '获取频道列表失败：' + data.reason,
        //   icon: 'none',
        //   duration: 2000
        // });
        that.setData({
          isHideLoadMore: true,
          isLoadAll: false
        });
      }
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    },
    fail: function(res) {
      console.log(res);
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      that.setData({
        isHideLoadMore: true,
        isLoadAll: false
      });
    }
  })
}