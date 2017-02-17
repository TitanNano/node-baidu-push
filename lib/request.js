let child_process = require('child_process');

let _ = require('lodash');
let request = require('request');

let signKey = require('./sign');
let BaiduPushError = require('./error');
let { cleanHeaderValue } = require('validate-http-header/rules');

// default UA
let UA = 'BCCS_SDK/3.0 (Drain) node/' + process.version + ' (Baidu Push Server SDK V3.0.0)';
if (child_process.execSync) {
  UA = child_process.execSync('uname -a', {encoding: 'ascii'});
  UA = 'BCCS_SDK/3.0 (' + UA + ') node/' + process.version + ' (Baidu Push Server SDK V3.0.0)';
  UA = cleanHeaderValue(UA);
} else {
  child_process.exec('uname -a', {encoding: 'ascii'}, function(err, stdout) {
    if (err) throw err;
    UA = 'BCCS_SDK/3.0 (' + stdout + ') node/' + process.version + ' (Baidu Push Server SDK V3.0.0)';
    UA = cleanHeaderValue(UA);
  });
}

module.exports = function(url, data, callback) {
  let options = {
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    }
  };

  options.method = 'POST';
  options.url = this.protocol + this.host + url;
  options.gzip = true;
  options.json = true;

  for (let key in data) {
    if (_.isArray(data[key])) {
      data[key] = JSON.stringify(data[key]);
    }
  }

  options.form = data;
  _.extend(options.form, {
    apikey: this.pair.apiKey,
    timestamp: Math.floor(Date.now() / 1000)
  });

  options.form.sign = signKey(options.url, data, this.pair.secretKey);

  request(options, function(err, res, data) {
    if (!err && data.error_code) {
      err = new BaiduPushError(data.error_msg);
      err.code = data.error_code;
      err.requestId = data.request_id;
    }
    if (err) {
      callback(err);
    } else {
      callback(null, data.response_params);
    }
  });
};
