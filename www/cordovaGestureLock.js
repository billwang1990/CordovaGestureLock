var exec = require('cordova/exec');

exports.showGestureLock = function(arg0, success, error) {
    exec(success, error, "cordovaGestureLock", "showGestureLock", [arg0]);
};

