/* globals angular */

(function() {
    'use strict';

    angular
        .module('app', [])
        .controller('GetDateCtrl', ['$scope', '$timeout', GetDateCtrl])
        .controller('DesignCtrl', ['$scope', '$timeout', DesignCtrl])
    ;

    function GetDateCtrl($scope, $timeout) {
        var myTimeout = function() {
            $scope.datetime = format(new Date());
            $timeout(myTimeout, 500);
        };
        myTimeout();
    }

    function DesignCtrl($scope, $timeout) {
        // 删除昨日或之前的计划
        var date = new Date();
        var lastDate = JSON.parse(localStorage.getItem('lastDate'));

        if ( !lastDate ) {
            lastDate = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            };
            localStorage.setItem('lastDate', JSON.stringify(lastDate));
        } else {
            if ( lastDate.year < date.getFullYear() 
                    || lastDate.year === date.getFullYear() && lastDate.month < date.getMonth()+1 
                    || lastDate.year === date.getFullYear() && lastDate.month === date.getMonth()+1 && lastDate.day < date.getDate() ) {
                localStorage.removeItem('plans');
                localStorage.removeItem('times');

                lastDate = {
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    day: date.getDate()
                };
                localStorage.setItem('lastDate', JSON.stringify(lastDate));
            }
        }


        //从浏览器客户端取出数据
        $scope.designedTimeList = JSON.parse(localStorage.getItem('plans')) || [];

        var existTimeList = JSON.parse(localStorage.getItem('times')) || [];


        var cId;
        var mId;


        //计算出还能够用来使用的 hour
        var myTimeout = function() {
            var dateTime = new Date();
            var hour = dateTime.getMinutes() > 1 ? dateTime.getHours() + 1 : dateTime.getHours;
            var list = [];
            var temp;
            var ap;

            for ( var i=1; i<=24; i++ ) {
                hour %= 24;
                temp = hour < 10 ? '0' + hour : hour;
                ap = hour > 11 ? 'pm' : 'am';
                list.push(temp + ' ' + ap);

                if ( hour === 23 ) {
                    break;
                }

                hour ++;
            }

            $scope.fromList = list.filter(function(ele) {
                if ( existTimeList.indexOf(ele) === -1 ) {
                    return true;
                }
            });

            mId = $timeout(myTimeout, 1000 * 60);
        };
        myTimeout();


        //计算出60种minutes
        (function() {
            var temp;

            $scope.durationList = [];
            for ( var i=1 ; i<=60; i++ ) {
                temp = i < 10 ? '0' + i : i;

                $scope.durationList.push(temp + 'min');
            }
        })();


        //检测任务的完成状态
        var checkTime = function() {
            var date = new Date();
            var hour = date.getHours();
            var minute = date.getMinutes();
            var temp;
            var existHour;
            var existMinute;

            if ( $scope.designedTimeList.length ) {
                $scope.designedTimeList.forEach(function(ele, i) {
                    temp = ele.from.slice(0, 2);
                    existHour = +temp;

                    temp = ele.duration.slice(0, 2);
                    existMinute = +temp;

                    if ( existHour === hour && existMinute >= minute ) {
                        $scope.designedTimeList[i].status = '1';
                    } else if ( existHour < hour || existHour === hour && existMinute < minute ) {
                        $scope.designedTimeList[i].status = '-1';
                    }
                });
            }

            cId = $timeout(checkTime, 1000 * 60);
        };
        checkTime();


        //存储新的计划任务
        $scope.save = function() {
            $scope.designedTimeList.push({
                from: $scope.fromTime,
                duration: $scope.durationTime,
                theme: $scope.theme,
                plan: $scope.plan,
                status: '0'
            });
            localStorage.setItem('plans', JSON.stringify($scope.designedTimeList));

            existTimeList.push($scope.fromTime);
            localStorage.setItem('times', JSON.stringify(existTimeList));

            $timeout.cancel(mId);
            myTimeout();

            $timeout.cancel(cId);
            checkTime();

            $scope.fromTime = '';
            $scope.durationTime = '';
            $scope.theme = '';
            $scope.plan = '';
        };


        //取消没完成的计划任务
        $scope.cancel = function(time) {
            remove(existTimeList, time);
            localStorage.setItem('times', JSON.stringify(existTimeList));

            $timeout.cancel(mId);
            myTimeout();

            removeDesigned($scope.designedTimeList, time);
            localStorage.setItem('plans', JSON.stringify($scope.designedTimeList));
        };


        //删除已经完成的计划任务
        $scope.del = function($event, time) {
            $event.preventDefault();

            remove(existTimeList, time);
            localStorage.setItem('times', JSON.stringify(existTimeList));

            $timeout.cancel(mId);
            myTimeout();

            removeDesigned($scope.designedTimeList, time);
            localStorage.setItem('plans', JSON.stringify($scope.designedTimeList));
        };
    }


    //辅助函数
    function remove(existTimeList, time) {
        var itemIndex = existTimeList.indexOf(time);
        existTimeList.splice(itemIndex, 1);
    }

    function removeDesigned(designedTimeList, time) {
        var itemIndex;
        designedTimeList.forEach(function(ele, i) {
            if ( ele.from === time ) {
                itemIndex = i;
            }
        });

        designedTimeList.splice(itemIndex, 1);
    }

    function format(date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        var second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();

        return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }
})();


(function() {
    var EventUtil = {
        addHandler: function(element, type, handler) {
            if ( element.addEventListener ) {
                element.addEventListener(type, handler, false);
            } else if ( element.attachEvent ) {
                element.attachEvent('on' + type, handler);
            } else {
                element['on' + type] = handler;
            }
        },

        getEvent: function(event) {
            return event ? event : window.event;
        },

        getTarget: function(event) {
            return event.target || event.srcElement;
        },

        preventDefault: function(event) {
            if ( event.preventDefault ) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
    };

    var content = document.querySelector('.content');
    var lastActiveElement;

    /* 未采用事件委托机制代码
    function handleClick(index, event) {
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var target = EventUtil.getTarget(event);

        if ( lastActiveElement ) {
            lastActiveElement.parentNode.className = '';
        }

        lastActiveElement = target;
        target.parentNode.className = 'active';

        switch(index) {
            case 1:
                content.className = 'one content';
                break;
            case 2:
                content.className = 'two content';
                break;
            case 3:
                content.className = 'three content';
                break;
            default:
                content.className = 'four content';
                break;
        }
    }

    var anchors = document.querySelectorAll('nav ul a');
    lastActiveElement = anchors[0];
    lastActiveElement.parentNode.className = 'active';

    for ( var i=0, len=anchors.length; i<len; i++ ) {
        EventUtil.addHandler(anchors[i], 'click', handleClick.bind(null, i+1));
    }
    //*/

    lastActiveElement = document.querySelector('#one');
    lastActiveElement.parentNode.className = 'active';

    EventUtil.addHandler(document, 'click', function(event) {
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var target = EventUtil.getTarget(event);

        switch(target.id) {
            case 'one':
                content.className = 'one content';

                target.parentNode.className = 'active';

                lastActiveElement.parentNode.className = '';
                lastActiveElement = target;

                break;

            case 'two':
                content.className = 'two content';

                target.parentNode.className = 'active';

                lastActiveElement.parentNode.className = '';
                lastActiveElement = target;

                break;

            case 'three':
                content.className = 'three content';

                target.parentNode.className = 'active';

                lastActiveElement.parentNode.className = '';
                lastActiveElement = target;

                break;

            case 'four':
                content.className = 'four content';

                target.parentNode.className = 'active';

                lastActiveElement.parentNode.className = '';
                lastActiveElement = target;

                break;
        }
    });
})();
