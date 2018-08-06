const app = getApp();
var channelsUrl = "https://api.imbcloud.cn:5443/access/channels";
var CusBase64 = require('../../utils/base64.js');
var CryptoJS = require("../../utils/crypto-js");
var page_channel = 1;

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
    // 查看是否授权
    wx.getSetting({
      success: function(res) {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: function(res) {
              that.setData({
                userInfo: res.userInfo,
                hasUserInfo: true
              })
            }
          })
        }
      }
    });
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          windowHeight: res.windowHeight,
          windowWidth: res.windowWidth
        });
      }
    });
  },

  onShareAppMessage: function (res) {
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
    getChannelList(this, '', 1);
  },

  onReachBottom: function() {
    this.setData({
      isHideLoadMore: false,
      isLoadAll: true
    });
    page_channel++;
    getChannelList(this, '', page_channel, true);
  },

  onPullDownRefresh: function() {
    wx.showNavigationBarLoading();
    page_channel = 1;
    getChannelList(this, '', page_channel, false);
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
    var userName = CusBase64.CusBASE64.encoder(that.data.userInfo.nickName);
    var StringToSign =
      "GET" + "\n" +
      new Date().toGMTString() + "\n" +
      "\n\n" +
      channelsUrl + '/' + id + "?direct_code=&visit_name=" +
      userName + "&visit_id=&date=" + datetmp;
    var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
    var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
    var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
    wx.request({
      url: channelsUrl + '/' + id,
      data: {
        direct_code: '',
        visit_name: userName,
        visit_id: '',
        date: datetmp

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
            url: '../room/room?rtmpUrl=' + rtmpUrl + '&coverLogo=' + coverLogo +
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

  reload: function() {
    wx.showNavigationBarLoading()
    page_channel = 1;
    getChannelList(this, '', page_channel, false);
  },

  loadmore: function() {
    page_channel++;
    getChannelList(this, '', page_channel, true);
  },

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
  //   name: 'test',
  //   status: 1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1'
  // }, {
  //   channel: '1',
  //   name: 'test',
  //   status: 1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1'
  // }, ]
  // var channewait = [{
  //   channel: '1',
  //   name: 'test',
  //   status: 0,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1'
  // }, {
  //   channel: '1',
  //   name: 'test',
  //   status: 0,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1'
  // }, ]
  // var channeend = [{
  //   channel: '1',
  //   name: 'test',
  //   status: -1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1'
  // }, {
  //   channel: '1',
  //   name: 'test',
  //   status: -1,
  //   image: 'https://api.imbcloud.cn/res/img/login_bg.jpg',
  //   id: '1'
  // }, ]
  // that.setData({
  //   liveChannels: channelive,
  //   waitChannels: channewait,
  //   endChannels: channeend,
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
          var image = channel.live_image;
          var id = channel.channel_id;
          var channelObj = {
            channel: channel,
            name: name,
            status: status,
            image: image,
            id: id
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