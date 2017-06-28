﻿/*global jQuery, Raphael */
; (function ($) {
    var flow = {
        config: {
            editable: true,
            guid: "88888888",
            lineHeight: 15,
            basePath: "",
            width: 2400,
            height: 2400,
            rect: {
                attr: {
                    x: 10,
                    y: 10,
                    width: 80,
                    height: 45,
                    r: 5,
                    fill: "90-#fff-#C0C0C0",
                    stroke: "#000",
                    "stroke-width": 1,
                    "stroke-width-active": 2,
                    cursor: "move"
                },
                showType: "image&text",
                type: "state",
                name: { text: "state", "font-style": "italic" },
                text: {
                    text: "状态",
                    "font-size": "10px",
                    "text-anchor": "middle",
                    fill: "#000000",
                    cursor: "move",
                    "font-family": "微软雅黑"
                },
                props: [],
                img: {
                    attr: {
                        cursor: "move"
                    },
                    src: "",
                    width: 16,
                    height: 16
                }
            },
            path: {
                attr: {
                    path: "M10 10L100 100",
                    stroke: "#808080",
                    fill: "none",
                    "stroke-width": 2,
                    "stroke-width-active": 5,
                    "arrow-end": 'classic-wide-long',
                    cursor: "move"
                },
                rect: {
                    attr: {
                        width: 6,
                        height: 6,
                        cursor: "pointer",
                        fill: "#03689A",
                        stroke: "#03689A",
                        "stroke-width": 1
                    }
                }
            },
            validate: {
                text: "正确",
                dx: 5,
                attr: {
                    "font-size": 12,
                    "text-anchor": "middle",
                    fill: "#FA4646",
                    cursor: "defalut",
                    "font-family": "微软雅黑",
                    "font-size": "11px"
                }
            },
            condition: {
                text: "",
                dx: 5,
                attr: {
                    "font-size": 12,
                    "text-anchor": "middle",
                    fill: "#11A0FF",
                    cursor: "defalut",
                    "font-family": "微软雅黑",
                    "font-size": "11px"
                }
            },
            tools: {
                type: "multi",
                attr: { left: 0, top: 0, width: 130 },
                pointer: {},
                path: {},
                states: {},
                save: {
                    type: 'save',
                    name: { text: '<<save>>' },
                    text: { text: '保存' },
                    img: { src: 'img/tools/save.gif', width: 16, height: 16 },
                    onclick: function (c) { console.log(c); }
                }
            },
            props: {
                attr: { top: 10, right: 30 },
                props: {}
            },
            restore: [],
            event: {
                toggle: function (pid, prevProps, currProps, props) {
                    console.log("event.toggle");
                    console.log({ pid: pid, prevProps: prevProps, currProps: currProps, props: props });
                },
                validate: function (pid, props) {
                    console.log("event.validate");
                    console.log({ pid: pid, props: props, node: this });
                },
                lineMoveEnd: function (pid, currProps, props, direction) {
                    console.log("event.lineMoveEnd");
                    console.log({ pid: pid, currProps: currProps, props: props, direction: direction });
                },
                selectTemplate: function (pid, props) {
                    console.log("event.selectTemplate");
                    console.log(pid);
                }
            }
        },
        tools: function (container, flowProps, paper) {
            var opt = flow.config.tools.states,
                basePath = flow.config.basePath,
                saveTool = flow.config.tools.save,
                deleteTool = flow.config.tools.deleted,
                nodeType = null,
                template = {},
                html = "",
                i = 0,
                len = 0,
                items = [],
                item = {},
                tool = null;

            template = {
                node: '<div class="flow-tools-node [state] " style="border:none;" type=\"[type]\"><img src="[src]"></img><span>[name]</span></div>',
                separation: '<div><hr/></div>',
                container:
                [
                    '<div class="ui-widget-content flow-tools">',
                        '<div class="ui-widget-header flow-tools-header">工具集</div>',
                        '[tools]',
                    '</div>'
                ]
            };

            html = template.container.slice();
            for (i in opt) {
                if (opt.hasOwnProperty(i)) {
                    item = opt[i];
                    nodeType = (!item.nodeType || item.nodeType === "none") ? "" : item.nodeType;
                    items.push(template.node.slice().replace("[src]", basePath + item.img.src).replace("[name]", item.text.text).replace("[type]", item.type).replace("[state]", nodeType));
                }
            }
            tool = $(html.join("").replace("[tools]", items.join("")).replace(/\[basePath\]/g, basePath)).appendTo(container);

            return tool;

        },
        util: {
            nextId: (function () {
                var count = 0;
                return function () {
                    return ++count;
                };
            }()),
            stopToggle:
        (function () {
            var sign = false;
            return function (flag) {
                if (arguments.length === 1) {
                    sign = flag === true ? true : false;
                }
                else {
                    return sign;
                }
            };
        }())
        },
        rect: function (opt, pager, flowProps) {
            opt = $.extend(true, {}, flow.config.rect, opt);
            var self = this,
                rectId = opt.id,
                rect = null,
                image = null,
                text = null,
                validate = null,
                //condition = null,
                moveOpt = {},
                basePath = flow.config.basePath,
                nodeList = flowProps.props.NodeList;

            moveOpt = {
                rect: { x: 0, y: 0 },
                image: { x: 0, y: 0 },
                text: { x: 0, y: 0 },
                relateLine: []
            };

            //是否在创建绘制连线
            function isModdrawline() {
                return $(pager).data("mod-draw-line");
            }

            //转换显示文字
            function formatText(text) {
                var t = [];
                if (typeof text === "string") {
                    t.push(text.slice(0, 4));
                    t.push(text.slice(4, 8));
                    text = t.join("\n");
                }
                return text;
            }

            //创建
            function create(opt, basePath) {
                var x = 0,
                    y = 0,
                    width = 0,
                    height = 0,
                    src = "";

                x = opt.attr.x;
                y = opt.attr.y;
                width = opt.attr.width;
                height = opt.attr.height;
                rect = pager.rect(x, y, width, height).attr(opt.attr);

                src = basePath + opt.img.src;
                x = opt.attr.x + 8;
                y = opt.attr.y + (opt.attr.height / 2) - (opt.img.height / 2);
                width = opt.img.width;
                height = opt.img.height;
                image = pager.image(src, x, y, width, height).attr(opt.img.attr);

                x = opt.attr.x + opt.attr.width / 2 + 12;
                y = opt.attr.y + opt.attr.height / 2;
                text = pager.text(x, y).attr($.extend(opt.text, { text: formatText(opt.text.text) }));

                x = opt.attr.x + opt.attr.width + flow.config.validate.dx;
                y = opt.attr.y;
                validate = pager.text(x, y, flow.config.validate.text).attr(flow.config.validate.attr).hide();
            }

            //更改属性
            function changeProps() {
                var i, len, x, y, position, node;
                position = self.getCenter();
                x = position.x;
                y = position.y;
                for (i = 0, len = nodeList.length; i < len; i++) {
                    node = nodeList[i];
                    if (node.NodeID === rectId) {
                        node.CenterX = Math.round(x);
                        node.CenterY = Math.round(y);
                        break;
                    }
                }
            }

            //通过dx、dy 移动至新的位置
            function movetoposition(dx, dy) {

                var ix = moveOpt.image.x + dx,
                    iy = moveOpt.image.y + dy,
                    tx = moveOpt.text.x + dx,
                    ty = moveOpt.text.y + dy,
                    rx = moveOpt.rect.x + dx,
                    ry = moveOpt.rect.y + dy,
                    i = 0,
                    len = 0,
                    path = null,
                    relateLine = moveOpt.relateLine;

                rect.attr({ x: rx, y: ry });
                image.attr({ x: ix, y: iy });
                text.attr({ x: tx, y: ty });
                validate.attr({ x: tx + opt.attr.width / 2 + flow.config.validate.dx, y: ty - opt.attr.height / 2 });


                //流程线
                for (i = 0, len = relateLine.length; i < len; i++) {
                    path = relateLine[i].node;
                    path.reDraw();
                }
            }

            //通过x,y 移动至新的位置
            function setposition(x, y) {
                rect.attr({ x: x, y: y });
                image.attr({ x: x + 8, y: y + (opt.attr.height / 2) - (opt.img.height / 2) });
                text.attr({ x: x + opt.attr.width / 2, y: y + opt.attr.height / 2 });
            }

            //移动开始
            function movestart() {
                if (isModdrawline() === true) {
                    return;
                }
                //console.log("state rect movestart");
                var i = 0,
                    line = null,
                    paths = flowProps.path,
                    path = {};

                moveOpt.relateLine = [];
                moveOpt.rect.x = rect.attr("x");
                moveOpt.rect.y = rect.attr("y");
                moveOpt.image.x = image.attr("x");
                moveOpt.image.y = image.attr("y");
                moveOpt.text.x = text.attr("x");
                moveOpt.text.y = text.attr("y");

                //关联的流程线
                for (i in paths) {
                    if (paths.hasOwnProperty(i)) {
                        path = paths[i];
                        if (path && (path.toDot === rectId || path.fromDot === rectId)) {
                            moveOpt.relateLine.push(path);
                        }
                    }
                }

                rect.attr({ "stroke-width": flow.config.rect.attr["stroke-width-active"], "stroke": flow.config.rect.attr["stroke-active"] });
                rect.attr({ "opacity": 0.7 });
                image.attr({ "opacity": 0.7 });
                text.attr({ "opacity": 0.7 });
            }

            //移动中
            function move(dx, dy) {
                if (isModdrawline() === true) {
                    return;
                }
                //console.log("state rect move");
                if (flow.config.editable) {
                    movetoposition(dx, dy);
                }
            }

            //移动结束
            function moveend(dx, dy) {
                if (isModdrawline() === true) {
                    return;
                }
                //console.log("state rect moveend");
                var x, y, width, height, pagerWidth, pagerHeight, relateLine = moveOpt.relateLine, i = 0, len = 0;
                x = rect.attr("x");
                y = rect.attr("y");
                width = opt.attr.width;
                height = opt.attr.height;
                pagerWidth = pager.width;
                pagerHeight = pager.height;

                if (x < 0 || y < 0 || (x + width > pagerWidth) || (y + height > pagerHeight)) {
                    x = x < 0 ? 1 : (x + width > pagerWidth ? pagerWidth - width - 1 : x);
                    y = y < 0 ? 1 : (y + height > pagerHeight ? pagerHeight - height - 1 : y);
                    setposition(x, y);
                }

                rect.attr({ "opacity": 1 });
                image.attr({ "opacity": 1 });
                text.attr({ "opacity": 1 });
                //流程线
                for (i = 0, len = relateLine.length; i < len; i++) {
                    relateLine[i].node.reDraw();
                }
                changeProps();
            }

            //节点切换
            function nodeToggle(e) {
                if (isModdrawline() === true) {
                    return;
                }

                //console.log("state rect click");
                var prevNode, currNode;
                rect.attr({ "stroke-width": flow.config.rect.attr["stroke-width-active"], "stroke": flow.config.rect.attr["stroke-active"] });
                prevNode = $(pager).data("currNode");
                currNode = self;
                changeProps();
                $(pager).trigger("canvasNodeToggle", [prevNode, currNode]);
                if (flow.util.stopToggle()) {
                    rect.attr({ "stroke-width": flow.config.rect.attr["stroke-width"], "stroke": flow.config.rect.attr["stroke"] });
                }
                else {
                    $(pager).data("currNode", currNode);
                }

                flow.util.stopToggle(false);
                return false;

            }

            //绑定移动事件
            function binddrag() {
                rect.drag(function (dx, dy) { move(dx, dy); }, function () { movestart(); }, function () { moveend(); });
                image.drag(function (dx, dy) { move(dx, dy); }, function () { movestart(); }, function () { moveend(); });
                text.drag(function (dx, dy) { move(dx, dy); }, function () { movestart(); }, function () { moveend(); });
            }

            //绑定点击事件
            function bindclick() {
                if (!flow.config.editable) {
                    return;
                }
                $([rect.node, text.node, image.node]).on("click", nodeToggle);
            }

            //解除绑定移动事件
            function unbinddrag() {
                rect.undrag();
                image.undrag();
                text.undrag();
            }

            //解除绑定点击事件
            function unbindclick() {
                $([rect.node, text.node, image.node]).off();
            }

            //获取矩形边线
            function getRectLine(element) {

                var p1 = element.attr("x"),
                     p2 = element.attr("y"),
                     p3 = element.attr("x") + element.attr("width"),
                     p4 = element.attr("y"),
                     p5 = element.attr("x") + element.attr("width"),
                     p6 = element.attr("y") + element.attr("height"),
                     p7 = element.attr("x"),
                     p8 = element.attr("y") + element.attr("height");
                return "M " + p1 + " " + p2 + " L " + p3 + " " + p4 + " L " + p5 + " " + p6 + " L " + p7 + "  " + p8 + " L " + p1 + "  " + p2 + " ";
            }

            //初始化
            create(opt, basePath);
            binddrag();
            bindclick();

            //获取id
            this.getId = function () {
                return rectId;
            };

            //设置、获取显示文字
            this.text = function (t) {
                if (typeof t === "string") {
                    text.attr("text", formatText(t));
                }
                else {
                    return text.attr("text");
                }
            };

            //设置、获取图片地址
            this.img = function (src) {
                if (typeof src === "string") {
                    image.attr("src", src);
                }
                else {
                    return image.attr("src");
                }
            };

            //设置、获取指定属性
            this.attr = function (attr) {
                if (typeof attr === "object") {
                    rect.attr(attr);
                }
                else if (typeof attr === "string") {
                    return rect.attr(attr);
                }
            };

            //删除
            this.remove = function () {
                var i, len, line, pathList, rectList;
                //销毁关联元素
                if (this.relateRect) {
                    this.relateRect.relateRect = null;
                    this.relateRect.remove();
                }
                this.relateRect = null;

                unbindclick();
                unbinddrag();

                text.remove();
                image.remove();
                rect.remove();
                validate.remove();

                self = null;
                rect = null;
                image = null;
                moveOpt = null;

                flowProps.rect[rectId] = null;
                delete flowProps.rect[rectId];

                pathList = flowProps.path;
                for (i in pathList) {
                    if (pathList.hasOwnProperty(i)) {
                        line = pathList[i];
                        line.node.removeDot(rectId);
                    }
                }
                rectList = flowProps.props.NodeList;
                for (i = 0, len = rectList.length; i < len; i++) {
                    if (rectId === rectList[i].NodeID) {
                        rectList.splice(i, 1);
                        break;
                    }
                }
                $(pager).data("currNode", null);
            };

            //获取焦点
            this.getPathIntersection = function (x, y, linePath) {
                var isInside = rect.isPointInside(x, y),
                    dot = null;
                if (isInside === true) {
                    dot = Raphael.pathIntersection(linePath, getRectLine(rect));
                    return { x: dot[0].x, y: dot[0].y };
                }
                return null;
            };

            //判断指定点是否在节点内
            this.isPointInside = function (x, y) {
                var result, bbox;
                bbox = rect.getBBox();

                if ((x >= bbox.x && x <= bbox.x2) && (y >= bbox.y && y <= bbox.y2)) {
                    result = true;
                }
                else {
                    result = false;
                }

                //result = rect.isPointInside(x, y);
                //console.log(["result:", result, "  point:[", x, ",", y, "]", " rect:[", rect.attr("x"), ",", rect.attr("y"), "]"].join(""));
                return result;
            };

            //获取节点中心坐标
            this.getCenter = function () {
                var x = rect.attr("x"),
                    y = rect.attr("y");

                x = x + flow.config.rect.attr.width / 2 - flow.config.path.rect.attr.width / 2;
                y = y + flow.config.rect.attr.height / 2 - flow.config.path.rect.attr.height / 2;

                return { x: x, y: y };
            };

            //选中节点
            this.setSelected = function () {
                nodeToggle();
            };

            //显示验证信息
            this.showValidate = function (text) {
                validate.attr("text", text).show();
            };

            //隐藏验证信息
            this.hideValidate = function () {
                validate.hide();
            };

            //类型
            this.type = "rect";

            changeProps();
        },
        path: function (opt, pager, flowProps) {
            opt = $.extend(true, {}, flow.config.path, opt);
            var self = this,
                pathId = opt.id,
                path = null,
                bigPath = null,
                startRect = null,
                endRect = null,
                resizePath = null,
                rectSize = flow.config.path.rect.attr.width,
                strokeWidth = opt.attr["stroke-width"],
                pathMoveOpt = [],
                rectMoveOpt = {},
                resizeMoveOpt = {},
                draghandler = {},
                drawlinkPath = {},
                rects = flowProps.rect,
                paths = flowProps.paths,
                validate = null,
                condition = null,
                drawLineType = "straightLine", //straightLine brokenHLine brokenVLine
                displayType = opt.displayType || 0,
                defaultFirstLineWidth = 52,
                firstLineWidth = opt.firstLength || defaultFirstLineWidth,
                linkList = flowProps.props.LinkList,
                direction = null,
                inTop = false,
                directionType = "v";

            //是否在创建绘制连线
            function isModdrawline() {
                return $(pager).data("mod-draw-line");
            }

            //创建连线
            function create(opt) {
                var offset, x1, y1, x2, y2, line, strokeWidth;

                offset = flow.config.path.offset;
                x1 = opt.x.x1;
                y1 = opt.y.y1;
                x2 = opt.x.x2;
                y2 = opt.y.y2;

                line = "M " + x1 + " " + y1 + " L " + x2 + " " + y2;
                strokeWidth = opt.attr["stroke-width"];

                opt.attr.path = line;
                //console.log("line create:" + line);
                path = pager.path().attr($.extend({}, opt.attr, { "arrow-end": 'none' }));
                bigPath = pager.path().attr($.extend({}, opt.attr, {
                    "stroke-width": strokeWidth * 2,
                    opacity: 0.01,
                    "arrow-end": 'none',
                    "stroke": "#FFFFFF"
                }));
                resizePath = pager.path().attr({
                    "stroke-width": strokeWidth * 2,
                    opacity: 0.01,
                    cursor: "w-resize",
                    path: line,
                    "arrow-end": 'none',
                    "stroke": "#FFFFFF"
                }).hide();

                startRect = pager.rect(x1 - rectSize / 2, y1 - rectSize / 2, flow.config.path.rect.width, flow.config.path.rect.width).attr($.extend({}, flow.config.path.rect.attr, { opacity: 0 }));

                endRect = pager.rect(x2 - rectSize / 2, y2 - rectSize / 2, flow.config.path.rect.width, flow.config.path.rect.width).attr($.extend({}, flow.config.path.rect.attr, { opacity: 0 }));

                startRect.attr("cursor", "pointer");

                $(startRect[0]).attr("data-type", "path-start-rect");

                endRect.attr("cursor", "pointer");
                $(endRect[0]).attr("data-type", "path-end-rect");

                validate = pager.text(x1 + flow.config.validate.dx, y1, flow.config.validate.text).attr(flow.config.validate.attr).hide();

                condition = pager.text((x1 + x2) / 2, (y1 + y2) / 2, opt.props.ConditionText || "").attr(flow.config.condition.attr);


                path.toDot = opt.toDot || null;
                path.fromDot = opt.fromDot || null;
                displayType = opt.displayType || displayType;
                drawlinkPath.draw();
            }

            //末端箭头显示控制
            function arrowDispaly(x1, y1, x2, y2) {
                var size = 10, arrow;
                if (Math.abs(x2 - x1) < size && Math.abs(y2 - y1) < size) {
                    //console.log("into arrowDispaly for arrow-end:none");
                    path.attr({ "arrow-end": 'none' });
                }
                else {
                    //console.log("into arrowDispaly for arrow-end:block");
                    arrow = flow.config.path.attr["arrow-end"];
                    path.attr({ "arrow-end": arrow });
                }
            }

            //连线在最上方显示
            function showInTop() {
                //由于ie11对svg path支持的缺陷，移动时需要一直执行;
                path.toFront();
                bigPath.toFront();
                resizePath.toFront();
                startRect.toFront();
                endRect.toFront();
                condition.toFront();
            }

            //记录改变的属性
            function changeProps() {
                var i, len, x1, y1, x2, y2, node, pathArray;

                pathArray = draghandler.parsePath(path.attr("path"));
                len = pathArray.length;
                x1 = pathArray[0][1];
                y1 = pathArray[0][2];
                x2 = pathArray[len - 1][1];
                y2 = pathArray[len - 1][2];

                for (i = 0, len = linkList.length; i < len; i++) {
                    node = linkList[i];
                    if (node.LinkID === pathId) {
                        node.StartX = Math.round(x1);
                        node.StartY = Math.round(y1);
                        node.EndX = Math.round(x2);
                        node.EndY = Math.round(y2);
                        node.DisplayType = displayType;
                        node.FirstLength = Math.round(firstLineWidth);
                        break;
                    }
                }
            }

            //设置验证信息位置
            function setValidate() {
                var x, y, center, x1, y1, x2, y2,
                    offset = parseInt(flow.config.validate.attr["font-size"]);

                if (path.fromDot) {
                    center = flowProps.rect[path.fromDot].node.getCenter();
                    x1 = center.x;
                    y1 = center.y;
                }
                else {
                    x1 = startRect.attr("x");
                    y1 = startRect.attr("y");
                }

                if (path.toDot) {
                    center = flowProps.rect[path.toDot].node.getCenter();
                    x2 = center.x;
                    y2 = center.y;
                }
                else {

                    x2 = endRect.attr("x");
                    y2 = endRect.attr("y");
                }

                switch (drawLineType) {
                    case "straightLine":
                        x = x1 - (x1 - x2) / 2;
                        y = y1 - (y1 - y2) / 2 + offset;

                        break;
                    case "brokenVLine":

                        x = x1 - (x1 - x2) / 2;
                        y = y1 + firstLineWidth + offset;

                        break;
                    case "brokenHLine":
                        y = y1 - (y1 - y2) / 2 + offset;
                        x = x1 + firstLineWidth;
                        break;

                }

                validate.attr({ x: x, y: y });
            }

            //设置条件信息位置
            function setCondition() {

                var x, y, center, x1, y1, x2, y2;

                if (path.fromDot) {
                    center = flowProps.rect[path.fromDot].node.getCenter();
                    x1 = center.x;
                    y1 = center.y;
                }
                else {
                    x1 = startRect.attr("x");
                    y1 = startRect.attr("y");
                }

                if (path.toDot) {
                    center = flowProps.rect[path.toDot].node.getCenter();
                    x2 = center.x;
                    y2 = center.y;
                }
                else {

                    x2 = endRect.attr("x");
                    y2 = endRect.attr("y");
                }

                switch (drawLineType) {

                    case "straightLine":
                        x = x1 - (x1 - x2) / 2;
                        y = y1 - (y1 - y2) / 2;
                        break;
                    case "brokenVLine":
                        x = x1 - (x1 - x2) / 2;
                        y = y1 + firstLineWidth - parseInt(flow.config.condition.attr["font-size"]);

                        break;
                    case "brokenHLine":
                        y = y1 - (y1 - y2) / 2;
                        x = x1 + firstLineWidth;
                        break;

                }
                //console.dir({ x: x, y: y });
                condition.attr({ x: x, y: y });
            }

            //节点切换事件
            function nodeToggle() {
                var prevNode, currNode;
                path.attr({ "stroke-width": flow.config.path.attr["stroke-width-active"] });
                prevNode = $(pager).data("currNode");
                currNode = self;
                currNode.reDraw();

                changeProps();
                $(pager).trigger("canvasNodeToggle", [prevNode, currNode]);
                if (flow.util.stopToggle()) {
                    //阻止切换恢复path未选中状态
                    setTimeout(function () {
                        path.attr({ "stroke-width": flow.config.path.attr["stroke-width"] });
                    }, 0);
                }
                else {
                    $(pager).data("currNode", currNode);
                }
                //console.log("path or pathDot toggle");
                flow.util.stopToggle(false);
                return false;
            }

            //拖拽事件函数
            draghandler = {
                //线的拖拽事件
                path: {
                    movestart: function () {
                        if (isModdrawline() === true) {
                            return;
                        }
                        //console.log("path movestart");
                        nodeToggle();
                        pathMoveOpt = draghandler.parsePath(path.attr("path"));
                        //console.log("movestart path:" + pathMoveOpt);
                        path.attr({ "opacity": 0.7, "stroke-width": flow.config.path.attr["stroke-width-active"] });
                        startRect.attr({ opacity: 1 });
                        endRect.attr({ opacity: 1 });
                        inTop = true;
                    },
                    move: function (dx, dy) {
                        if (isModdrawline() === true) {
                            return;
                        }
                        //console.log("path move dx:" + dx + " dy" + dy);
                        if (dx === 0 && dy === 0) {
                            return;
                        }
                        showInTop();
                        var line = "",
                            i = 0,
                            len = 0,
                            item = null,
                            x = 0,
                            y = 0;

                        for (i = 0, len = pathMoveOpt.length; i < len; i++) {
                            item = pathMoveOpt[i];
                            line += " " + item[0] + " " + (item[1] + dx) + " " + (item[2] + dy);
                        }

                        //console.log("path move path:" + line);
                        path.attr({ path: line });
                        bigPath.attr({ path: line });
                        resizePath.hide();

                        x = pathMoveOpt[0][1] + dx - rectSize / 2;
                        y = pathMoveOpt[0][2] + dy - rectSize / 2;
                        startRect.attr({ x: x, y: y });
                        draghandler.pointDrag.relateRect(startRect, "fromDot", x, y);

                        x = pathMoveOpt[len - 1][1] + dx - rectSize / 2;
                        y = pathMoveOpt[len - 1][2] + dy - rectSize / 2;
                        endRect.attr({ x: x, y: y });


                        draghandler.pointDrag.relateRect(endRect, "toDot", x, y);
                        //提示信息
                        setCondition();
                        setValidate();

                    },
                    moveend: function () {
                        var currNode;
                        if (isModdrawline() === true) {
                            return;
                        }
                        //console.log("path moveend");

                        function moveEndPostion(linePathArray) {
                            var line = "",
                                pagerWidth = pager.width,
                                pagerHeight = pager.height,
                                x = [],
                                y = [],
                                minX = null,
                                minY = null,
                                maxX = null,
                                maxY = null,
                                i = 0,
                                len = 0,
                                item = null,
                                offset = 6,
                                x1 = 0,
                                y1 = 0,
                                x2 = 0,
                                y2 = 0,
                                x0 = 0,
                                y0 = 0;

                            //拖动边界处理
                            for (i = 0, len = linePathArray.length; i < len; i++) {
                                item = linePathArray[i];
                                x.push(item[1]);
                                y.push(item[2]);
                            }

                            maxX = Math.max.apply(null, x);
                            maxY = Math.max.apply(null, y);
                            minX = Math.min.apply(null, x);
                            minY = Math.min.apply(null, y);

                            if (minX < 0 || minY < 0 || maxX > pagerWidth || maxY > pagerHeight) {
                                if (minX < 0) {
                                    for (i = 0, len = linePathArray.length; i < len; i++) {
                                        item = linePathArray[i];
                                        item[1] = item[1] - minX + offset;
                                    }
                                    moveEndPostion(linePathArray);
                                }
                                else if (minY < 0) {
                                    for (i = 0, len = linePathArray.length; i < len; i++) {
                                        item = linePathArray[i];
                                        item[2] = item[2] - minY + offset;
                                    }
                                    moveEndPostion(linePathArray);
                                }
                                else if (maxX > pagerWidth) {
                                    for (i = 0, len = linePathArray.length; i < len; i++) {
                                        item = linePathArray[i];
                                        item[1] = item[1] - (maxX - pagerWidth) - offset;
                                    }
                                    moveEndPostion(linePathArray);
                                }
                                else if (maxY > pagerHeight) {
                                    for (i = 0, len = linePathArray.length; i < len; i++) {
                                        item = linePathArray[i];
                                        item[2] = item[2] - (maxY - pagerHeight) - offset;
                                    }
                                    moveEndPostion(linePathArray);
                                }
                            }
                            else {
                                for (i = 0, len = linePathArray.length; i < len; i++) {
                                    item = linePathArray[i];
                                    line += " " + item[0] + " " + item[1] + " " + item[2];
                                }
                                path.attr({ path: line });
                                bigPath.attr({ path: line });
                                //resizePath.attr({ path: line });
                                x1 = linePathArray[0][1];
                                y1 = linePathArray[0][2];
                                x2 = linePathArray[len - 1][1];
                                y2 = linePathArray[len - 1][2];
                                startRect.attr({ x: x1 - rectSize / 2, y: y1 - rectSize / 2 });
                                endRect.attr({ x: x2 - rectSize / 2, y: y2 - rectSize / 2 });

                                len = pathMoveOpt.length;
                                x0 = pathMoveOpt[0][1];
                                y0 = pathMoveOpt[0][2];
                                //console.log("path moveend x:" + x0 + " y:" + y0 + " x2:" + x1 + " y2:" + y1);
                                if (x0 !== x1 || y0 !== y1) {
                                    //console.log("path moveend fromDot relate");
                                    draghandler.pointDrag.relateRect(startRect, "fromDot", x1, y1);
                                }
                                x0 = pathMoveOpt[len - 1][1];
                                y0 = pathMoveOpt[len - 1][2];
                                //console.log("path moveend x:" + x0 + " y:" + y0 + " x2:" + x2 + " y2:" + y2);
                                if (x0 !== x2 || y0 !== y2) {
                                    //console.log("path moveend toDot relate");
                                    draghandler.pointDrag.relateRect(startRect, "toDot", x2, y2);
                                }
                                drawlinkPath.draw();
                            }

                        }

                        moveEndPostion(draghandler.parsePath(path.attr("path")));

                        path.attr({ "opacity": 1 });

                        //当前选中连线端点全部显示
                        currNode = $(pager).data("currNode");
                        if (currNode && currNode.getId() === pathId) {
                            startRect.attr({ opacity: 1 });
                            endRect.attr({ opacity: 1 });
                        }
                    }
                },
                //线开始端的拖拽事件
                start: {
                    movestart: function () {
                        draghandler.pointDrag.movestart(startRect);
                        startRect.attr({ opacity: 1 });
                    },
                    move: function (dx, dy) {
                        draghandler.pointDrag.move(dx, dy, startRect, 0);
                        //画线
                        drawlinkPath.lineType();
                        drawlinkPath.draw();
                    },
                    moveend: function () {
                        draghandler.pointDrag.moveend(startRect, draghandler.parsePath(path.attr("path")), 0);
                    }
                },
                //线结束端的拖拽事件
                end: {
                    movestart: function () {
                        endRect.attr({ opacity: 1 });
                        draghandler.pointDrag.movestart(endRect);
                    },
                    move: function (dx, dy) {
                        draghandler.pointDrag.move(dx, dy, endRect, pathMoveOpt.length - 1);
                        //画线
                        drawlinkPath.lineType();
                        drawlinkPath.draw();
                    },
                    moveend: function () {
                        var pathOpt = draghandler.parsePath(path.attr("path")),
                            index = pathOpt.length - 1;
                        draghandler.pointDrag.moveend(endRect, pathOpt, index);
                    }
                },
                //端点拖拽通用方法
                pointDrag: {
                    movestart: function (pointElement) {
                        if (isModdrawline() === true) {
                            return;
                        }
                        nodeToggle();
                        rectMoveOpt.x = pointElement.attr("x");
                        rectMoveOpt.y = pointElement.attr("y");
                        pathMoveOpt = draghandler.parsePath(path.attr("path"));
                        rectMoveOpt.movestart = true;
                        //console.log(["point move start:", "x:", rectMoveOpt.x, "y:", rectMoveOpt.y].join(" "));
                        pointElement.attr({ "opacity": 0.7 });
                        path.attr({ "stroke-width": flow.config.path.attr["stroke-width-active"] });
                        inTop = true;
                    },
                    move: function (dx, dy, pointElement, index) {
                        if (isModdrawline() === true) {
                            return;
                        }
                        if (dx === 0 && dy === 0) {
                            return;
                        }
                        showInTop();
                        //console.log("point move dx:" + dx + " dy:" + dy);
                        var x = null,
                            y = null,
                            dotType = (index === 0) ? "fromDot" : "toDot",
                            currentPath = flowProps.path[pathId];

                        x = rectMoveOpt.x + dx;
                        y = rectMoveOpt.y + dy;
                        pointElement.attr({ x: x, y: y });
                        //去除关联
                        if (rectMoveOpt.movestart === true) {
                            path[dotType] = null;
                            currentPath[dotType] = null;
                            currentPath.props[dotType === "toDot" ? "EndNodeID" : "StartNodeID"] = null;
                            rectMoveOpt.movestart = false;
                        }

                        //画线
                        drawlinkPath.draw();
                    },
                    moveend: function (pointElement, pathOpt, index) {
                        if (isModdrawline() === true) {
                            return;
                        }
                        //console.log("point move end");
                        var x = pointElement.attr("x"),
                            y = pointElement.attr("y"),
                            pagerWidth = pager.width,
                            pagerHeight = pager.height,
                            dotType = (index === 0) ? "fromDot" : "toDot",
                            x1, x2, y1, y2;

                        x1 = rectMoveOpt.x;
                        y1 = rectMoveOpt.y;
                        //console.log("point move end1 x:" + x + " y:" + y);
                        //拖动边界处理
                        if (x < 0 || (x + rectSize) > pagerWidth || y < 0 || (y + rectSize) > pagerHeight) {
                            x = x < 0 ? 2 : (x + rectSize > pagerWidth ? pagerWidth - rectSize - 2 : x);
                            y = y < 0 ? 2 : (y + rectSize > pagerHeight ? pagerHeight - rectSize - 2 : y);
                        }
                        pointElement.attr({ x: x, y: y });
                        //判断关联节点
                        x2 = x;
                        y2 = y;
                        //console.log(["point move end2 x1:", x1, " y1:", y1, "x2:", x2, "y2:", y2].join(" "));
                        if (x1 !== x2 && y1 !== y2) {
                            draghandler.pointDrag.relateRect(pointElement, dotType, x, y);
                        }
                        //画线
                        drawlinkPath.draw();

                    },
                    //关联状态节点
                    relateRect: function (point, dotType, x, y) {
                        var isInRect = false,
                            i = 0,
                            rect = null,
                            currentPath = flowProps.path[pathId];

                        //关联矩形节点
                        for (i in rects) {
                            if (rects.hasOwnProperty(i)) {
                                rect = rects[i].node;
                                if (rect.isPointInside(x, y) === true) {
                                    currentPath[dotType] = rect.getId();
                                    path[dotType] = rect.getId();
                                    currentPath.props[dotType === "toDot" ? "EndNodeID" : "StartNodeID"] = rect.getId();
                                    isInRect = true;
                                    break;
                                }
                            }
                        }
                        if (isInRect !== true) {
                            path[dotType] = null;
                            currentPath[dotType] = null;
                            currentPath.props[dotType === "toDot" ? "EndNodeID" : "StartNodeID"] = null;
                        }
                    }
                },
                resize: {
                    movestart: function () {
                        if (isModdrawline() === true) {
                            return;
                        }
                        resizeMoveOpt = {
                            firstLineWidth: firstLineWidth,
                            rectWidth: flow.config.rect.attr.width,
                            rectPostion: null,
                            resizeStartPosition: draghandler.parsePath(resizePath.attr("path"))
                        };
                        nodeToggle();
                        if (path.fromDot) {
                            resizeMoveOpt.rectPostion = rects[path.fromDot].node.getCenter();
                        }
                        //path.attr({ "opacity": 0.7, "stroke-width": flow.config.path.attr["stroke-width-active"] });
                        path.attr({ "opacity": 0.7 });
                    },
                    move: function (dx, dy) {
                        if (isModdrawline() === true) {
                            return;
                        }
                        var x = 0,
                            y = 0,
                            width = resizeMoveOpt.rectWidth,
                            pathX = resizeMoveOpt.resizeStartPosition[0][1] + dx,
                            pathY = resizeMoveOpt.resizeStartPosition[0][2] + dy,
                            hasfromDot = !!resizeMoveOpt.rectPostion;

                        if (hasfromDot) {
                            x = resizeMoveOpt.rectPostion.x;
                            y = resizeMoveOpt.rectPostion.y;
                        }
                        else {
                            x = startRect.attr("x");
                            y = startRect.attr("y");
                        }

                        if (drawLineType === "brokenHLine") {
                            if (pathX > x) {
                                if (pathX >= pager.width) {
                                    pathX = pager.width - 5;
                                }
                            }
                            else {
                                if (pathX <= 0) {
                                    pathX = 5;
                                }
                            }
                            firstLineWidth = pathX - x;
                        }
                        else {
                            firstLineWidth = pathY - y;
                        }
                        //console.log("firestLineWidth: " + firstLineWidth);
                        drawlinkPath.draw();
                    },
                    moveend: function () {
                        var currNode;
                        if (isModdrawline() === true) {
                            return;
                        }
                        path.attr({ "opacity": 1 });

                        //当前选中连线端点全部显示
                        currNode = $(pager).data("currNode");
                        if (currNode && currNode.getId() === pathId) {
                            startRect.attr({ opacity: 1 });
                            endRect.attr({ opacity: 1 });
                        }
                    }
                },
                //解析path路径
                parsePath: function (path) {
                    //vml
                    var temp = [], len, i;
                    if (typeof path === "string") {
                        path = Raphael.parsePathString(path);
                    }
                    return path;

                }
            };

            //连线绘制
            drawlinkPath = {
                //使用路径信息绘制
                drawByPathStr: function (pathStr) {
                    var i, len, x1, x2, y1, y2, dotX1, dotY1, dotX2, dotY2, pathArray, dotSize;

                    dotSize = flow.config.path.rect.attr.width;
                    path.attr({ path: pathStr });
                    bigPath.attr({ path: pathStr });
                    resizePath.hide();
                    pathArray = draghandler.parsePath(path.attr("path"));
                    x1 = pathArray[0][1];
                    y1 = pathArray[0][2];
                    x2 = pathArray[1][1];
                    y2 = pathArray[1][2];

                    //ie11 svg path bug
                    showInTop();
                    startRect.attr({ x: x1 - dotSize / 2, y: y1 - dotSize / 2 });
                    endRect.attr({ x: x2 - dotSize / 2, y: y2 - dotSize / 2 });
                    changeProps();
                    setValidate();
                    setCondition();
                },
                //绘制连线类型
                lineType: function () {

                    var startNodeCenter, endNodeCenter, v, h, t1, t2, fromDot, fromDotX, fromDotY, toDot, toDotX, toDotY, top, bottom, left, right, x, y;

                    if (flowProps.rect.StartNode && flowProps.rect.EndNode) {
                        startNodeCenter = flowProps.rect.StartNode.node.getCenter();
                        endNodeCenter = flowProps.rect.EndNode.node.getCenter();
                    }
                    else {
                        startNodeCenter = { x: 20, y: 20 };
                        endNodeCenter = { x: 20, y: 40 };
                    }
                    v = Math.abs(endNodeCenter.y - startNodeCenter.y);
                    h = Math.abs(endNodeCenter.x - startNodeCenter.x);

                    if (path.fromDot) {
                        fromDot = flowProps.rect[path.fromDot].node.getCenter();
                        fromDotX = fromDot.x;
                        fromDotY = fromDot.y;
                    }
                    else {
                        fromDot = startRect;
                        fromDotX = startRect.attr("x");
                        fromDotY = startRect.attr("y");
                    }

                    if (path.toDot) {
                        toDot = flowProps.rect[path.toDot].node.getCenter();
                        toDotX = toDot.x;
                        toDotY = toDot.y;
                    }
                    else {
                        toDot = endRect;
                        toDotX = endRect.attr("x");
                        toDotY = endRect.attr("y");
                    }


                    //垂直流程
                    if (v > h) {
                        if (path.toDot && path.fromDot) {
                            firstLineWidth = firstLineWidth || defaultFirstLineWidth;
                        }
                        else if (!path.toDot && !path.fromDot) {
                            displayType = 0;
                            firstLineWidth = 0;
                            direction = null;
                        }
                        else {
                            t1 = toDotY - fromDotY > 0 ? 1 : -1;
                            t2 = endNodeCenter.y - startNodeCenter.y > 0 ? 1 : -1;
                            directionType = "v";
                            //正向：直线
                            if (t1 === t2) {
                                //console.log("进入 垂直流程 正向");
                                displayType = 0;
                                firstLineWidth = 0;
                                direction = true;
                            }
                                //反向
                            else {
                                //console.log("进入 垂直流程 反向");
                                displayType = 2;
                                firstLineWidth = defaultFirstLineWidth;
                                if (path.fromDot && !path.toDot) {

                                    fromDot = flowProps.rect[path.fromDot].node;
                                    x = Math.abs(startNodeCenter.x - fromDot.getCenter().x);
                                    y = Math.abs(startNodeCenter.y - fromDot.getCenter().y);
                                    y = y / 1.7;
                                    //x = x;
                                    firstLineWidth = Math.abs(y - x);
                                    firstLineWidth = firstLineWidth > defaultFirstLineWidth ? firstLineWidth : defaultFirstLineWidth;
                                    //console.log(["y:", y, "x:", x, "lineWidth:", y - x].join(" "));
                                }
                                firstLineWidth = toDotX > fromDotX ? -firstLineWidth : firstLineWidth;
                                direction = false;
                            }

                        }
                    }
                        //水平流程
                    else if (v < h) {
                        if (path.toDot && path.fromDot) {
                            firstLineWidth = firstLineWidth || defaultFirstLineWidth;
                        }
                        else if (!path.toDot && !path.fromDot) {
                            displayType = 0;
                            firstLineWidth = 0;
                            direction = null;
                        }
                        else {
                            t1 = toDotX - fromDotX > 0 ? 1 : -1;
                            t2 = endNodeCenter.x - startNodeCenter.x > 0 ? 1 : -1;
                            directionType = "h";
                            if (t1 === t2) {
                                //正向：直线
                                //console.log("进入 水平流程 正向");
                                displayType = 0;
                                firstLineWidth = 0;
                                direction = true;
                            }
                                //反向
                            else {
                                //console.log("进入 水平流程 反向");
                                displayType = 1;

                                firstLineWidth = defaultFirstLineWidth;
                                if (path.fromDot && !path.toDot) {

                                    fromDot = flowProps.rect[path.fromDot].node;
                                    x = Math.abs(startNodeCenter.x - fromDot.getCenter().x);
                                    y = Math.abs(startNodeCenter.y - fromDot.getCenter().y);
                                    //y = y;
                                    x = x / 2.5;
                                    firstLineWidth = Math.abs(x - y);
                                    firstLineWidth = firstLineWidth > defaultFirstLineWidth ? firstLineWidth : defaultFirstLineWidth;
                                    //console.log(["y:", y, "x:", x, "lineWidth:", y - x].join(" "));
                                }
                                firstLineWidth = toDotY > fromDotY ? -firstLineWidth : firstLineWidth;
                                direction = false;

                            }
                        }
                    }

                    //设置画线类型
                    switch (displayType) {
                        case 0:
                            drawLineType = "straightLine";
                            break;
                        case 1:
                            drawLineType = "brokenVLine";
                            break;
                        case 2:
                            drawLineType = "brokenHLine";
                            break;
                    }

                },
                //直线
                straightLine: function () {
                    var startX, startY, endX, endY, position = {}, hasStartRect, hasEndRect, rectAttr, width, height, x1, x2, y1, y2, line, sign;

                    startX = startRect.attr("x") + rectSize / 2;
                    startY = startRect.attr("y") + rectSize / 2;
                    endX = endRect.attr("x") + rectSize / 2;
                    endY = endRect.attr("y") + rectSize / 2;
                    hasStartRect = !!path.fromDot;
                    hasEndRect = !!path.toDot;
                    sign = directionType === "v" ? true : false;
                    //画线
                    if (path.fromDot) {
                        position = rects[path.fromDot].node.getCenter();
                        startX = position.x;
                        startY = position.y;
                    }

                    if (path.toDot) {
                        position = rects[path.toDot].node.getCenter();
                        endX = position.x;
                        endY = position.y;
                    }
                    //存在节点，则使用节点中心的x,y值，若不存在则使用线的端点中心的x,y值
                    rectAttr = flow.config.rect.attr;
                    width = rectAttr.width;
                    height = rectAttr.height;

                    //开始相对位置：上并且上位移大于1个矩形的高度时执行
                    if ((startY + height) < endY && sign) {
                        if (hasStartRect && hasEndRect) {
                            x1 = startX;
                            y1 = startY + height / 2 + rectSize / 2;
                            x2 = endX;
                            y2 = endY - height / 2 + rectSize / 2;

                        }
                        else if (hasStartRect) {
                            x1 = startX;
                            y1 = startY + height / 2 + rectSize / 2;
                            x2 = endX;
                            y2 = endY;
                        }
                        else if (hasEndRect) {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY - height / 2 + rectSize / 2;
                        }
                        else {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY;
                        }
                    }
                        //开始相对位置：下并且下位移大于1个矩形的高度时执行
                    else if (startY > (endY + height) && sign) {
                        if (hasStartRect && hasEndRect) {
                            x1 = startX;
                            y1 = startY - height / 2 + rectSize / 2;
                            x2 = endX;
                            y2 = endY + height / 2 + rectSize / 2;

                        }
                        else if (hasStartRect) {
                            x1 = startX;
                            y1 = startY - height / 2 + rectSize / 2;
                            x2 = endX;
                            y2 = endY;
                        }
                        else if (hasEndRect) {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY + height / 2 + rectSize / 2;
                        }
                        else {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY;
                        }
                    }
                        //开始相对位置：左并且上位移小于1个矩形的高度时执行
                    else if (startX <= endX) {

                        if (hasStartRect && hasEndRect) {
                            x1 = startX + width / 2 + rectSize / 2;
                            y1 = startY;
                            x2 = endX - width / 2 + rectSize / 2;
                            y2 = endY;

                        }
                        else if (hasStartRect) {
                            x1 = startX + width / 2 + rectSize / 2;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY;
                        }
                        else if (hasEndRect) {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX - width / 2 + rectSize / 2;
                            y2 = endY;
                        }
                        else {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY;
                        }
                    }
                        //开始相对位置：右并且上位移小于1个矩形的高度时执行
                    else if (startX > endX) {
                        if (hasStartRect && hasEndRect) {
                            x1 = startX - width / 2 + rectSize / 2;
                            y1 = startY;
                            x2 = endX + width / 2 + rectSize / 2;
                            y2 = endY;

                        }
                        else if (hasStartRect) {
                            x1 = startX - width / 2 + rectSize / 2;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY;
                        }
                        else if (hasEndRect) {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX + width / 2 + rectSize / 2;
                            y2 = endY;
                        }
                        else {
                            x1 = startX;
                            y1 = startY;
                            x2 = endX;
                            y2 = endY;
                        }
                    }

                    line = ["M", x1, y1, "L", x2, y2].join(" ");

                    bigPath.attr({ path: line });
                    path.attr({ path: line });
                    resizePath.attr({ path: line }).hide();
                    startRect.attr({ x: x1 - rectSize / 2, y: y1 - rectSize / 2 });
                    endRect.attr({ x: x2 - rectSize / 2, y: y2 - rectSize / 2 });
                },
                //水平连线
                brokenHLine: function () {
                    var rectAttr = flow.config.rect.attr,
                        width = rectAttr.width,
                        height = rectAttr.height,
                        x = 0,
                        y = 0,
                        x1 = 0,
                        y1 = 0,
                        x2 = 0,
                        y2 = 0,
                        x3 = 0,
                        y3 = 0,
                        x4 = 0,
                        y4 = 0,
                        lineSize = path.attr("stroke-width"),
                        line = "",
                        line1 = "",
                        line2 = "",
                        line3 = "",
                        line4 = "",
                        fromDotX,
                        fromDotY,
                        toDotX,
                        toDotY,
                        nodeCenter = {};


                    //折线1-开始
                    if (path.fromDot) {
                        nodeCenter = rects[path.fromDot].node.getCenter();
                        if (firstLineWidth < 0) {
                            x1 = nodeCenter.x - width / 2 + rectSize / 2;
                        }
                        else {
                            x1 = nodeCenter.x + width / 2 + rectSize / 2;
                        }
                        y1 = nodeCenter.y;
                    }
                    else {
                        x1 = startRect.attr("x") + rectSize / 2;
                        y1 = startRect.attr("y") + rectSize / 2;
                    }

                    //折线1-结束
                    if (path.fromDot) {
                        x2 = nodeCenter.x + firstLineWidth;
                    }
                    else {
                        x2 = x1 + firstLineWidth;
                    }
                    y2 = y1;
                    line1 = [" M", x1, y1, "L", x2, y2].join(" ");

                    //折线2
                    x = nodeCenter.x || x1;

                    x3 = x2;

                    if (path.toDot) {
                        nodeCenter = rects[path.toDot].node.getCenter();
                        y3 = nodeCenter.y;
                    }
                    else {
                        y3 = endRect.attr("y") + rectSize / 2;
                    }

                    line2 = [" L", x3, y3].join(" ");

                    //折线3
                    if (path.toDot) {
                        x4 = x3 < nodeCenter.x ? (nodeCenter.x - width / 2 + rectSize / 2) : (nodeCenter.x + width / 2 + rectSize / 2);
                    }
                    else {
                        x4 = endRect.attr("x") + rectSize / 2;
                    }
                    y4 = y3;

                    line3 = [" L", x4, y4].join(" ");

                    //画线
                    line = line1 + line2 + line3;
                    bigPath.attr({ path: line });
                    path.attr({ path: line });
                    line2 = [" M", x2, y2, "L", x3, y3].join(" ");
                    //console.log("brokenLine h resizePath:" + line2);
                    resizePath.attr({ path: line2, cursor: "w-resize" });
                    if (path.toDot && path.fromDot) {
                        resizePath.show();
                    }
                    else {
                        resizePath.hide();
                    }
                    startRect.attr({ x: x1 - rectSize / 2, y: y1 - rectSize / 2 });
                    endRect.attr({ x: x4 - rectSize / 2, y: y4 - rectSize / 2 });
                },
                //垂直连线
                brokenVLine: function () {

                    var rectAttr = flow.config.rect.attr,
                                        width = rectAttr.width,
                                        height = rectAttr.height,
                                        x = 0,
                                        y = 0,
                                        x1 = 0,
                                        y1 = 0,
                                        x2 = 0,
                                        y2 = 0,
                                        x3 = 0,
                                        y3 = 0,
                                        x4 = 0,
                                        y4 = 0,
                                        lineSize = path.attr("stroke-width"),
                                        line = "",
                                        line1 = "",
                                        line2 = "",
                                        line3 = "",
                                        line4 = "",
                                        fromDotX,
                                        fromDotY,
                                        toDotX,
                                        toDotY,
                                        nodeCenter = {};

                    //折线1-开始
                    if (path.fromDot) {
                        nodeCenter = rects[path.fromDot].node.getCenter();
                        if (firstLineWidth < 0) {
                            y1 = nodeCenter.y - height / 2 + rectSize / 2;
                        }
                        else {
                            y1 = nodeCenter.y + height / 2 + rectSize / 2;
                        }
                        x1 = nodeCenter.x;
                    }
                    else {
                        y1 = startRect.attr("y") + rectSize / 2;
                        x1 = startRect.attr("x") + rectSize / 2;
                    }
                    //折线1-结束
                    if (path.fromDot) {
                        y2 = nodeCenter.y + firstLineWidth;
                    }
                    else {
                        y2 = y1 + firstLineWidth;
                    }
                    x2 = x1;
                    line1 = [" M", x1, y1, "L", x2, y2].join(" ");
                    y = nodeCenter.y || y1;
                    //折线2

                    y3 = y2;

                    if (path.toDot) {
                        nodeCenter = rects[path.toDot].node.getCenter();
                        x3 = nodeCenter.x;
                    }
                    else {
                        x3 = endRect.attr("x") + rectSize / 2;
                    }


                    line2 = [" L", x3, y3].join(" ");

                    //折线3
                    if (path.toDot) {
                        y4 = y3 < nodeCenter.y ? (nodeCenter.y - height / 2 + rectSize / 2) : (nodeCenter.y + height / 2 + rectSize / 2);
                    }
                    else {
                        y4 = endRect.attr("y") + rectSize / 2;
                    }
                    x4 = x3;

                    line3 = [" L", x4, y4].join(" ");

                    //画线
                    line = line1 + line2 + line3;
                    bigPath.attr({ path: line });
                    path.attr({ path: line });
                    line2 = [" M ", x2, y2, " L ", x3, y3].join(" ");
                    //console.log("brokenLine v resizePath:" + line2);
                    resizePath.show().attr({ path: line2, cursor: "s-resize" });
                    startRect.attr({ x: x1 - rectSize / 2, y: y1 - rectSize / 2 });
                    endRect.attr({ x: x4 - rectSize / 2, y: y4 - rectSize / 2 });
                },
                //绘制连线
                draw: function () {
                    var x1, y1, x2, y2, currentNode;
                    this.lineType();
                    this[drawLineType]();
                    //ie11 svg path bug
                    showInTop();
                    //console.log("showInTop!");
                    changeProps();
                    setValidate();
                    setCondition();
                    //console.log("firstLineWidth in drawlinkPath: " + firstLineWidth);
                    x1 = startRect.attr("x");
                    y1 = startRect.attr("y");
                    x2 = endRect.attr("x");
                    y2 = endRect.attr("y");
                    arrowDispaly(x1, y1, x2, y2);

                    //端点显示控制
                    if (path.toDot) {
                        endRect.attr({ opacity: 0 });
                    }
                    else {
                        endRect.attr({ opacity: 1 });
                    }
                    if (path.fromDot) {
                        startRect.attr({ opacity: 0 });
                    }
                    else {
                        startRect.attr({ opacity: 1 });
                    }
                }
            };

            //连线结束时触发的事件
            function onLinkMoveEnd() {
                var link, lineMoveEnd;
                link = self;
                lineMoveEnd = flow.config.event.lineMoveEnd;
                if (typeof lineMoveEnd === "function") {
                    try {
                        lineMoveEnd.call(link, opt.pid, flowProps[link.type][link.getId()].props || null, flowProps.props, direction);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }

            //双击事件
            function ondbClick(e) {
                var fromDot, x, y;
                //console.log("path dblclick");
                //两端存在节点时允许线型变换
                if (path.toDot && path.fromDot) {
                    firstLineWidth = defaultFirstLineWidth;
                    path.attr({ "stroke-width": flow.config.path.attr["stroke-width-active"] });
                    //console.log(drawLineType);
                    if (displayType === 0) {
                        displayType = 1;
                        firstLineWidth = defaultFirstLineWidth;
                    }
                    else if (displayType === 1) {
                        displayType = 2;
                        firstLineWidth = defaultFirstLineWidth;
                    }
                    else {
                        displayType = 0;
                        firstLineWidth = 0;
                    }

                    drawlinkPath.draw();
                }
                changeProps();
            }

            //绑定拖拽事件
            function binddrag() {
                if (flow.config.editable) {
                    bigPath.drag(function (dx, dy) { draghandler.path.move(dx, dy); }, function () { draghandler.path.movestart(); }, function () { draghandler.path.moveend(); onLinkMoveEnd(); });
                    resizePath.drag(function (dx, dy) { draghandler.resize.move(dx, dy); }, function () { draghandler.resize.movestart(); }, function () { draghandler.resize.moveend(); });
                    startRect.drag(function (dx, dy) { draghandler.start.move(dx, dy); }, function () { draghandler.start.movestart(); }, function () { draghandler.start.moveend(); onLinkMoveEnd(); });
                    endRect.drag(function (dx, dy) { draghandler.end.move(dx, dy); }, function () { draghandler.end.movestart(); }, function () { draghandler.end.moveend(); onLinkMoveEnd(); });
                }
            }

            //绑定单击事件
            function bindclick() {
                if (!flow.config.editable) {
                    return;
                }
                $([bigPath.node, resizePath.node]).on("dblclick", ondbClick);
            }

            //解除拖拽事件绑定
            function unbinddrag() {
                path.undrag();
                bigPath.undrag();
                startRect.undrag();
                endRect.undrag();
            }

            //解除点击事件绑定
            function unbindclick() {
                $([path.node, bigPath.node, startRect.node, endRect.node]).off();
            }

            //初始化及创建
            create(opt);
            binddrag();
            bindclick();

            //获取Id
            this.getId = function () {
                return pathId;
            };

            //设置、获取属性
            this.attr = function (opt) {
                if (typeof opt === "string") {
                    return path.attr(opt);
                }

                if (typeof opt === "object") {
                    if (opt.path) {
                        drawlinkPath.drawByPathStr(opt.path);
                        opt.path = null;
                        delete opt.path;
                    }
                    path.attr(opt);
                }

            };

            //删除
            this.remove = function () {
                var i, len, pathList;
                unbindclick();
                unbinddrag();

                path.remove();
                bigPath.remove();
                startRect.remove();
                endRect.remove();
                validate.remove();
                condition.remove();

                self = null;
                path = null;
                startRect = null;
                endRect = null;
                pathMoveOpt = null;
                rectMoveOpt = null;

                flowProps.path[pathId] = null;
                delete flowProps.path[pathId];
                pathList = flowProps.props.LinkList;
                for (i = 0, len = pathList.length; i < len; i++) {
                    if (pathId === pathList[i].LinkID) {
                        pathList.splice(i, 1);
                        break;
                    }
                }

                $(pager).data("currNode", null);
            };

            //重新绘制连线
            this.reDraw = function () {
                drawlinkPath.draw();
            };

            //关联节点
            this.relateDot = function (dotType, x, y) {
                draghandler.pointDrag.relateRect(null, dotType, x, y);
            };

            //删除关联节点
            this.removeDot = function (id) {
                if (path.toDot === id) {
                    path.toDot = null;
                    flowProps.path[pathId].toDot = null;
                    flowProps.path[pathId].props.EndNodeID = null;
                }

                if (path.fromDot === id) {
                    path.fromDot = null;
                    flowProps.path[pathId].fromDot = null;
                    flowProps.path[pathId].props.StartNodeID = null;
                }
            };

            //按结束位置画线
            this.drawByToDot = function () {
                drawlinkPath.lineType();
                drawlinkPath.draw();
            };

            this.linkMoveEnd = function () {
                onLinkMoveEnd();
            };

            //设置选中
            this.setSelected = function () {
                nodeToggle();
            };

            //显示验证信息
            this.showValidate = function (text) {
                validate.attr("text", text).show();
            };

            //显示验证信息
            this.conditionText = function (text) {
                condition.attr("text", text).show();
            };

            //隐藏验证信息
            this.hideValidate = function (text) {
                validate.hide();
            };

            //类型
            this.type = "path";
        },
        init: function (container, opt) {
            var restore,
                width,
                height,
                paper,
                canvas,
                editable,
                tools,
                flowProps,
                currentPath,
                pid,
                toolsInit,
                config,
                config_tools;

            container = $(container);
            container.addClass("workflow-editor");
            restore = opt.restore || flow.config.restore;
            opt = $.extend(flow.config, opt);
            width = container.width();
            height = container.height();
            paper = null;
            canvas = null;
            editable = flow.config.editable;
            tools = $("");
            config = flow.config;
            currentPath = null;
            pid = opt.pid;
            flowProps = { props: restore, rect: {}, path: {} };

            //创建画板
            function createcanvas() {
                canvas = $("<div class=\"svg-container-top\"><div  class=\"svg-container\" ></div></div>").appendTo(container).find(".svg-container");
                if (config.width) {
                    canvas.width(config.width);
                }
                if (config.width) {
                    canvas.height(config.height);
                }
                paper = new Raphael(canvas[0], canvas.width(), canvas.height());
            }

            //节点切换
            function canvasNodeToggle(e, prevNode, currNode) {
                var toggle = flow.config.event.toggle,
                    prevNodeId = prevNode ? prevNode.getId() : null,
                    currNodeId = currNode ? currNode.getId() : null,
                    prevNodeProps,
                    currNodeProps,
                    text = null,
                    src = null,
                    stopToggle;

                prevNodeProps = prevNode ? flowProps[prevNode.type][prevNode.getId()].props : null;
                currNodeProps = currNode ? flowProps[currNode.type][currNode.getId()].props : null;
                //执行节点切换方法
                if (typeof toggle === "function") {
                    try {
                        //返回false阻止toggle事件
                        stopToggle = toggle.call(null, pid, prevNodeProps, currNodeProps, flowProps.props) === false ? true : false;
                        console.log("canvasNodeToggle stopToggle:" + stopToggle);
                        //记录toggle事件状态
                        flow.util.stopToggle(stopToggle);
                    }
                    catch (e) {
                        console.error(e);
                        return;
                    }
                    if (stopToggle) {
                        return;
                    }

                    //同步节点显示 text img
                    if (prevNode && prevNode.type === "rect") {
                        if (prevNodeProps) {
                            prevNode.text(prevNodeProps.NodeText);
                            if (typeof prevNodeProps.ImagePath === "string") {
                                prevNode.img(prevNodeProps.ImagePath.replace(/~\\/, flow.config.basePath));
                            }
                        }
                    }
                    else if (prevNode && prevNode.type === "path") {
                        if (prevNodeProps) {
                           
                            prevNode.conditionText(prevNodeProps.ConditionText);
                        }
                    }
                }
                //将上一个选中节点恢复为未选中
                if (prevNode && currNodeId !== prevNodeId) {
                    if (prevNode.type === "path") {
                        prevNode.attr({ "stroke-width": flow.config.path.attr["stroke-width"], "stroke": flow.config.path.attr["stroke"] });
                        prevNode.reDraw();

                    } else if (prevNode.type === "rect") {
                        prevNode.attr({ "stroke-width": flow.config.rect.attr["stroke-width"], "stroke": flow.config.rect.attr["stroke"] });
                    }
                }

            }

            //删除节点
            function removeNode() {
                var node, type, toggle, nodeId;

                if (!config.editable) {
                    return;
                }
                node = $(paper).data("currNode");
                if (!node) {
                    return;
                }

                type = node.type;
                toggle = config.event.toggle;

                if (type === "rect") {
                    nodeId = node.getId();
                    //不允许删除开始和结束状态节点
                    if (nodeId === "StartNode" || nodeId === "EndNode") {
                        return;
                    }
                    node.remove();
                }
                else if (type === "path") {
                    node.remove();
                }

                //执行切换方法
                if (typeof toggle === "function") {
                    try {
                        toggle.call(null, pid, null, null, flowProps.props);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                $(paper).removeData("currNode");


            }

            //添加rect类型节点
            function addrect(e, type, options) {
                var id = options.id || ("NODE" + config.guid + flow.util.nextId()),
                    opt = $.extend(true, {}, flow.config.tools.states[type], options, { id: id }),
                    node = null,
                    d = null,
                    newNode = null,
                    isCreateNewNode = !options.id,
                    props = options.props;

                //新建的节点，把属性添加到全局流程对象
                if (isCreateNewNode) {
                    newNode = $.extend(true, {}, flow.config.tools.states[type].props);
                    flowProps.props.NodeList.push(newNode);
                    newNode.NodeID = id;
                    props = newNode;
                }
                //创建新的节点
                node = new flow.rect(opt, paper, flowProps);
                //将节点加入列表
                d = flowProps.rect[id] = {};
                d.node = node;
                d.props = props;
                //由工具栏新建的节点自动选中
                if (isCreateNewNode) {
                    node.setSelected();
                }
                return node;
            }

            //添加relaterect类型节点
            function addrelaterect(e, type, options) {
                var startId = null,
                    endId = null,
                    nodeStartOpt = null,
                    nodeEndOpt = null,
                    nodeStart,
                    nodeEnd,
                    dStart,
                    dEnd,
                    y,
                    rectHeight = flow.config.rect.attr.height,
                    nodeEndData,
                    nodeStartData,
                    newStart,
                    newEnd,
                    guid = config.guid + flow.util.nextId();


                startId = "NODE" + guid + "-SNode";
                endId = "NODE" + guid + "-ENode";
                nodeStartOpt = $.extend(true, {}, config.tools.states[type], options, { id: startId });
                nodeEndOpt = $.extend(true, {}, config.tools.states[type], options, { id: endId });
                nodeStartOpt.text.text = nodeStartOpt.text.start;
                nodeEndOpt.text.text = nodeStartOpt.text.end;
                y = nodeEndOpt.attr.y + 100 + rectHeight;
                if (y > config.height) {
                    y = config.height - rectHeight;
                    nodeEndOpt.attr.y = y;
                    nodeStartOpt.attr.y = y - 100;
                }
                else {
                    nodeEndOpt.attr.y = y - rectHeight;
                }

                //新建的节点，把属性添加到全局流程对象
                newStart = nodeStartOpt.props;
                newStart.NodeID = startId;
                flowProps.props.NodeList.push(newStart);
                newEnd = nodeEndOpt.props;
                newEnd.NodeID = endId;
                flowProps.props.NodeList.push(newEnd);

                //创建节点
                nodeStart = new flow.rect(nodeStartOpt, paper, flowProps);
                nodeEnd = new flow.rect(nodeEndOpt, paper, flowProps);
                nodeStart.relateRect = nodeEnd;
                nodeEnd.relateRect = nodeStart;
                //加入节点列表
                nodeStartData = flowProps.rect[startId] = {};
                nodeEndData = flowProps.rect[endId] = {};
                nodeStartData.node = nodeStart;
                nodeEndData.node = nodeEnd;
                nodeStartOpt.props.NodeText = nodeStartOpt.text.text;
                nodeStartData.props = nodeStartOpt.props;
                nodeEndOpt.props.NodeText = nodeEndOpt.text.text;
                nodeEndData.props = nodeEndOpt.props;
                //自动选中
                nodeStart.setSelected();

                return [nodeStart, nodeEnd];
            }

            //添加连线
            function addpath(e, type, options) {
                var id = options.id || ("LINE" + config.guid + flow.util.nextId()),
                    opt = $.extend(true, {}, config.tools.states[type], options, { id: id, pid: pid }),
                    node = null,
                    d = null,
                    newNode,
                    props = options.props;

                //新建的节点，把属性添加到全局流程对象
                if (!options.id) {
                    newNode = $.extend(true, {}, config.tools.states[type].props);
                    flowProps.props.LinkList.push(newNode);
                    newNode.LinkID = id;
                    props = newNode;
                }
                //创建连线
                node = new flow.path(opt, paper, flowProps);
                //将连线加入列表
                d = flowProps.path[id] = {};
                d.node = node;
                d.props = props;

                d.toDot = opt.toDot || null;
                d.fromDot = opt.fromDot || null;
                //重绘
                node.reDraw();

                currentPath = node;
                return node;
            }

            //添加节点
            function addnode(opt, x, y) {
                var type, nodes;
                if (opt) {
                    type = opt.nodeType;
                    switch (type) {
                        case "relaterect":
                            $(paper).trigger("addrelaterect", [opt.type, { attr: { x: x, y: y }, img: { src: opt.img.src } }]);
                            break;
                        case "path":
                            $(paper).trigger("addpath", [opt.type, $.extend({ x: x, y: y }, opt)]);
                            break;
                        default:
                            $(paper).trigger("addrect", [opt.type, $.extend({ attr: { x: x, y: y }, img: { src: opt.img.src } }, opt)]);
                            break;
                    }
                }
                return nodes;
            }

            // 键盘 Delete 删除事件
            function canvaskeydown(e) {
                if (!flow.config.editable) {
                    return;
                }
                if (e.keyCode === 46) {
                    if (e && e.target.tagName.toLowerCase() === "input") {
                        return;
                    }
                    removeNode();
                }

            }

            // 画布空白双击事件
            function selectTemplate(e) {
                if (e.target.tagName === "svg" || e.target.tagName.toLowerCase() === "div") {
                    var fn = flow.config.event.selectTemplate;
                    if (typeof fn === "function") {
                        try {
                            fn.call(null, pid, flowProps.props);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }

            }

            //加载创建流程图
            function load() {
                var i, len, rectList, pathList, node, nodeOpt, x, y, offsetX = 0, offsetY = 0;
                if (restore) {
                    rectList = restore.NodeList;
                    if (rectList instanceof Array) {
                        //对起始节点Y<0的情况进行处理，保证开始节点在画布内
                        for (i = 0, len = rectList.length; i < len; i++) {
                            node = rectList[i];
                            if (node.NodeType = "StartNode") {
                                if (node.CenterX < 0) {
                                    offsetX = Math.abs(node.CenterX) + flow.config.rect.attr.width || 0;
                                }
                                if (node.CenterY < 0) {
                                    offsetY = Math.abs(node.CenterY) + flow.config.rect.attr.height || 0;
                                }
                                break;
                            }
                        }


                        for (i = 0, len = rectList.length; i < len; i++) {
                            node = rectList[i];
                            nodeOpt = { nodeType: "addrect", id: node.NodeID, img: { src: node.ImagePath.replace(/~\\/, ""), width: 16, height: 16 }, text: { text: node.NodeText }, props: node };
                            addnode(nodeOpt, node.CenterX + offsetX - flow.config.rect.attr.width / 2, node.CenterY + offsetY - flow.config.rect.attr.height / 2);
                        }
                    }

                    pathList = restore.LinkList;
                    if (pathList instanceof Array) {
                        for (i = 0, len = pathList.length; i < len; i++) {
                            node = pathList[i];
                            x = { x1: node.StartX + offsetX, x2: node.EndX + offsetX };
                            y = { y1: node.StartY + offsetY, y2: node.EndY + offsetY };
                            //创建连线
                            nodeOpt = { nodeType: "path", id: node.LinkID, props: node, firstLength: node.FirstLength, fromDot: node.StartNodeID, toDot: node.EndNodeID, displayType: node.DisplayType };
                            addnode(nodeOpt, x, y);
                        }
                    }
                }
            }

            //保存流程图
            function save() {
                var node = $(paper).data("currNode");
                $(paper).data("currNode", null);
                $(paper).trigger("canvasNodeToggle", [node, null]);

            }

            //验证流程图
            function validate() {
                var fn, list, rectList, pathList, node, i, data, len, id, text;

                fn = flow.config.event.validate;
                if (typeof fn === "function") {
                    try {
                        list = fn.call(flowProps, pid, flowProps.props);
                    }
                    catch (e) {
                        console.error(e);
                        list = [];
                    }
                    $(container).data("validate", list);
                }
                //隐藏验证信息
                rectList = flowProps.rect;
                pathList = flowProps.path;
                for (i in rectList) {
                    if (rectList.hasOwnProperty(i)) {
                        node = rectList[i];
                        node.node.hideValidate();
                    }
                }
                for (i in pathList) {
                    if (pathList.hasOwnProperty(i)) {
                        node = pathList[i];
                        node.node.hideValidate();
                    }
                }
                if (list && list.length > 0) {
                    for (i = 0, len = list.length; i < len; i++) {
                        id = list[i].key;
                        if (rectList[id]) {

                            rectList[id].node.showValidate(list[i].value);
                        }
                        else if (pathList[id]) {
                            pathList[id].node.showValidate(list[i].value);
                        }
                    }
                }

            }

            //创建工具栏
            function createTools() {
                tools = flow.tools(container, flowProps, paper);
                var toolsNode = tools.find(".flow-tools-node");

                toolsNode.hover(function () { $(this).addClass("ui-state-hover"); }, function () { $(this).removeClass("ui-state-hover"); });
                toolsNode.on("click", function () {

                    var nodeOpt = config.tools.states[$(this).attr("type")],
                        type = nodeOpt.nodeType,
                        cursor = "default";

                    $(".flow-tools-node").removeClass("selected ui-state-active");
                    $(this).addClass("selected ui-state-active");
                    $(paper).data("mod", this);

                    if (type === "select" || type === "delete" || type === "validate") {
                        cursor = "default";
                    }
                    else {
                        cursor = "crosshair";
                    }

                    if (type === "path") {
                        $(paper).data("mod-draw-line", true);
                    }
                    else {
                        $(paper).data("mod-draw-line", false);
                    }

                    canvas.css({ cursor: cursor });
                });

                //创建节点或线 允许创建多个
                canvas.on({
                    mousedown: function (e) {
                        //按下鼠标左键
                        if (e.which === 1) {
                            var which = e.which,
                            mod = $($(paper).data("mod")),
                            x = e.offsetX,
                            y = e.offsetY,
                            nodeOpt,
                            type,
                            target = e.target,
                            line = null,
                            targetType;

                            //创建连线
                            nodeOpt = flow.config.tools.states[mod.attr("type")];
                            if (!nodeOpt) {
                                return;
                            }
                            type = nodeOpt.nodeType;
                            //工具栏选中元素为连线，则创建连线并根据开始端点判断节点关联情况并
                            if (type === "path") {
                                //不允许在line指示节点上创建新的line
                                targetType = $(target).attr("data-type");
                                if (targetType === 'path-start-rect' || targetType === 'path-end-rect') {
                                    return;
                                }

                                if (target.tagName === "tspan") {
                                    target = $(target).parent();
                                    x = parseInt(target.attr("x"), 0);
                                    y = parseInt(target.attr("y"), 0);
                                }

                                if (target.tagName === "shape") {
                                    //console.log("raphaelid:" + target.raphaelid);
                                    x = x + Math.floor($(target).css("left").replace("px", ""));
                                    y = y + Math.floor($(target).css("top").replace("px", ""));
                                }
                                line = addnode(nodeOpt, { x1: x, x2: x }, { y1: y, y2: y });
                                //console.log({ x: x, y: y });
                                currentPath.relateDot("fromDot", x, y);
                                $(paper).data("mod-create-line", { x: x, y: y, line: currentPath });
                            }
                            else {
                                $(paper).removeData("mod-create-line");
                                $(paper).data("mod-create-rect", true);
                            }
                        }
                    },
                    mouseup: function (e) {
                        var which = e.which,
                            mod = $($(paper).data("mod")),
                            x = e.offsetX,
                            y = e.offsetY,
                            nodeOpt,
                            type,
                        stop = $(paper).data("mod-create-stop"),
                            target = e.target;

                        nodeOpt = flow.config.tools.states[mod.attr("type")];
                        if (!nodeOpt) {
                            return;
                        }
                        type = nodeOpt.nodeType;

                        if (!mod || type === "select" || type === "delete" || type === "path" || type === "validate") {
                            //工具栏选中元素为连线，并且在按下左键并释放后，根据结束端点判断节点关联情况并重绘连线
                            $(paper).removeData("mod-create-line");
                            if (which === 1 && type === "path" && currentPath) {
                                if (target.tagName === "tspan") {
                                    target = $(target).parent();
                                    x = parseInt(target.attr("x"), 0);
                                    y = parseInt(target.attr("y"), 0);
                                }
                                if (target.tagName === "shape") {
                                    x = x + Math.floor($(target).css("left").replace("px", ""));
                                    y = y + Math.floor($(target).css("top").replace("px", ""));
                                    //console.log("linecreate-moveend-vml:\n raphaelid:" + target.raphaelid);
                                }
                                //console.log(["linecreate-end:\n", "x:", x, "y:", y].join(" "));
                                currentPath.relateDot("toDot", x, y);
                                currentPath.reDraw();
                                currentPath.linkMoveEnd();
                                currentPath.setSelected();
                                currentPath = null;
                            }
                        }
                            //创建状态节点元素
                        else if (which === 1) {
                            if (target.tagName === "svg" || target.tagName.toLowerCase() === "div") {
                                if ($(paper).data("mod-create-rect")) {
                                    //避免重复新建节点在同一个位置，自动错开
                                    $(paper.canvas).find('rect').each(function () {
                                        var rect = $(this),
                                            rectX = rect.attr("x"),
                                            rectY = rect.attr("y"),
                                            max = 4,
                                            min = 2,
                                            range = max - min,
                                            rand = Math.random(),
                                            random;

                                        if (Math.abs(rectX - x) < 2 || Math.abs(rectY - y) < 2) {
                                            random = (min + Math.round(rand * range));
                                            x += random;
                                            y += random;
                                        }

                                    });
                                    addnode(nodeOpt, x, y);
                                    $(paper).data("mod-create-rect", false);
                                }

                            }
                        }

                        //点击鼠标右键，恢复工具栏元素为选择状态
                        if (which === 3) {
                            tools.find(".select").click();
                        }


                    },
                    mousemove: function (e) {
                        var which = e.which,
                            mod = $($(paper).data("mod")),
                            x1 = 0,
                            y1 = 0,
                            x2 = e.offsetX,
                            y2 = e.offsetY,
                            nodeOpt,
                            type,
                            lineCreate = $(paper).data("mod-create-line"),
                            path = null,
                            line = "",
                            target = e.target,
                            offset;

                        nodeOpt = flow.config.tools.states[mod.attr("type")];
                        if (!nodeOpt) {
                            return;
                        }
                        type = nodeOpt.nodeType;
                        //工具栏选中元素为连线，并且在按下左键的状态下移动鼠标，根据新的结束端点坐标重绘连线
                        if (lineCreate) {
                            path = lineCreate.line;
                            x1 = lineCreate.x;
                            y1 = lineCreate.y;

                            if (target.tagName === "tspan") {
                                target = $(target).parent();
                                x2 = parseInt(target.attr("x"), 0);
                                y2 = parseInt(target.attr("y"), 0);
                            }
                            if (target.tagName === "shape") {
                                //console.log("linecreate-move-vml:\n raphaelid:" + target.raphaelid);
                                x2 = x2 + Math.floor($(target).css("left").replace("px", ""));
                                y2 = y2 + Math.floor($(target).css("top").replace("px", ""));
                            }
                            line = ["M", x1, y1, "L", x2, y2].join(" ");
                            //console.log("linecreate-move:\n tagName:" + target.tagName + " path:" + line);
                            currentPath.attr({ path: line });
                            currentPath.drawByToDot();
                        }
                    },
                    contextmenu: function () { return false; }
                });

                //验证选项
                tools.find(".validate").on("click", function () {
                    validate();
                });
                //删除选项
                tools.find(".delete").on("click", function () {
                    removeNode();
                });
            }


            //初始化流程图
            createcanvas();

            if (editable === true) {
                createTools();
                $(paper).data("mod", "point");
                $(document).on("keydown", canvaskeydown);
                $(paper).on("canvasNodeToggle", canvasNodeToggle);
                $(paper.canvas).on("dblclick", selectTemplate);
                $(paper).on("addrect", addrect);
                $(paper).on("addrelaterect", addrelaterect);
                $(paper).on("addpath", addpath);
            }

            $(container).on("save", save);
            //$(container).on("destroy", destroy);
            $(container).on("validate", validate);

            load();
        }
    };

    $.fn.hoteamflow = function (opt) {
        var fn, self, $self;

        self = this;
        $self = $(this);

        fn = {
            destroy: function () {
                $self.empty().removeClass("workflow-editor");
            },
            save: function () {
                $self.trigger("save");
            },
            validate: function () {
                var data;
                $self.trigger("validate");
                data = $self.data("validate");
                return data;
            }
        };

        if (typeof opt === "string") {
            if (typeof fn[opt] === "function") {
                return fn[opt]();
            }
        }
        else {
            return this.each(function () {
                $self.empty().removeClass("workflow-editor");
                flow.init(this, opt);
            });
        }
    };

    $.hoteamflow = flow;
}(jQuery));