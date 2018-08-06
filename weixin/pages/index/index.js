//index.js
//获取应用实例
const app = getApp()
const channelUrl = "https://api.imbcloud.cn:5443/access/channels/";
var CusBase64 = require('../../utils/base64.js');
var CryptoJS = require("../../utils/crypto-js");
//import Base64 from '../../utils/crypto-js/enc-base64';
var util = require('../../utils/util');


Page({
  data: {
    Num: null,
    title: '房间号：',
    text: '请输入',
    motto: 'Hello Itachi',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    button: false
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function() {
    // if (app.globalData.userInfo) {
    //   this.setData({
    //     userInfo: app.globalData.userInfo,
    //     hasUserInfo: true
    //   })
    // } else if (this.data.canIUse) {
    //   // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //   // 所以此处加入 callback 以防止这种情况
    //   app.userInfoReadyCallback = res => {
    //     this.setData({
    //       userInfo: res.userInfo,
    //       hasUserInfo: true
    //     })
    //   }
    // } else {
    //   // 在没有 open-type=getUserInfo 版本的兼容处理
    //   wx.getUserInfo({
    //     success: res => {
    //       app.globalData.userInfo = res.userInfo
    //       this.setData({
    //         userInfo: res.userInfo,
    //         hasUserInfo: true
    //       })
    //     }
    //   })
    // }

  },
  onShow: function() {
    this.setData({
      button: false
    });
  },
  // getUserInfo: function(e) {
  //   console.log(e)
  //   app.globalData.userInfo = e.detail.userInfo
  //   this.setData({
  //     userInfo: e.detail.userInfo,
  //     hasUserInfo: true
  //   })
  // },
  goLive: function() {
    var that = this;
    that.setData({
      button: true
    });
    wx.showLoading({
      title: '加载中',
    })
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
              var id = that.data.Num;
              if (null == id || '' == id) {
                wx.showToast({
                  title: '美播云互动：请输入频道',
                  icon: 'none',
                  duration: 2000
                })
                return;
              }
              var datetmp = new Date().getTime();
              var userName = CusBase64.CusBASE64.encoder(that.data.userInfo.nickName);
              var StringToSign =
                "GET" + "\n" +
                new Date().toGMTString() + "\n" +
                "\n\n" +
                channelUrl + id + "?direct_code=&visit_name=" +
                userName + "&visit_id=&date=" + datetmp;
              var hmacsha1 = "" + CryptoJS.HmacSHA1(StringToSign, app.globalData.AccessKeySecret);
              var wordArray = CryptoJS.enc.Utf8.parse(hmacsha1);
              var base64_auth = CryptoJS.enc.Base64.stringify(wordArray)
              wx.request({
                url: channelUrl + id,
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
                    wx.navigateTo({
                      url: '../room/room?rtmpUrl=' + rtmpUrl + '&coverLogo=' + coverLogo +
                        '&liveImage=' + liveImage + '&liveStatus=' + liveStatus + '&detail=' +
                        detail + '&name=' + name + '&startTime=' + startTime + '&channel=' +
                        id + '&visitId=' + visitId + '&userName=' + userName,
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
            }
          })
        } else {
          return;
        }
      }
    })

    // wx.navigateTo({
    //   url: '../room/room?rtmpUrl=http://23576.liveplay.myqcloud.com/live/23576_666666.flv&coverLogo=https://api.imbcloud.cn/uploadFile/1530690689234/微信图片_20180704155054.png&liveImage=https://api.imbcloud.cn/res/img/login_bg.jpg&liveStatus=1',
    //   success: function () {

    //   }, //成功后的回调；  
    //   fail: function () { }, //失败后的回调；  
    //   complete: function () { } //结束后的回调(成功，失败都会执行)  
    // })
  },
  setNum: function(e) {
    this.data.Num = e.detail.value;

  },
  onShareAppMessage: function() {
    return {
      title: '美播云互动',
      desc: '美播云直播平台!',
      path: '/out/out',
      success: function(shareTickets) {
        console.info(shareTickets + '成功');
        wx.showToast({
          title: '成功',
          icon: 'sucess',
          duration: 2000
        })
        // 转发成功  
      },
      fail: function(res) {
        console.log(res + '失败');
        wx.showToast({
          title: '失败',
          icon: 'none',
          duration: 2000
        })
        // 转发失败  
      },
      complete: function(res) {
        // 不管成功失败都会执行  
      }
    }
  }

})