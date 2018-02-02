(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) : 
	typeof define === 'function' && (define.cmd || define.hjs) ? define(function(require,exports,module){module.exports = factory()}) :
	(global.Lazyload = factory());
}(this, (function () { 'use strict';

var $Blob = function (array, option) {
    if (window.Blob) {
        return new Blob(array, option);
    }
    else {
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
        if (window.BlobBuilder) {
            var bb = new BlobBuilder();
            bb.append(array);
            return bb.getBlob(typeof option === 'object' ? option.type : undefined);
        }
        
        return bb;
    }
    
};

var $addEvent = function (e, type, fn, mark) {
    if (e.addEventListener) {
        e.addEventListener(type, fn, false);
    }
    else if (e.attachEvent) {
        //e.detachEvent('on'+type,fn);
        e.attachEvent('on' + type, function () {
            fn.call(e, window.event);
        });
    }
    
};

var $URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
var Lazyload = /** @class */ (function () {
    function Lazyload(obj) {
        var _ts = this;
        var config = _ts.config = {}, data = _ts.data = {}, o = _ts.obj = {
            doc: document.documentElement,
            body: document.body
        }, blankImg = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==';
        for (var i in obj) {
            _ts.config[i] = obj[i];
        }
        
        //默认容差在100像
        _ts.config['range'] = typeof _ts.config['range'] === 'numver' ? _ts.config['range'] : 100;
        //图片方法扩展
        _ts.imageExtend();
        //图片数据处理
        for (var i = 0, len = config.obj.length; i < len; i++) {
            var item = config.obj[i], dataSrc = item.lazy_dataSrc = item.getAttribute('data-src'), dataCover = item.lazy_dataCover = item.getAttribute('data-cover');
            if (item.src === '') {
                item.src = blankImg;
            }
            
            item.removeAttribute('data-src');
            //将获取的对象存储起来
            if (data[dataSrc] === undefined) {
                data[dataSrc] = [];
            }
            
            data[dataSrc].push(item);
        }
        
    }
    Lazyload.prototype.init = function () {
        var _ts = this, config = _ts.config, data = _ts.data, o = _ts.obj, task, temp;
        //图片更新执行
        (task = function () {
            //得到当前屏幕区域的需要更新图片列表
            var eList = _ts.getShowList();
            //遍历加载图片
            for (var i = 0, len = eList.length; i < len; i++) {
                var item = eList[i];
                _ts.loadImg(item);
            }
            
        })();
        var run = function () {
            clearTimeout(temp);
            temp = setTimeout(task, 200);
        };
        $addEvent(window, 'scroll', run);
        $addEvent(window, 'resize', run);
    };
    /**
     * 图片方法扩展
     *
     * @memberof Lazyload
     */
    Lazyload.prototype.imageExtend = function () {
        var _ts = this;
        Image.prototype.load = function (url, oL) {
            var updateImg = function (src) {
                //更新图片
                for (var i = 0, len = oL.length; i < len; i++) {
                    var item = oL[i];
                    _ts.updateImg(item, src);
                }
                
            }, updateTips = function (o) {
                //更新提示
                for (var i = 0, len = oL.length; i < len; i++) {
                    var item = oL[i];
                    item.completedPercentage = o;
                    o.o = item;
                    _ts.tips(o);
                }
                
            };
            if ($Blob && $URL && XMLHttpRequest) {
                var img = this, xhr_1 = new XMLHttpRequest();
                xhr_1.open('GET', url, true);
                xhr_1.responseType = 'arraybuffer';
                xhr_1.onload = function (e) {
                    var headers = xhr_1.getAllResponseHeaders(), m = headers.match(/^Content-Type\:\s*(.*?)$/mi), mimeType = m[1] || 'image/png', blob = $Blob([this.response], {
                        type: mimeType
                    }), src = $URL.createObjectURL(blob);
                    updateImg(src);
                };
                xhr_1.onloadstart = xhr_1.onprogress = xhr_1.onloadend = function (e) {
                    var o = {
                        loaded: e.loaded,
                        total: e.total,
                        status: e.type,
                        schedule: e.loaded === 0 ? 0 : e.loaded / e.total
                    };
                    updateTips(o);
                };
                xhr_1.send();
            }
            else {
                var o_1 = {
                    loaded: undefined,
                    total: undefined,
                    status: 'loaded',
                    schedule: 0
                }, temp_1;
                temp_1 = setInterval(function () {
                    if (o_1.schedule > 0.98) {
                        clearInterval(temp_1);
                    }
                    
                    o_1.schedule = o_1.schedule + 0.01;
                    o_1.status = 'progress';
                    updateTips(o_1);
                }, 100);
                this.onload = function () {
                    clearInterval(temp_1);
                    updateImg(this.src);
                    o_1.status = 'loaded';
                    o_1.schedule = 1;
                    updateTips(o_1);
                };
            }
            
        };
    };
    /**
     * 获取浏览器窗口大小
     *
     * @returns {object} 容器宽高
     * @memberof Lazyload
     */
    Lazyload.prototype.getWinSize = function () {
        var _ts = this, o = _ts.obj;
        var o = {
            w: window.innerWidth || o.doc.clientWidth,
            h: window.innerHeight || o.doc.clientHeight
        };
        return o;
    };
    /**
     * 获取页面滚动的像素
     */
    Lazyload.prototype.getWinScroll = function () {
        var d = {
            // x: window.scrollX || document.compatMode == "BackCompat" ? document.body.scrollLeft : document.documentElement.scrollLeft,
            // y: window.scrollY || document.compatMode == "BackCompat" ? document.body.scrollTop : document.documentElement.scrollTop
            x: window.scrollX || document.documentElement.scrollLeft || window.pageXOffset || document.body.scrollLeft,
            y: window.scrollY || document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop
        };
        return d;
    };
    Lazyload.prototype.loadImg = function (o) {
        var _ts = this, data = _ts.data;
        //已经加载过的则不处理
        if (o.lazy_isInit) {
            return;
        }
        
        var list = data[o.lazy_dataSrc];
        // if(o.tagName === 'IMG'){
        //     o.load(o.lazy_dataSrc,list);
        // }else{
        var img = new Image();
        img.load(o.lazy_dataSrc, list);
        img.src = o.lazy_dataSrc;
        // if($Blob){
        // img.load(o.lazy_dataSrc, list);
        // }else{
        //     //模拟加载
        //     img.onload = function(){
        //         for(let i=0,len=list.length; i<len; i++){
        //             let item = list[i];
        //             _ts.updateImg(item,src);
        //         };
        //     };
        // };
        // };
        //更新图片地址相同的元素
        for (var i = 0, len = list.length; i < len; i++) {
            var item = list[i];
            if (item.lazy_isInit) {
                continue;
            }
            
            item.lazy_isInit = true;
            if (item.lazy_dataCover) {
                _ts.updateImg(item, item.lazy_dataCover);
            }
            
        }
        
    };
    /**
     * 更新图片
     *
     * @param {object} o 需要更新的元素
     * @param {string} url 图片地址
     * @memberof Lazyload
     */
    Lazyload.prototype.updateImg = function (o, url) {
        if (o.tagName === 'IMG') {
            o.src = url;
        }
        else {
            o.style.backgroundImage = "url(" + url + ")";
        }
        
    };
    Lazyload.prototype.getElementTop = function (element) {
        var actualTop = element.offsetTop, current = element.offsetParent;
        while (current !== null) {
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
        
        return actualTop;
    };
    Lazyload.prototype.getElementLeft = function (element) {
        var actualLeft = element.offsetLeft, current = element.offsetParent;
        while (current !== null) {
            actualLeft += current.offsetLeft;
            current = current.offsetParent;
        }
        
        return actualLeft;
    };
    /**
     * 获取需要显示的元素
     */
    Lazyload.prototype.getShowList = function () {
        var _ts = this, config = _ts.config;
        var scroll = _ts.getWinScroll(), winSize = _ts.getWinSize(), temp = [];
        //console.log(scroll,winSize)
        for (var i = 0, len = config.obj.length; i < len; i++) {
            var item = config.obj[i], left = _ts.getElementLeft(item), top = _ts.getElementTop(item), width = item.clientWidth, height = item.clientHeight, xl = left + width - scroll.x > 0 - config.range, //页面左侧显示条件
            xr = winSize.w + scroll.x + config.range > left, //页面右侧显示条件
            yt = top + height - scroll.y > 0 - config.range, //页面顶部显示条件
            yb = top < scroll.y + winSize.h + config.range, //页面底部显示条件
            isInit = item.lazy_isInit;
            //console.log(item,isInit,'left',left,'top',top,'width',width,'height',height);
            if (xl && xr && yt && yb && !isInit) {
                temp.push(item);
            }
            
        }
        
        return temp;
    };
    /**
     * 默认的提示方法
     * @param obj --
     */
    Lazyload.prototype.tips = function (obj) {
        var schedule = parseInt(obj.schedule * 100) + '%', o = obj.o;
        if (o.lazy_isEchoTip === undefined) {
            o.lazy_isEchoTip = true;
            o.lazy_oTip = document.createElement('span');
            o.lazy_oTip.className = 'lazy_tip';
            o.parentNode.insertBefore(o.lazy_oTip, o.nextSibling);
            //console.log(o.lazy_otip.parentNode)
        }
        
        o.lazy_oTip.innerHTML = schedule;
        //当加载进度为1时，则移除对应的加载提示
        if (obj.schedule === 1 && o.lazy_isEchoTip) {
            o.parentNode.removeChild(o.lazy_oTip);
            o.lazy_isEchoTip = undefined;
        }
        
    };
    return Lazyload;
}());

return Lazyload;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi9Vc2Vycy9mYW4vd29yay93ZWIvbGF6eWxvYWQvc3JjL2pzL19CbG9iLmVzNiIsIi9Vc2Vycy9mYW4vd29yay93ZWIvbGF6eWxvYWQvc3JjL2pzL19hZGRFdmVudC5lczYiLCIvVXNlcnMvZmFuL3dvcmsvd2ViL2xhenlsb2FkL3NyYy9qcy9MYXp5bG9hZC5lczYiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgKGFycmF5LG9wdGlvbik9PntcbiAgICBpZih3aW5kb3cuQmxvYil7XG4gICAgICAgIHJldHVybiBuZXcgQmxvYihhcnJheSxvcHRpb24pXG4gICAgfWVsc2V7XG4gICAgICAgIHdpbmRvdy5CbG9iQnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1vekJsb2JCdWlsZGVyIHx8IHdpbmRvdy5NU0Jsb2JCdWlsZGVyO1xuICAgICAgICBpZih3aW5kb3cuQmxvYkJ1aWxkZXIpe1xuICAgICAgICAgICAgbGV0IGJiID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgICAgICBiYi5hcHBlbmQoYXJyYXkpO1xuICAgICAgICAgICAgcmV0dXJuIGJiLmdldEJsb2IodHlwZW9mIG9wdGlvbiA9PT0gJ29iamVjdCcgPyBvcHRpb24udHlwZSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBiYjtcbiAgICB9O1xufTsiLCJleHBvcnQgZGVmYXVsdCAoZSx0eXBlLGZuLG1hcmspPT57XG4gICAgaWYoZS5hZGRFdmVudExpc3RlbmVyKXtcbiAgICAgICAgZS5hZGRFdmVudExpc3RlbmVyKHR5cGUsZm4sZmFsc2UpO1xuICAgIH1lbHNlIGlmKGUuYXR0YWNoRXZlbnQpe1xuICAgICAgICAvL2UuZGV0YWNoRXZlbnQoJ29uJyt0eXBlLGZuKTtcbiAgICAgICAgZS5hdHRhY2hFdmVudCgnb24nK3R5cGUsKCk9PntcbiAgICAgICAgICAgIGZuLmNhbGwoZSx3aW5kb3cuZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICB9O1xufTsiLCJpbXBvcnQgJEJsb2IgZnJvbSAnLi9fQmxvYi5lczYnO1xuaW1wb3J0ICRhZGRFdmVudCBmcm9tICcuL19hZGRFdmVudC5lczYnO1xuXG5jb25zdCAkVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMIHx8IHdpbmRvdy5tb3pVUkwgfHwgd2luZG93Lm1zVVJMO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMYXp5bG9hZCB7XG4gICAgY29uc3RydWN0b3Iob2JqKSB7XG4gICAgICAgIGNvbnN0IF90cyA9IHRoaXM7XG4gICAgICAgIGxldCBjb25maWcgPSBfdHMuY29uZmlnID0ge30sXG4gICAgICAgICAgICBkYXRhID0gX3RzLmRhdGEgPSB7fSxcbiAgICAgICAgICAgIG8gPSBfdHMub2JqID0ge1xuICAgICAgICAgICAgICAgIGRvYzogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGJvZHk6IGRvY3VtZW50LmJvZHlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibGFua0ltZyA9ICdkYXRhOmltYWdlL2dpZjtiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJDQVlBQUFBZkZjU0pBQUFBRFVsRVFWUUltV05nWUdCZ0FBQUFCUUFCaDZGTzFBQUFBQUJKUlU1RXJrSmdnZz09JztcblxuICAgICAgICBmb3IgKGxldCBpIGluIG9iaikge1xuICAgICAgICAgICAgX3RzLmNvbmZpZ1tpXSA9IG9ialtpXTtcbiAgICAgICAgfTtcblxuICAgICAgICAvL+m7mOiupOWuueW3ruWcqDEwMOWDj1xuICAgICAgICBfdHMuY29uZmlnWydyYW5nZSddID0gdHlwZW9mIF90cy5jb25maWdbJ3JhbmdlJ10gPT09ICdudW12ZXInID8gX3RzLmNvbmZpZ1sncmFuZ2UnXSA6IDEwMDtcblxuICAgICAgICAvL+WbvueJh+aWueazleaJqeWxlVxuICAgICAgICBfdHMuaW1hZ2VFeHRlbmQoKTtcblxuICAgICAgICAvL+WbvueJh+aVsOaNruWkhOeQhlxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gY29uZmlnLm9iai5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgbGV0IGl0ZW0gPSBjb25maWcub2JqW2ldLFxuICAgICAgICAgICAgICAgIGRhdGFTcmMgPSBpdGVtLmxhenlfZGF0YVNyYyA9IGl0ZW0uZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpLFxuICAgICAgICAgICAgICAgIGRhdGFDb3ZlciA9IGl0ZW0ubGF6eV9kYXRhQ292ZXIgPSBpdGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1jb3ZlcicpO1xuXG4gICAgICAgICAgICBpZiAoaXRlbS5zcmMgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5zcmMgPSBibGFua0ltZztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpdGVtLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcblxuICAgICAgICAgICAgLy/lsIbojrflj5bnmoTlr7nosaHlrZjlgqjotbfmnaVcbiAgICAgICAgICAgIGlmIChkYXRhW2RhdGFTcmNdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkYXRhW2RhdGFTcmNdID0gW107XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZGF0YVtkYXRhU3JjXS5wdXNoKGl0ZW0pO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIGNvbnN0IF90cyA9IHRoaXMsXG4gICAgICAgICAgICBjb25maWcgPSBfdHMuY29uZmlnLFxuICAgICAgICAgICAgZGF0YSA9IF90cy5kYXRhLFxuICAgICAgICAgICAgbyA9IF90cy5vYmosXG4gICAgICAgICAgICB0YXNrLFxuICAgICAgICAgICAgdGVtcDtcblxuICAgICAgICAvL+WbvueJh+abtOaWsOaJp+ihjFxuICAgICAgICAodGFzayA9ICgpID0+IHtcbiAgICAgICAgICAgIC8v5b6X5Yiw5b2T5YmN5bGP5bmV5Yy65Z+f55qE6ZyA6KaB5pu05paw5Zu+54mH5YiX6KGoXG4gICAgICAgICAgICBsZXQgZUxpc3QgPSBfdHMuZ2V0U2hvd0xpc3QoKTtcblxuICAgICAgICAgICAgLy/pgY3ljobliqDovb3lm77niYdcbiAgICAgICAgICAgIGZvcihsZXQgaT0wLGxlbj1lTGlzdC5sZW5ndGg7IGk8bGVuOyBpKyspe1xuICAgICAgICAgICAgICAgIGxldCBpdGVtID0gZUxpc3RbaV0sXG4gICAgICAgICAgICAgICAgICAgIGtleSA9IGl0ZW0ubGF6eV9kYXRhU3JjO1xuICAgICAgICAgICAgICAgIF90cy5sb2FkSW1nKGl0ZW0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgICBsZXQgcnVuID0gKCk9PntcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0ZW1wKTtcbiAgICAgICAgICAgIHRlbXAgPSBzZXRUaW1lb3V0KHRhc2ssIDIwMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJGFkZEV2ZW50KHdpbmRvdywnc2Nyb2xsJyxydW4pO1xuICAgICAgICAkYWRkRXZlbnQod2luZG93LCdyZXNpemUnLHJ1bik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Zu+54mH5pa55rOV5omp5bGVXG4gICAgICogXG4gICAgICogQG1lbWJlcm9mIExhenlsb2FkXG4gICAgICovXG4gICAgaW1hZ2VFeHRlbmQoKSB7XG4gICAgICAgIGNvbnN0IF90cyA9IHRoaXM7XG5cbiAgICAgICAgSW1hZ2UucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAodXJsLCBvTCkge1xuICAgICAgICAgICAgbGV0IHVwZGF0ZUltZyA9IChzcmMpID0+IHtcbiAgICAgICAgICAgICAgICAvL+abtOaWsOWbvueJh1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBvTC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbSA9IG9MW2ldO1xuICAgICAgICAgICAgICAgICAgICBfdHMudXBkYXRlSW1nKGl0ZW0sIHNyYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGVUaXBzID0gKG8pID0+IHtcbiAgICAgICAgICAgICAgICAvL+abtOaWsOaPkOekulxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBvTC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbSA9IG9MW2ldO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbXBsZXRlZFBlcmNlbnRhZ2UgPSBvO1xuICAgICAgICAgICAgICAgICAgICBvLm8gPSBpdGVtO1xuICAgICAgICAgICAgICAgICAgICBfdHMudGlwcyhvKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKCRCbG9iICYmICRVUkwgJiYgWE1MSHR0cFJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW1nID0gdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhlYWRlcnMgPSB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBtID0gaGVhZGVycy5tYXRjaCgvXkNvbnRlbnQtVHlwZVxcOlxccyooLio/KSQvbWkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWltZVR5cGUgPSBtWzFdIHx8ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmxvYiA9ICRCbG9iKFt0aGlzLnJlc3BvbnNlXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IG1pbWVUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYyA9ICRVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVJbWcoc3JjKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgeGhyLm9ubG9hZHN0YXJ0ID0geGhyLm9ucHJvZ3Jlc3MgPSB4aHIub25sb2FkZW5kID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQ6IGUubG9hZGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWw6IGUudG90YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGUudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlOiBlLmxvYWRlZCA9PT0gMCA/IDAgOiBlLmxvYWRlZCAvIGUudG90YWxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlVGlwcyhvKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHhoci5zZW5kKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVkOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b3RhbDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnbG9hZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlOiAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRlbXA7XG5cbiAgICAgICAgICAgICAgICB0ZW1wID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoby5zY2hlZHVsZSA+IDAuOTgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGVtcCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIG8uc2NoZWR1bGUgPSBvLnNjaGVkdWxlICsgMC4wMTtcbiAgICAgICAgICAgICAgICAgICAgby5zdGF0dXMgPSAncHJvZ3Jlc3MnO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaXBzKG8pO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdGhpcy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGVtcCk7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUltZyh0aGlzLnNyYyk7XG4gICAgICAgICAgICAgICAgICAgIG8uc3RhdHVzID0gJ2xvYWRlZCc7XG4gICAgICAgICAgICAgICAgICAgIG8uc2NoZWR1bGUgPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRpcHMobyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6I635Y+W5rWP6KeI5Zmo56qX5Y+j5aSn5bCPXG4gICAgICogXG4gICAgICogQHJldHVybnMge29iamVjdH0g5a655Zmo5a696auYXG4gICAgICogQG1lbWJlcm9mIExhenlsb2FkXG4gICAgICovXG4gICAgZ2V0V2luU2l6ZSgpIHtcbiAgICAgICAgY29uc3QgX3RzID0gdGhpcyxcbiAgICAgICAgICAgIG8gPSBfdHMub2JqO1xuICAgICAgICBsZXQgbyA9IHtcbiAgICAgICAgICAgIHc6IHdpbmRvdy5pbm5lcldpZHRoIHx8IG8uZG9jLmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaDogd2luZG93LmlubmVySGVpZ2h0IHx8IG8uZG9jLmNsaWVudEhlaWdodFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bpobXpnaLmu5rliqjnmoTlg4/ntKBcbiAgICAgKi9cbiAgICBnZXRXaW5TY3JvbGwoKSB7XG4gICAgICAgIGNvbnN0IF90cyA9IHRoaXMsXG4gICAgICAgICAgICBvID0gX3RzLm9iajtcbiAgICAgICAgbGV0IGQgPSB7XG4gICAgICAgICAgICAvLyB4OiB3aW5kb3cuc2Nyb2xsWCB8fCBkb2N1bWVudC5jb21wYXRNb2RlID09IFwiQmFja0NvbXBhdFwiID8gZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICAgICAgICAvLyB5OiB3aW5kb3cuc2Nyb2xsWSB8fCBkb2N1bWVudC5jb21wYXRNb2RlID09IFwiQmFja0NvbXBhdFwiID8gZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgICAgICAgICB4OiB3aW5kb3cuc2Nyb2xsWCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCB8fCB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0LFxuICAgICAgICAgICAgeTogd2luZG93LnNjcm9sbFkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3BcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZDtcbiAgICB9XG5cbiAgICBsb2FkSW1nKG8pIHtcbiAgICAgICAgY29uc3QgX3RzID0gdGhpcyxcbiAgICAgICAgICAgIGRhdGEgPSBfdHMuZGF0YTtcblxuICAgICAgICAvL+W3sue7j+WKoOi9vei/h+eahOWImeS4jeWkhOeQhlxuICAgICAgICBpZiAoby5sYXp5X2lzSW5pdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgbGV0IGxpc3QgPSBkYXRhW28ubGF6eV9kYXRhU3JjXTtcblxuICAgICAgICAvLyBpZihvLnRhZ05hbWUgPT09ICdJTUcnKXtcbiAgICAgICAgLy8gICAgIG8ubG9hZChvLmxhenlfZGF0YVNyYyxsaXN0KTtcbiAgICAgICAgLy8gfWVsc2V7XG4gICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1nLmxvYWQoby5sYXp5X2RhdGFTcmMsIGxpc3QpO1xuICAgICAgICBpbWcuc3JjID0gby5sYXp5X2RhdGFTcmM7XG5cbiAgICAgICAgLy8gaWYoJEJsb2Ipe1xuICAgICAgICAvLyBpbWcubG9hZChvLmxhenlfZGF0YVNyYywgbGlzdCk7XG4gICAgICAgIC8vIH1lbHNle1xuICAgICAgICAvLyAgICAgLy/mqKHmi5/liqDovb1cbiAgICAgICAgLy8gICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpe1xuICAgICAgICAvLyAgICAgICAgIGZvcihsZXQgaT0wLGxlbj1saXN0Lmxlbmd0aDsgaTxsZW47IGkrKyl7XG4gICAgICAgIC8vICAgICAgICAgICAgIGxldCBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgLy8gICAgICAgICAgICAgX3RzLnVwZGF0ZUltZyhpdGVtLHNyYyk7XG4gICAgICAgIC8vICAgICAgICAgfTtcbiAgICAgICAgLy8gICAgIH07XG4gICAgICAgIC8vIH07XG5cbiAgICAgICAgLy8gfTtcblxuXG4gICAgICAgIC8v5pu05paw5Zu+54mH5Zyw5Z2A55u45ZCM55qE5YWD57SgXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbS5sYXp5X2lzSW5pdCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGl0ZW0ubGF6eV9pc0luaXQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoaXRlbS5sYXp5X2RhdGFDb3Zlcil7XG4gICAgICAgICAgICAgICAgX3RzLnVwZGF0ZUltZyhpdGVtLCBpdGVtLmxhenlfZGF0YUNvdmVyKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5pu05paw5Zu+54mHXG4gICAgICogXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG8g6ZyA6KaB5pu05paw55qE5YWD57SgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCDlm77niYflnLDlnYBcbiAgICAgKiBAbWVtYmVyb2YgTGF6eWxvYWRcbiAgICAgKi9cbiAgICB1cGRhdGVJbWcobywgdXJsKSB7XG4gICAgICAgIGlmIChvLnRhZ05hbWUgPT09ICdJTUcnKSB7XG4gICAgICAgICAgICBvLnNyYyA9IHVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG8uc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybCgke3VybH0pYDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBnZXRFbGVtZW50VG9wKGVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGFjdHVhbFRvcCA9IGVsZW1lbnQub2Zmc2V0VG9wLFxuICAgICAgICAgICAgY3VycmVudCA9IGVsZW1lbnQub2Zmc2V0UGFyZW50O1xuXG4gICAgICAgIHdoaWxlIChjdXJyZW50ICE9PSBudWxsKSB744CA44CA44CA44CA44CA44CAXG4gICAgICAgICAgICBhY3R1YWxUb3AgKz0gY3VycmVudC5vZmZzZXRUb3A744CA44CA44CA44CA44CA44CAXG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5vZmZzZXRQYXJlbnQ744CA44CA44CA44CAXG4gICAgICAgIH0744CA44CA44CAXG4gICAgICAgIHJldHVybiBhY3R1YWxUb3A7XG4gICAgfVxuXG4gICAgZ2V0RWxlbWVudExlZnQoZWxlbWVudCkge1xuICAgICAgICBsZXQgYWN0dWFsTGVmdCA9IGVsZW1lbnQub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgIGN1cnJlbnQgPSBlbGVtZW50Lm9mZnNldFBhcmVudDtcbuOAgOOAgOOAgFxuICAgICAgICB3aGlsZSAoY3VycmVudCAhPT0gbnVsbCkge+OAgOOAgOOAgOOAgOOAgOOAgFxuICAgICAgICAgICAgYWN0dWFsTGVmdCArPSBjdXJyZW50Lm9mZnNldExlZnQ744CA44CA44CA44CA44CA44CAXG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5vZmZzZXRQYXJlbnQ744CA44CA44CA44CAXG4gICAgICAgIH07XG4gICAgICAgIOOAgOOAgOOAgOOAgFxuICAgICAgICByZXR1cm4gYWN0dWFsTGVmdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bpnIDopoHmmL7npLrnmoTlhYPntKBcbiAgICAgKi9cbiAgICBnZXRTaG93TGlzdCgpIHtcbiAgICAgICAgY29uc3QgX3RzID0gdGhpcyxcbiAgICAgICAgICAgIGNvbmZpZyA9IF90cy5jb25maWcsXG4gICAgICAgICAgICBkYXRhID0gX3RzLmRhdGE7XG5cbiAgICAgICAgbGV0IHNjcm9sbCA9IF90cy5nZXRXaW5TY3JvbGwoKSxcbiAgICAgICAgICAgIHdpblNpemUgPSBfdHMuZ2V0V2luU2l6ZSgpLFxuICAgICAgICAgICAgdGVtcCA9IFtdO1xuICAgICAgICAvL2NvbnNvbGUubG9nKHNjcm9sbCx3aW5TaXplKVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBjb25maWcub2JqLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgaXRlbSA9IGNvbmZpZy5vYmpbaV0sXG4gICAgICAgICAgICAgICAgbGVmdCA9IF90cy5nZXRFbGVtZW50TGVmdChpdGVtKSxcbiAgICAgICAgICAgICAgICB0b3AgPSBfdHMuZ2V0RWxlbWVudFRvcChpdGVtKSxcbiAgICAgICAgICAgICAgICB3aWR0aCA9IGl0ZW0uY2xpZW50V2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gaXRlbS5jbGllbnRIZWlnaHQsXG4gICAgICAgICAgICAgICAgeGwgPSBsZWZ0ICsgd2lkdGggLSBzY3JvbGwueCA+IDAgLSBjb25maWcucmFuZ2UsIC8v6aG16Z2i5bem5L6n5pi+56S65p2h5Lu2XG4gICAgICAgICAgICAgICAgeHIgPSB3aW5TaXplLncgKyBzY3JvbGwueCArIGNvbmZpZy5yYW5nZSA+IGxlZnQsIC8v6aG16Z2i5Y+z5L6n5pi+56S65p2h5Lu2XG4gICAgICAgICAgICAgICAgeXQgPSB0b3AgKyBoZWlnaHQgLSBzY3JvbGwueSA+IDAgLSBjb25maWcucmFuZ2UsIC8v6aG16Z2i6aG26YOo5pi+56S65p2h5Lu2XG4gICAgICAgICAgICAgICAgeWIgPSB0b3AgPCBzY3JvbGwueSArIHdpblNpemUuaCArIGNvbmZpZy5yYW5nZSwgLy/pobXpnaLlupXpg6jmmL7npLrmnaHku7ZcbiAgICAgICAgICAgICAgICBpc0luaXQgPSBpdGVtLmxhenlfaXNJbml0O1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhpdGVtLGlzSW5pdCwnbGVmdCcsbGVmdCwndG9wJyx0b3AsJ3dpZHRoJyx3aWR0aCwnaGVpZ2h0JyxoZWlnaHQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoeGwgJiYgeHIgJiYgeXQgJiYgeWIgJiYgIWlzSW5pdCkge1xuICAgICAgICAgICAgICAgIHRlbXAucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0ZW1wO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOm7mOiupOeahOaPkOekuuaWueazlVxuICAgICAqIEBwYXJhbSBvYmogLS1cbiAgICAgKi9cbiAgICB0aXBzKG9iaikge1xuICAgICAgICBsZXQgc2NoZWR1bGUgPSBwYXJzZUludChvYmouc2NoZWR1bGUgKiAxMDApICsgJyUnLFxuICAgICAgICAgICAgbyA9IG9iai5vO1xuXG4gICAgICAgIGlmIChvLmxhenlfaXNFY2hvVGlwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG8ubGF6eV9pc0VjaG9UaXAgPSB0cnVlO1xuICAgICAgICAgICAgby5sYXp5X29UaXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICBvLmxhenlfb1RpcC5jbGFzc05hbWUgPSAnbGF6eV90aXAnO1xuICAgICAgICAgICAgby5wYXJlbnROb2RlLmluc2VydEJlZm9yZShvLmxhenlfb1RpcCwgby5uZXh0U2libGluZyk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKG8ubGF6eV9vdGlwLnBhcmVudE5vZGUpXG4gICAgICAgIH07XG5cbiAgICAgICAgby5sYXp5X29UaXAuaW5uZXJIVE1MID0gc2NoZWR1bGU7XG5cbiAgICAgICAgLy/lvZPliqDovb3ov5vluqbkuLox5pe277yM5YiZ56e76Zmk5a+55bqU55qE5Yqg6L295o+Q56S6XG4gICAgICAgIGlmKG9iai5zY2hlZHVsZSA9PT0gMSAmJiBvLmxhenlfaXNFY2hvVGlwKXtcbiAgICAgICAgICAgIG8ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvLmxhenlfb1RpcCk7XG4gICAgICAgICAgICBvLmxhenlfaXNFY2hvVGlwID0gdW5kZWZpbmVkO1xuICAgICAgICB9O1xuICAgIH1cbn07Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLFlBQWUsVUFBQyxLQUFLLEVBQUMsTUFBTTtJQUN4QixJQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUM7UUFDWCxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssRUFBQyxNQUFNLENBQUMsQ0FBQTtLQUNoQztTQUFJO1FBQ0QsTUFBTSxDQUFDLFdBQVcsR0FB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