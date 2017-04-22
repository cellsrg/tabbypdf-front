define(function () {

    /**
     *  Rectangle is an area selected by user on canvas that contains PDF page.
     *  Rectangle is resizable.
     */
    function Rectangle(x1, y1, x2, y2) {
        /**
         * Left
         */
        this.x1 = typeof x1 !== 'undefined' ? x1 : 0
        /**
         * Top
         */
        this.y1 = typeof y1 !== 'undefined' ? y1 : 0;
        /**
         * Right
         */
        this.x2 = typeof x2 !== 'undefined' ? x2 : 0;
        /**
         * Bottom
         */
        this.y2 = typeof y2 !== 'undefined' ? y2 : 0;

        this.clicked = false;
        var DRAG_THRESHOLD = 5;
        var MIN_SIZE = 30;
        var closeRadius = 7;
        var closeOffset = 10;

        var standardDirections = {
            NONE: 0,
            NORTH: 1,
            EAST: 2,
            SOUTH: 4,
            WEST: 8
        };

        this.dragDirections = {
            NONE: standardDirections.NONE,
            NORTH: standardDirections.NORTH,
            EAST: standardDirections.EAST,
            SOUTH: standardDirections.SOUTH,
            WEST: standardDirections.WEST,
            NORTH_EAST: standardDirections.NORTH | standardDirections.EAST,
            NORTH_WEST: standardDirections.NORTH | standardDirections.WEST,
            SOUTH_EAST: standardDirections.SOUTH | standardDirections.EAST,
            SOUTH_WEST: standardDirections.SOUTH | standardDirections.WEST
        };

        this.lastDragDirection = this.dragDirections.NONE;

        this.draw = function (canvas, background, rectangles) {
            var context = canvas.getContext("2d");

            context.beginPath();
            context.putImageData(background, 0, 0);
            context.stroke();
            context.closePath();

            if (rectangles) {
                rectangles.forEach(function (rectangle) {
                    drawRectangle(rectangle, context);
                });
            } else {
                drawRectangle(this, context);
            }
        };

        /**
         * Returns direction depending on mouse cursor position
         */
        this.getDragDirection = function (mouseX, mouseY) {
            var direction;
            if (this.clicked) {
                return this.lastDragDirection;
            } else if (this.isInside(mouseX, mouseY)) {
                if (Math.abs(mouseY - this.y1) < DRAG_THRESHOLD && Math.abs(mouseX - this.x1) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.NORTH_WEST;
                } else if (Math.abs(mouseY - this.y1) < DRAG_THRESHOLD && Math.abs(mouseX - this.x2) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.NORTH_EAST;
                } else if (Math.abs(mouseY - this.y2) < DRAG_THRESHOLD && Math.abs(mouseX - this.x1) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.SOUTH_WEST;
                } else if (Math.abs(mouseY - this.y2) < DRAG_THRESHOLD && Math.abs(mouseX - this.x2) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.SOUTH_EAST;
                } else if (Math.abs(mouseX - this.x1) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.EAST;
                } else if (Math.abs(mouseX - this.x2) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.WEST;
                } else if (Math.abs(mouseY - this.y1) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.NORTH;
                } else if (Math.abs(mouseY - this.y2) < DRAG_THRESHOLD) {
                    direction = this.dragDirections.SOUTH;
                } else {
                    direction = this.dragDirections.NONE;
                }
            }
            this.lastDragDirection = direction;
            return direction;
        };

        /**
         * Returns whether the mouse cursor is inside of this rectangle
         */
        this.isInside = function (mouseX, mouseY) {
            return (mouseX > this.x1 - DRAG_THRESHOLD
                && mouseX < this.x2 + DRAG_THRESHOLD
                && mouseY > this.y1 - DRAG_THRESHOLD
                && mouseY < this.y2 + DRAG_THRESHOLD) || this.isCloseHovered(mouseX, mouseY);
        };

        /**
         * Resizes this rectangle depending on drag direction
         */
        this.resize = function (mouseX, mouseY) {
            switch (this.getDragDirection(mouseX, mouseY)) {
                case this.dragDirections.NORTH_WEST:
                    this.resizeNorth(mouseY);
                    this.resizeEast(mouseX);
                    break;
                case this.dragDirections.NORTH_EAST:
                    this.resizeNorth(mouseY);
                    this.resizeWest(mouseX);
                    break;
                case this.dragDirections.SOUTH_WEST:
                    this.resizeSouth(mouseY);
                    this.resizeEast(mouseX);
                    break;
                case this.dragDirections.SOUTH_EAST:
                    this.resizeSouth(mouseY);
                    this.resizeWest(mouseX);
                    break;
                case this.dragDirections.NORTH:
                    this.resizeNorth(mouseY);
                    break;
                case this.dragDirections.SOUTH:
                    this.resizeSouth(mouseY);
                    break;
                case this.dragDirections.WEST:
                    this.resizeWest(mouseX);
                    break;
                case this.dragDirections.EAST:
                    this.resizeEast(mouseX);
                    break;
            }
        };

        this.resizeNorth = function (mouseY) {
            var newHeight = this.y2 - mouseY;
            if (newHeight > MIN_SIZE) {
                this.y1 = mouseY;
            }
        };

        this.resizeSouth = function (mouseY) {
            var newHeight = mouseY - this.y1;
            if (newHeight > MIN_SIZE) {
                this.y2 = mouseY;
            }
        };

        this.resizeWest = function (mouseX) {
            var newWidth = mouseX - this.x1;
            if (newWidth > MIN_SIZE) {
                this.x2 = mouseX;
            }
        };

        this.resizeEast = function (mouseX) {
            var newWidth = this.x2 - mouseX;
            if (newWidth > MIN_SIZE) {
                this.x1 = mouseX;
            }
        };

        function drawRectangle(rectangle, context) {
            context.fillStyle = "#FF0000";
            context.strokeStyle = "#000000";
            context.globalAlpha = 0.3;
            var width = rectangle.x2 - rectangle.x1;
            var height = rectangle.y2 - rectangle.y1;
            context.fillRect(rectangle.x1, rectangle.y1, width, height);
            context.globalAlpha = 1.0;
            context.rect(rectangle.x1, rectangle.y1, width, height);
            context.stroke();
            context.closePath();
            drawCircle(rectangle.x1 + width / 2, rectangle.y1, 4, "#0FA3B1", context);
            drawCircle(rectangle.x1 + width / 2, rectangle.y2, 4, "#0FA3B1", context);
            drawCircle(rectangle.x1, rectangle.y1 + height / 2, 4, "#0FA3B1", context);
            drawCircle(rectangle.x2, rectangle.y1 + height / 2, 4, "#0FA3B1", context);

            drawClose(context, rectangle);

        }

        function drawCircle(x, y, r, color, context) {
            context.beginPath();
            context.arc(x, y, r, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
            context.stroke();
            context.closePath();
        }

        function drawClose(context, rectangle) {
            context.globalAlpha = 0.3;
            context.beginPath();
            context.arc(rectangle.x2 + closeOffset, rectangle.y1 - closeOffset, closeRadius, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1.0;
            context.moveTo(rectangle.x2 + closeOffset - closeRadius / 2, rectangle.y1 - closeOffset - closeRadius / 2);
            context.lineTo(rectangle.x2 + closeOffset + closeRadius / 2, rectangle.y1 - closeOffset + closeRadius / 2);
            context.moveTo(rectangle.x2 + closeOffset - closeRadius / 2, rectangle.y1 - closeOffset + closeRadius / 2);
            context.lineTo(rectangle.x2 + closeOffset + closeRadius / 2, rectangle.y1 - closeOffset - closeRadius / 2);
            context.stroke();
            context.closePath();
        }

        this.isCloseHovered = function (x, y) {
            return Math.pow(x - (this.x2 + closeOffset), 2) + Math.pow(y - (this.y1 - closeOffset), 2) <= closeRadius * 3;
        }
    }




    return Rectangle;
});