define([
    "Rectangle"
], function (Rectangle) {

    var _data = {};

    var isMouseDown;

    var x1, y1, x2, y2;

    var selectedRectangle;
    var newRectangle;


    function setData(data) {
        _data = data;
        Object.keys(_data).forEach(function (pageNumber) {
            if (pageNumber !== "fileId") {
                addListeners(_data[pageNumber].canvas);
            }
        });
    }

    function addListeners(canvas) {
        canvas.addEventListener('mousedown', mouseDownHandler, false);
        canvas.addEventListener('mouseup', mouseUpHandler, false);
        canvas.addEventListener('mousemove', mouseMoveHandler, false);
    }

    function mouseDownHandler(event) {
        isMouseDown = true;
        if (event.button == 0) {
            var id = event.target.id;
            var canvas = _data[id].canvas;
            if (!_data[id].image) {
                _data[id].image = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
            }

            x1 = event.pageX - getCoords(canvas).left;
            y1 = event.pageY - getCoords(canvas).top;

            // запоминаем выбранный прямоугольник
            selectedRectangle = getRectangle(id, x1, y1);
        }

        return false;
    }


    function mouseMoveHandler(event) {
        var id = event.target.id;
        var canvas = _data[id].canvas;
        x2 = event.pageX - getCoords(canvas).left;
        y2 = event.pageY - getCoords(canvas).top;

        if (event.button == 0) {
            if (isMouseDown) {
                var rects = getRectanglesArray(id);
                if (selectedRectangle) {
                    selectedRectangle.clicked = true;
                    if (selectedRectangle.getDragDirection(x2, y2) != selectedRectangle.dragDirections.NONE) {
                        selectedRectangle.resize(x2, y2);
                        selectedRectangle.draw(canvas, _data[id].image, rects)
                    }
                } else {
                    newRectangle = new Rectangle(
                        x1 < x2 ? x1 : x2,
                        y1 < y2 ? y1 : y2,
                        x1 > x2 ? x1 : x2,
                        y1 > y2 ? y1 : y2
                    );
                    rects.push(newRectangle);
                    newRectangle.draw(canvas, _data[id].image, rects);
                }
            } else {
                canvas.style.cursor = getCursorStyle(getRectangle(id, x2, y2), x2, y2);
            }
        }

    }

    function mouseUpHandler(event) {

        var id = event.target.id;
        var canvas = _data[id].canvas;
        x2 = event.pageX - getCoords(canvas).left;
        y2 = event.pageY - getCoords(canvas).top;

        if (event.button == 0) {
            if (newRectangle && Math.abs(x1 - x2) > 30 && Math.abs(y1 - y2) > 30) {
                var newRectId = Math.max.apply(null, Object.keys(_data[id].rectangles)) + 1;
                if (newRectId < 0) {
                    newRectId = 0;
                }
                _data[id].rectangles[newRectId] = newRectangle;
            } else if (selectedRectangle) {
                selectedRectangle.clicked = false;

                if (selectedRectangle.isCloseHovered(x2, y2)) {
                    var rectKey = Object.keys(_data[id].rectangles).find(function (rectId) {
                        return _data[id].rectangles[rectId].isInside(x2, y2);
                    });
                    delete _data[id].rectangles[rectKey];
                }
            }
        }

        Object.keys(_data).forEach(function (pageId) {
            if (pageId != "fileId") {
                (new Rectangle()).draw(_data[pageId].canvas, _data[pageId].image, getRectanglesArray(pageId));
            }
        });


        newRectangle = null;
        selectedRectangle = null;
        isMouseDown = false;

        console.log(_data);

        return false;
    }

    function getRectangle(pageId, x, y) {
        var matched = getRectanglesArray(pageId).filter(function (rectangle) {
            return rectangle.isInside(x, y);
        });
        return matched[matched.length - 1];
    }

    function getRectanglesArray(id) {
        return Object.keys(_data[id].rectangles).map(function (key) {
            return _data[id].rectangles[key];
        });
    }

    function getCursorStyle(rectangle, mouseX, mouseY) {
        if (rectangle) {
            if (rectangle.isCloseHovered(x2, y2)) {
                return "pointer";
            }
            switch (rectangle.getDragDirection(mouseX, mouseY)) {
                case rectangle.dragDirections.NORTH:
                    return "n-resize";
                case rectangle.dragDirections.SOUTH:
                    return "s-resize";
                case rectangle.dragDirections.WEST:
                    return "w-resize";
                case rectangle.dragDirections.EAST:
                    return "e-resize";
                case rectangle.dragDirections.SOUTH_EAST:
                    return "se-resize";
                case rectangle.dragDirections.SOUTH_WEST:
                    return "sw-resize";
                case rectangle.dragDirections.NORTH_EAST:
                    return "ne-resize";
                case rectangle.dragDirections.NORTH_WEST:
                    return "nw-resize";
                default:
                    return "crosshair";
            }
        }
        return "crosshair";
    }

    function getCoords(elem) {
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docEl = document.documentElement;

        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;

        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return {top: Math.round(top), left: Math.round(left)};
    }

    return {
        setData: setData
    };
});