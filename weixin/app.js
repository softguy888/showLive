//app.js
App({
  globalData: {
    userInfo: null,
    // AccessKeyId: '000002',
    // AccessKeySecret: 'abcd5678'
    AccessKeyId: 'admin',
    AccessKeySecret: 'imb_cloud123'
    // AccessKeyId: 'admin',
    // AccessKeySecret: 'admin'
  },

  onLaunch: function(options) {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: function(res) {
        console.log('res.code:' + res.code);
        //发送给后台获取openid,unionid
        if (res.code) {
          //https://api.weixin.qq.com/sns/jscode2session?appid=wx842b8a8a5b90c64a&secret=576b6626cda0c3a59de0f1667fd4dbb0&js_code=0819eKXN0IJREb20XO0O0JAIXN09eKXs&grant_type=authorization_code
          //{"session_key":"O\/YVQPHxQY18DrsFq+\/bjQ==","openid":"owLMM5NEZ6izEtP2aPKiLYlJ520E","unionid":"ojygT1ogRmgs7AiQp2nAtQthYlxY"}
          //发起网络请求
          wx.request({
            url: 'https://api.imbcloud.cn/miniappsAuth.do',
            data: {
              code: res.code,
            },
            success: function(data) {
              console.log(data);
              if (data.data.result == 'true') {
                var unionid = data.data.unionid;
                var openid = data.data.openid;
                if (!unionid || unionid == '') {
                  wx.showToast({
                    title: '微信登陆失败:没有获取unionid',
                    icon: 'none',
                    duration: 2000
                  });
                } else {
                  try {
                    wx.setStorageSync('unionid', unionid)
                  } catch (e) {
                    console.error(e);
                  }
                }
              } else {
                wx.showToast({
                  title: '微信登陆失败:' + data.errMsg,
                  icon: 'none',
                  duration: 2000
                });
              }
            },
            fail: function(data) {
              wx.showToast({
                title: '微信登陆失败: 请求失败',
                icon: 'none',
                duration: 2000
              });
            }
          })
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    });
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    console.log('options:' + options.scene);
  },
})