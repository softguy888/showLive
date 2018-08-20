var authUrl = "https://api.imbcloud.cn:5443/access/accounts/auth"

Page({
  data: {
    phone: '',
    password: ''
  },

  // 获取输入账号
  phoneInput: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },

  // 获取输入密码
  passwordInput: function (e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 登录
  login: function () {
    var name = this.data.phone;
    var passwd = this.data.password;
    if (this.data.phone.length == 0 || this.data.password.length == 0) {
      wx.showToast({
        title: '用户名和密码不能为空',
        icon: 'none',
        duration: 2000
      })
    } else {
      // 这里修改成跳转的页面
      // wx.showToast({
      //   title: '登录成功',
      //   icon: 'success',
      //   duration: 2000
      // })
      wx.request({
        url: authUrl,
        data: {
          naem: name,
          passwd: passwd
        },
        header: {
          'Authorization': 'iMBCloud',
          'Date': new Date().toGMTString(),
          'content-type': 'application/json' // 默认值
        },
        method: 'GET',
        dataType: 'json',
        success: function (res) {
          var data = res.data;
          console.log(data);
          if (data.result == 'success') {
            var accountId = data.account_id;
            var accountType = data.type;
            var AccessKeyId = data.access_key_id;
            var AccessKeySecret = data.access_key_secret;
            try {
              wx.setStorageSync('accountId', accountId);
              wx.setStorageSync('accountType', accountType);
              wx.setStorageSync('AccessKeyId', AccessKeyId);
              wx.setStorageSync('AccessKeySecret', AccessKeySecret);
            } catch (e) {
              wx.showToast({
                title: '设置账户信息失败',
                icon: 'none',
                duration: 2000
              });
            }
            wx.redirectTo({
              url: '../main/main'
            })
          } else {
            wx.showToast({
              title: '账户密码错误',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: function (res) {
          console.log(res);
         
        }
      })
    }
  }
})