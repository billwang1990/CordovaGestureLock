(function() {
    window.GesturePersistent = function(obj) {
        this.passwordKey = "gesturePassword";
        this.chooseTypeKey = "chooseType";
    }

    GesturePersistent.prototype.chooseType = function() {
        return Number((window.localStorage.getItem(this.chooseTypeKey)));
    }

    GesturePersistent.prototype.setChooseType = function(type) {
        window.localStorage.setItem(this.chooseTypeKey, type);
    }

    GesturePersistent.prototype.existPassword = function() {
        return window.localStorage.getItem(this.passwordKey) != null;
    }

    GesturePersistent.prototype.retrievePassword = function() {
        return JSON.parse(window.localStorage.getItem(this.passwordKey));
    }

    GesturePersistent.prototype.savePassword = function(password) {
        window.localStorage.setItem(this.passwordKey, JSON.stringify(password));
    }

    GesturePersistent.prototype.removePassword = function() {
        window.localStorage.removeItem(this.passwordKey);
    }
})();


(function() {
    if(typeof State == "undefined"){
        var State = {};
        State.CreateNew = 1;
        State.CheckGesture = 2;
    }

    window.GestureLock = function(obj) {
        this.persistent = new GesturePersistent;
        this.chooseType = this.persistent.chooseType() || obj.chooseType;
        this.persistent.setChooseType(this.chooseType);
        this.initialize();
    };

    function getDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    GestureLock.prototype.pickPoints = function(fromPt, toPt) {
        var lineLength = getDistance(fromPt, toPt);
        var dir = toPt.index > fromPt.index ? 1 : -1;

        var len = this.restPoint.length;
        var i = dir === 1 ? 0 : (len - 1);
        var limit = dir === 1 ? len : -1;

        while (i !== limit) {
            var pt = this.restPoint[i];

            if (getDistance(pt, fromPt) + getDistance(pt, toPt) === lineLength) {
                this.drawPoint(pt.x, pt.y);
                this.lastPoint.push(pt);
                this.restPoint.splice(i, 1);
                if (limit > 0) {
                    i--;
                    limit--;
                }
            }

            i += dir;
        }
    }

    GestureLock.prototype.drawCle = function(x, y) { // 初始化解锁密码面板
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    GestureLock.prototype.drawPoint = function() { // 初始化圆心
        for (var i = 0; i < this.lastPoint.length; i++) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(this.lastPoint[i].x, this.lastPoint[i].y, this.r / 2, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    GestureLock.prototype.drawStatusPoint = function(type) { // 初始化状态线条
        for (var i = 0; i < this.lastPoint.length; i++) {
            this.ctx.strokeStyle = type;
            this.ctx.beginPath();
            this.ctx.arc(this.lastPoint[i].x, this.lastPoint[i].y, this.r, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    GestureLock.prototype.drawLine = function(po, lastPoint) { // 解锁轨迹
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(this.lastPoint[0].x, this.lastPoint[0].y);
        console.log(this.lastPoint.length);
        for (var i = 1; i < this.lastPoint.length; i++) {
            this.ctx.lineTo(this.lastPoint[i].x, this.lastPoint[i].y);
        }
        this.ctx.lineTo(po.x, po.y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    GestureLock.prototype.createCircle = function() { // 创建解锁点的坐标，根据canvas的大小来平均分配半径
        var canvas = document.getElementById('canvas');
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;

        var n = this.chooseType;
        var count = 0;
        this.r = this.ctx.canvas.width / (2 + 4 * n); // 公式计算
        this.lastPoint = [];
        this.arr = [];
        this.restPoint = [];
        var r = this.r;
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                count++;
                var obj = {
                    x: j * 4 * r + 3 * r,
                    y: i * 4 * r + 3 * r,
                    index: count
                };
                this.arr.push(obj);
                this.restPoint.push(obj);
            }
        }
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (var i = 0; i < this.arr.length; i++) {
            this.drawCle(this.arr[i].x, this.arr[i].y);
        }
    }

    GestureLock.prototype.getPosition = function(e) { // 获取touch点相对于canvas的坐标
        var rect = e.currentTarget.getBoundingClientRect();
        var po = {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
        return po;
    }

    GestureLock.prototype.update = function(po) { // 核心变换方法在touchmove时候调用
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (var i = 0; i < this.arr.length; i++) { // 每帧先把面板画出来
            this.drawCle(this.arr[i].x, this.arr[i].y);
        }

        this.drawPoint(this.lastPoint); // 每帧花轨迹
        this.drawLine(po, this.lastPoint); // 每帧画圆心

        for (var i = 0; i < this.restPoint.length; i++) {
            var pt = this.restPoint[i];

            if (Math.abs(po.x - pt.x) < this.r && Math.abs(po.y - pt.y) < this.r) {
                this.drawPoint(pt.x, pt.y);
                this.pickPoints(this.lastPoint[this.lastPoint.length - 1], pt);
                break;
            }
        }
    }

    GestureLock.prototype.checkPass = function(psw1, psw2) { // 检测密码
        var p1 = '',
            p2 = '';
        for (var i = 0; i < psw1.length; i++) {
            p1 += psw1[i].index + psw1[i].index;
        }
        for (var i = 0; i < psw2.length; i++) {
            p2 += psw2[i].index + psw2[i].index;
        }
        return p1 === p2;
    }

    GestureLock.prototype.complete = function() {
        var iframe = document.createElement("IFRAME");
        iframe.style.display = "none";
        iframe.setAttribute("src", "gestureLockCustomScheme://com.cordova.gestureLock");
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    }

    GestureLock.prototype.storePass = function(psw) { // touchend结束之后对密码和状态的处理
        if (this.pswObj.step == State.CreateNew) {
            if (this.checkPass(this.pswObj.fpassword, psw)) {
                this.pswObj.step = State.CheckGesture;
                this.pswObj.spassword = psw;
                document.getElementById('title').innerHTML = '密码保存成功';
                this.drawStatusPoint('#2CFF26');
                this.persistent.savePassword(this.pswObj.spassword);
                this.complete();
            } else {
                document.getElementById('title').innerHTML = '两次不一致，重新输入';
                this.drawStatusPoint('red');
                delete this.pswObj.step;
            }
        } else if (this.pswObj.step == State.CheckGesture) {
            if (this.checkPass(this.pswObj.spassword, psw)) {
                document.getElementById('title').innerHTML = '解锁成功';
                this.drawStatusPoint('#2CFF26');
                this.complete();
            } else {
                this.drawStatusPoint('red');
                document.getElementById('title').innerHTML = '解锁失败';
            }
        } else {
            this.pswObj.step = State.CreateNew;
            this.pswObj.fpassword = psw;
            document.getElementById('title').innerHTML = '再次输入';
        }
    }

    GestureLock.prototype.makeState = function() {
        if (this.pswObj.step == State.CheckGesture) {
            document.getElementById('updatePassword').style.display = 'block';
            document.getElementById('title').innerHTML = '请解锁';
        } else if (this.pswObj.step == State.CreateNew) {
            document.getElementById('updatePassword').style.display = 'none';
        } else {
            document.getElementById('updatePassword').style.display = 'none';
        }
    }

    GestureLock.prototype.setChooseType = function(type) {
        chooseType = type;
        initialize();
    }

    GestureLock.prototype.updatePassword = function() {
        this.persistent.removePassword();
        this.pswObj = {};
        document.getElementById('title').innerHTML = '绘制解锁图案';
        this.reset();
    }

    GestureLock.prototype.initDom = function() {
        var wrap = document.createElement('div');
        var str = 
            '<h4 id="title" class="title">绘制解锁图案</h4>' +
            '<a id="updatePassword" style="position: absolute;right: 5px;top: 5px;color:#fff;font-size: 10px;display:none;">重置密码</a>' +
            '<canvas id="canvas" style="width: 75vw; height:75vw; background-color: #00000099;display: inline-block;margin: 0;padding=0;"></canvas>'
        wrap.setAttribute('id', 'wrapper');
        wrap.setAttribute('style', 'background-color: #6050EE; position: absolute; width: 100vw; min-height: 100vh; left: 0; top: 0;');
        wrap.innerHTML = str;
        document.body.appendChild(wrap);
    }

    GestureLock.prototype.initialize = function() {
        if (document.getElementById('wrapper') != null) {
            return;
        }
        this.initDom();
        this.pswObj = this.persistent.existPassword() ? {
            step: State.CheckGesture,
            spassword: this.persistent.retrievePassword()
        } : {};
        this.lastPoint = [];
        this.makeState();
        this.touchFlag = false;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.createCircle();
        this.bindEvent();
    }
    
    GestureLock.prototype.reset = function() {
        this.makeState();
        this.createCircle();
    }

    GestureLock.prototype.bindEvent = function() {
        var self = this;
        this.canvas.addEventListener("touchstart", function(e) {
            e.preventDefault(); // 某些android 的 touchmove不宜触发 所以增加此行代码
            var po = self.getPosition(e);
            console.log(po);
            for (var i = 0; i < self.arr.length; i++) {
                if (Math.abs(po.x - self.arr[i].x) < self.r && Math.abs(po.y - self.arr[i].y) < self.r) {

                    self.touchFlag = true;
                    self.drawPoint(self.arr[i].x, self.arr[i].y);
                    self.lastPoint.push(self.arr[i]);
                    self.restPoint.splice(i, 1);
                    break;
                }
            }
        }, false);
        this.canvas.addEventListener("touchmove", function(e) {
            if (self.touchFlag) {
                self.update(self.getPosition(e));
            }
        }, false);
        this.canvas.addEventListener("touchend", function(e) {
            if (self.touchFlag) {
                self.touchFlag = false;
                self.storePass(self.lastPoint);
                setTimeout(function() {
                    self.reset();
                }, 300);
            }
        }, false);

        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, false);

        document.getElementById('updatePassword').addEventListener('click', function() {
            self.updatePassword();
        });
    }
})();
