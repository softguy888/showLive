const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const UnicodeToUtf8 = function (unicode) {
  var uchar;
  var utf8str = "";
  var i;
  for (i = 0; i < unicode.length; i += 2) {
    uchar = (unicode[i] << 8) | unicode[i + 1];        //UNICODE为2字节编码，一次读入2个字节 
    utf8str = utf8str + String.fromCharCode(uchar);  //使用String.fromCharCode强制转换 
  }
  return utf8str;
  
    // const code = encodeURIComponent(text);
    // var bytes = "";
    // for (var i = 0; i < code.length; i++) {
    //   const c = code.charAt(i);
    //   if (c === '%') {
    //     const hex = code.charAt(i + 1) + code.charAt(i + 2);
    //     const hexVal = parseInt(hex, 16);
    //     bytes = bytes+(hexVal);
    //     i += 2;
    //   } else bytes = bytes+(c.charCodeAt(0));
    // }
    // return bytes;
  
} 

module.exports = {
  formatTime: formatTime,
  UnicodeToUtf8: UnicodeToUtf8
}