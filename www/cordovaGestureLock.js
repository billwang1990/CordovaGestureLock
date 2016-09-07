var exec = require('cordova/exec');

exports.handleUnLockEvent = function(arg0, success, error) {
    exec(success, error, "cordovaGestureLock", "handleUnLockEvent", [arg0]);
};
