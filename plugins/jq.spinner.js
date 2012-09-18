/**
 * jq.web.spinner - a spinner for html5 mobile apps
 * Copyright 2012 - AppMobi 
 */
(function($) {
    $.fn.spinner = function(opts) {
        var tmp;
        for (var i = 0; i < this.length; i++) {
            tmp = new spinner(this[i], opts);
        }
        return this.length == 1 ? tmp : this;
    };
    var spinner = (function() {
        var translateOpen = 'm11' in new WebKitCSSMatrix() ? "3d(" : "(";
        var translateClose = 'm11' in new WebKitCSSMatrix() ? ",0)" : ")";

        var spinner = function (elID, opts) {
            debugger;
            if (typeof elID == "string" || elID instanceof String) {
                this.container = document.getElementById(elID);
            } else {
                this.container = elID;
            }
            if (!this.container) {
                alert("Could not find element for spinner " + elID);
                return;
            }
            
            if (this instanceof spinner) {
                if(typeof(opts)=="object"){
                    for (j in opts) {
                        this[j] = opts[j];
                    }
                }
            } else {
                return new spinner(elID, opts);
            }
            
            try {
                var that = this;
                var markStart = '<div id="jq_spinner"><div style="width:100%">';
                var markEnd = '</div>';
                var markup;
                if (typeof opts == "object") {
                    markup = $(markStart + markEnd);
                    var container = $(markup.children().get());

                    var el;
                    if (opts.cancel || opts.done) {
                        el = $('<div class="buttons"></div>');
                        container.append(el);
                    }

                    if (opts.cancel) {
                        var item = $('<a href="javascript:;" class="cancel">cancel</a>');
                        item[0].onclick = (opts.cancel);
                        el.append(item);
                    }
                    if (opts.done) {
                        var item = $('<a href="javascript:;" class="done">done</a>');
                        item[0].onclick = (opts.done);
                        el.append(item);
                    }

                    var markOutterWheels = $('<div class="outterWheels"></div>');
                    var markWheels = $('<div class="wheels"></div>');
                    markOutterWheels.append(markWheels);

                    for (var i = 0; i < opts.wheels.length; i++) {
                        var markWheelOutter = $('<div class="wheel"></div>');
                        //var markWheel = $('<ul></ul>');
                        var markWheel = document.createElement("ul");

                        markWheel.addEventListener('touchmove', function (e) {
                            that.touchMove(e);
                        }, false);
                        markWheel.addEventListener('touchend', function (e) {
                            that.touchEnd(e);
                        }, false);
                        markWheel.addEventListener('touchstart', function (e) {
                            that.touchStart(e);
                        }, false);

                        markWheelOutter.append(markWheel);
                        markWheels.append(markWheelOutter);
                        var wheel = opts.wheels[i].wheel;
                        for (var x = 0; x < wheel.length; x++) {
                            var item = $('<li class="wheelItem">' + wheel[x] + '</li>');
                            item[0].onclick = (opts.wheels[i].handler || function () { });
                            if (wheel[i].cssClasses && wheel[i].cssClasses.length > 0)
                                item.addClass(opts[i].cssClasses);
                            $(markWheel).append(item);
                        }
                        var that = this;
                    }
                    container.append(markOutterWheels);
                }
                $(elID).find("#jq_spinner").remove();
                $(elID).find("#jq_action_mask").remove();
                spinnerEl = $(elID).append(markup);
                
                markup.get().style[$.cssPrefix+'transition']="all 0ms";
                markup.css($.cssPrefix+"transform", "translate3d(0,"+(window.innerHeight*2) + "px,0)");
                this.container.style.overflow = "hidden";
                markup.on("click", "a",function(){that.hideSheet()});
                this.activeSheet=markup;
                $(elID).append('<div id="jq_action_mask" style="position:absolute;top:0px;left:0px;right:0px;bottom:0px;z-index:9998;background:rgba(0,0,0,.4)"/>');
                setTimeout(function(){
                    markup.get().style[$.cssPrefix+'transition']="all 200ms";
                    //var height=window.innerHeight-parseInt(markup.height());
                    var height = window.innerHeight - parseInt(markup[0].clientHeight);
                    markup.css($.cssPrefix + "transform", "translate3d(0," + (height) + "px,0)");
                 },10);
            } catch (e) {
                alert("error adding spinner" + e);
            }
        };
        spinner.prototype = {
            activeSheet:null,
            touchStart: function (e) {
                this.myDivWidth = numOnly(this.container.clientWidth);
                this.myDivHeight = numOnly(this.container.clientHeight);
                this.lockMove = false;
                if (event.touches[0].target && event.touches[0].target.type !== undefined) {
                    var tagname = event.touches[0].target.tagName.toLowerCase();
                    if (tagname === "select" || tagname === "input" || tagname === "button")  // stuff we need to allow
                    {
                        return;
                    }
                }
                if (e.touches.length === 1) {

                    this.movingElement = true;
                    this.startY = e.touches[0].pageY;
                    this.startX = e.touches[0].pageX;
                    //e.preventDefault();
                    //e.stopPropagation();
                    try {
                        this.cssMoveStart = numOnly(new WebKitCSSMatrix(window.getComputedStyle(this.el, null).webkitTransform).f);
                    } catch (ex1) {
                        this.cssMoveStart = 0;
                    }
                }
            },
            touchMove: function (e) {
                // e.preventDefault();
                // e.stopPropagation();
                if (!this.movingElement)
                    return;
                if (e.touches.length > 1) {
                    return this.touchEnd(e);
                }

                var rawDelta = {
                    x: e.touches[0].pageX - this.startX,
                    y: e.touches[0].pageY - this.startY
                };

                var movePos = { x: 0, y: 0 };
                this.dy = e.touches[0].pageY - this.startY;
                this.dy += this.cssMoveStart;
                movePos.y = this.dy;
                e.preventDefault();
                //e.stopPropagation();

                var totalMoved = ((this.dy % this.myDivHeight) / this.myDivHeight * 100) * -1; // get a percentage of movement.
                if (movePos)
                    this.moveCSS3(e.currentTarget, movePos);
            },
            touchEnd: function (e) {
                if (!this.movingElement) {
                    return;
                }
                // e.preventDefault();
                // e.stopPropagation();
                var runFinal = false;
                try {
                    var endPos = numOnly(new WebKitCSSMatrix(window.getComputedStyle(this.el, null).webkitTransform).f);
                    if (endPos > 0) {
                        this.moveCSS3(this.el, {
                            x: 0,
                            y: 0
                        }, "300");
                    } else {
                        var totalMoved = ((this.dy % this.myDivHeight) / this.myDivHeight * 100) * -1; // get a percentage of movement.
                        // Only need
                        // to drag 3% to trigger an event
                        var currInd = this.carouselIndex;
                        if (endPos < this.cssMoveStart && totalMoved > 3) {
                            currInd++; // move right/down
                        } else if ((endPos > this.cssMoveStart && totalMoved < 97)) {
                            currInd--; // move left/up
                        }
                        if (currInd > (this.childrenCount - 1)) {
                            currInd = this.childrenCount - 1;
                        }
                        if (currInd < 0) {
                            currInd = 0;
                        }
                        var movePos = {
                            x: 0,
                            y: 0
                        };
                        movePos.y = (currInd * this.myDivHeight * -1);

                        this.moveCSS3(this.el, movePos, "150");

                        if (this.pagingDiv && this.carouselIndex !== currInd) {
                            document.getElementById(this.container.id + "_" + this.carouselIndex).className = this.pagingCssName;
                            document.getElementById(this.container.id + "_" + currInd).className = this.pagingCssNameSelected;
                        }
                        if (this.carouselIndex != currInd)
                            runFinal = true;
                        this.carouselIndex = currInd;
                    }
                } catch (e) {
                    console.log(e);
                }
                this.dx = 0;
                this.movingElement = false;
                this.startX = 0;
                this.dy = 0;
                this.startY = 0;
                if (runFinal && this.pagingFunction && typeof this.pagingFunction == "function")
                    this.pagingFunction(this.carouselIndex);
            },
            moveCSS3: function (el, distanceToMove, time, timingFunction) {
                if (!time)
                    time = 0;
                else
                    time = parseInt(time);
                if (!timingFunction)
                    timingFunction = "linear";

                el.style.webkitTransform = "translate" + translateOpen + distanceToMove.x + "px," + distanceToMove.y + "px" + translateClose;
                el.style.webkitTransitionDuration = time + "ms";
                el.style.webkitBackfaceVisiblity = "hidden";
                el.style.webkitTransformStyle = "preserve-3d";
                el.style.webkitTransitionTimingFunction = timingFunction;
            },

            hideSheet: function () {
                var that=this;
                this.activeSheet.off("click","a",function(){that.hideSheet()});
                $(this.el).find("#jq_action_mask").remove();
                this.activeSheet.get().style[$.cssPrefix+'transition']="all 0ms";
                var markup = this.activeSheet;
                var theEl = this.el;
                setTimeout(function(){
                    
                	markup.get().style[$.cssPrefix+'transition']="all 500ms";
                	markup.css($.cssPrefix+"transform", "translate3d(0,"+(window.innerHeight*2) + "px,0)");
                	setTimeout(function(){
		                markup.remove();
		                markup=null;
		                theEl.style.overflow = "none";
	                },500);
                },10);            
            }
        };
        return spinner;
    })();

    function isHorizontalSwipe(xAxis, yAxis) {
        var X = xAxis;
        var Y = yAxis;
        var Z = Math.round(Math.sqrt(Math.pow(X, 2) + Math.pow(Y, 2))); //the distance - rounded - in pixels
        var r = Math.atan2(Y, X); //angle in radians 
        var swipeAngle = Math.round(r * 180 / Math.PI); //angle in degrees
        if (swipeAngle < 0) { swipeAngle = 360 - Math.abs(swipeAngle); } // for negative degree values
        if (((swipeAngle <= 215) && (swipeAngle >= 155)) || ((swipeAngle <= 45) && (swipeAngle >= 0)) || ((swipeAngle <= 360) && (swipeAngle >= 315))) // horizontal angles with threshold
        { return true; }
        else { return false }
    }
})(jq);
