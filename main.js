// @ts-check

// ================================================================================
// Types and functions
// ================================================================================

/**
 * Directly goes to a specific level
 * @param {number} level The level to go to
 */
function goToLevel(level) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('level', level.toString());
    window.location.search = urlParams.toString();
}

class Vector {
    /**
     * @param {number} x The x-coordinate of the point
     * @param {number} y The y-coordinate of the point
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.overlapsAny = false;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    /**
     * Adds another vector to this vector
     * @param {Vector} other The other vector to add to this vector
     * @return {Vector} The result of the addition
     */
    add(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    /**
     * Subtracts another vector from this vector
     * @param {Vector} other The other vector to subtract from this vector
     * @return {Vector} The result of the subtraction
     */
    subtract(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    /**
     * Calculates the distance between this vector and another vector
     * @param {Vector} other The other vector to calculate the distance to
     * @return {number} The distance between this vector and the other vector
     */
    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }

    /**
     * @param {Vector} other The other vector to compare with this vector
     * @return {boolean} True if the vectors are equal, false otherwise
     */
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Draws the point represented by this vector on the canvas
     * @param {CanvasDisplay} canvas The canvas context to draw on
     * @param {boolean} isSelected Whether the point is currently selected
     */
    draw(canvas, isSelected) {
        let fillColor;
        if (this.overlapsAny) {
            fillColor = isSelected ? '#AA3333' : '#FF5555';
        } else {
            fillColor = isSelected ? '#AAAAAA' : '#FFFFFF';
        }
        canvas.drawCircle(this, POINT_RADIUS, fillColor);
    }
}

class Line {
    /**
     * @param {State} state The game state containing the points
     * @param {number} start The index of the starting point in the points array
     * @param {number} end The index of the ending point in the points array
     */
    constructor(state, start, end) {
        this.state = state;
        this.start = start;
        this.end = end;
        this.intersectsAny = false;
    }

    /**
     * @return {Vector} The vector representation of the line
     */
    toVector() {
        return this.state.points[this.end].subtract(this.state.points[this.start]);
    }

    /**
     * Draws the line on the canvas
     * @param {CanvasDisplay} canvas The canvas context to draw on
     */
    draw(canvas) {
        const color = this.intersectsAny ? 'red' : 'green';
        canvas.drawLine(this.state.points[this.start], this.state.points[this.end], LINE_WIDTH, color);
    }

    /**
     * Checks if this line is identical to another line with regards to the points it connects
     * @param {Line} other The other line to compare with this line
     * @returns {boolean} True if the lines connect the same points (regardless of order), false otherwise
     */
    equals(other) {
        return (this.start === other.start && this.end === other.end) || (this.start === other.end && this.end === other.start);
    }

    /**
     * Checks if two lines intersect
     * @param {Line} other The other line to check for intersection
     * @return {boolean} True if the lines intersect, false otherwise
     */
    intersects(other) {
        if (this.start === other.start || this.start === other.end || this.end === other.start || this.end === other.end) {
            return false; // Lines share a point, so they don't intersect
        }
        const pa1 = this.state.points[this.start];
        const pa2 = this.state.points[this.end];
        const pb1 = this.state.points[other.start];
        const pb2 = this.state.points[other.end];
        if (pa1.equals(pb1) || pa1.equals(pb2) || pa2.equals(pb1) || pa2.equals(pb2)) {
            return true; // Non-identical points are on top of each other, so they intersect
        }

        const v1 = this.toVector();
        const v2 = other.toVector();

        const cross = v1.x * v2.y - v1.y * v2.x;
        if (cross === 0) {
            return false; // Lines are parallel, so they don't intersect
        }

        const t = ((pb1.x - pa1.x) * v2.y - (pb1.y - pa1.y) * v2.x) / cross;
        const u = ((pb1.x - pa1.x) * v1.y - (pb1.y - pa1.y) * v1.x) / cross;

        return t > 0 && t < 1 && u > 0 && u < 1; // Lines intersect if t and u are between 0 and 1
    }
}

class CanvasDisplay {
    /**
     * Creates a new canvas display
     * @param {HTMLCanvasElement} canvas 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (this.ctx === null) {
            throw new Error('Failed to get canvas context');
        }
        this.width = width;
        this.height = height;

        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Clears the canvas by filling it with black
     */
    clear() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draws a line on the canvas
     * @param {Vector} start The starting point of the line
     * @param {Vector} end The ending point of the line
     * @param {number} width The width of the line
     * @param {string} color The color of the line
     */
    drawLine(start, end, width, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    /**
     * Draws a circle on the canvas
     * @param {Vector} center The center of the circle
     * @param {number} radius The radius of the circle
     * @param {string} color The color of the circles
     */
    drawCircle(center, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * Registers event handlers for mouse and touch input on the canvas
     * @param {(mousePos: Vector) => void} onMouseDown The handler for mouse down events
     * @param {(mousePos: Vector) => void} onMouseMove The handler for mouse move events
     * @param {() => void} onMouseUp The handler for mouse up events
     */
    registerEventHandlers(onMouseDown, onMouseMove, onMouseUp) {
        this.canvas.addEventListener('mousedown', event => onMouseDown(new Vector(event.clientX, event.clientY)));
        this.canvas.addEventListener('mousemove', event => onMouseMove(new Vector(event.clientX, event.clientY)));
        this.canvas.addEventListener('mouseup', () => onMouseUp());
        this.canvas.addEventListener('mouseleave', () => onMouseUp());

        this.canvas.addEventListener('touchstart', event => {
            event.preventDefault();
            const touchPos = this.getSingleTouchPos(event);
            if (touchPos !== null) {
                onMouseDown(touchPos);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', event => {
            event.preventDefault();
            const touchPos = this.getSingleTouchPos(event);
            if (touchPos !== null) {
                onMouseMove(touchPos);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => onMouseUp());
        this.canvas.addEventListener('touchcancel', () => onMouseUp());

    }

    /**
     * Converts a single touch input to a canvas-local position.
     * @param {TouchEvent} event The touch event to read the position from
     * @returns {Vector | null} The touch position, or null for no touch/multi-touch
     */
    getSingleTouchPos(event) {
        if (event.touches.length !== 1) {
            return null;
        }

        const touch = event.touches[0];
        return new Vector(touch.clientX, touch.clientY);
    }

}

class State {
    /**
     * Creates a new (empty) game state
     * @param {number} level The current level of the game
     * @param {CanvasDisplay} canvasDisplay The screen to draw the game on
     * @param {HTMLButtonElement} resetButton The button to reset the current level
     * @param {HTMLButtonElement} secondActionButton The button to show solution or go to the next level
     */
    constructor(level, canvasDisplay, resetButton, secondActionButton) {
        this.level = level;
        this.canvasDisplay = canvasDisplay;
        this.resetButton = resetButton;
        this.secondActionButton = secondActionButton;

        /**
         * The array of points in the game
         * @type {Vector[]}
         */
        this.points = [];

        /**
         * The array of lines in the game
         * @type {Line[]}
         */
        this.lines = [];

        /**
         * The index of the currently selected point, or null if no point is selected
         * @type {number | null}
         */
        this.selectedPointIndex = null;

        /**
         * The offset of the mouse relative to the selected point when it was selected, or null if no point is selected
         * @type {Vector | null}
         */
        this.mouseOffset = null;

        /**
         * Flag indicating whether the current level is solved (i.e. no lines intersect)
         * @type {boolean}
         */
        this.isSolved = false;

        /**
         * Flag indicating whether the player chose to stay on the current level after solving it
         * @type {boolean}
         */
        this.choseToStay = false;

        /**
         * The original generated solution points
         * @type {Vector[]}
         */
        this.solutionPoints = [];

        /**
         * The initial starting state of the points after shuffling
         * @type {Vector[]}
         */
        this.shuffledPoints = [];

        this.canvasDisplay.registerEventHandlers(
            this.onMouseDown.bind(this),
            this.onMouseMove.bind(this),
            this.onMouseUp.bind(this)
        );

        this.resetButton.addEventListener('click', () => this.reset());
        this.secondActionButton.addEventListener('click', () => {
            if (this.choseToStay) {
                this.nextLevel();
            } else {
                this.points = this.solutionPoints.map(point => point.clone());
                this.updateIntersections();
                this.draw();
            }
        });

        // Start with 4 points and increase at a rate that is slower than linear
        this.numPoints = 4 + Math.floor(Math.sqrt(this.level));
    }

    generate() {
        let attempts = 0;
        while (!this.tryCreateLines()) {
            if (++attempts > 10) {
                alert('Failed to generate level, please refresh the page to try again');
                throw new Error('Failed to generate level after 10 attempts');
            }
        }
        console.log(`Generated level ${this.level} with ${this.points.length} points and ${this.lines.length} lines after ${attempts} attempts`);

        this.draw();
    }

    reset() {
        this.points = this.shuffledPoints.map(point => point.clone());
        this.updateIntersections();
        this.draw();
    }

    /**
     * Updates the intersectsAny property all lines
     */
    updateIntersections() {
        for (const point of this.points) {
            point.overlapsAny = false;
        }
        for (const line of this.lines) {
            line.intersectsAny = false;
        }

        this.isSolved = true;

        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                if (this.points[i].distanceTo(this.points[j]) < 2 * POINT_RADIUS) {
                    this.points[i].overlapsAny = true;
                    this.points[j].overlapsAny = true;
                    this.isSolved = false;
                }
            }
        }

        for (let i = 0; i < this.lines.length; i++) {
            for (let j = i + 1; j < this.lines.length; j++) {
                if (this.lines[i].intersects(this.lines[j])) {
                    this.lines[i].intersectsAny = true;
                    this.lines[j].intersectsAny = true;
                    this.isSolved = false;
                }
            }
        }
    }

    /**
     * Draws the current state of the game
     */
    draw() {
        this.canvasDisplay.clear();

        for (const line of this.lines) {
            line.draw(this.canvasDisplay);
        }

        for (let i = 0; i < this.points.length; i++) {
            this.points[i].draw(this.canvasDisplay, i === this.selectedPointIndex);
        }
    }


    /**
     * Attempts to generate a level
     * @returns {boolean} True if the level was generated successfully, false otherwise
     */
    tryCreateLines() {
        this.points = [];
        this.lines = [];

        let attempts = 0;
        while (this.points.length < this.numPoints) {
            // place the points randomly, but not too close to the edges
            const x = (Math.random() * 0.8 + 0.1) * this.canvasDisplay.width;
            const y = (Math.random() * 0.8 + 0.1) * this.canvasDisplay.height;
            const point = new Vector(x, y);

            if (this.points.some(existingPoint => point.distanceTo(existingPoint) < 3 * POINT_RADIUS)) {
                if (++attempts > 1000) {
                    console.error('Failed to generate points after 1000 attempts');
                    return false;
                }
                continue;
            }

            this.points.push(point);
        }

        const lineAttempts = this.numPoints * this.numPoints; // Maximum number of lines is n*(n-1)/2, but we want to allow some failed attempts
        for (let i = 0; i < lineAttempts; i++) {
            const start = Math.floor(Math.random() * this.points.length);
            let end = Math.floor(Math.random() * (this.points.length - 1));
            if (end >= start) {
                end += 1; // Ensure end is different from start
            }

            const line = new Line(this, start, end);
            if (this.lines.some(existingLine => line.equals(existingLine) || line.intersects(existingLine))) {
                continue; // Line intersects an existing line, try again
            }
            this.lines.push(line);
        }

        console.log(`Generated ${this.points.length} points and ${this.lines.length} lines`);

        let numLinesPerPoint = new Array(this.points.length).fill(0);
        for (const line of this.lines) {
            numLinesPerPoint[line.start]++;
            numLinesPerPoint[line.end]++;
        }
        let lowestCount = Math.min(...numLinesPerPoint);
        if (lowestCount === 0) {
            console.error('Failed to generate lines: some points are not connected');
            return false;
        }

        this.solutionPoints = this.points.map(point => point.clone());

        // shuffle points until the puzzle is not solved
        attempts = 0;
        while (true) {
            for (const point of this.points) {
                // place the points randomly, but not too close to the edges
                point.x = (Math.random() * 0.8 + 0.1) * this.canvasDisplay.width;
                point.y = (Math.random() * 0.8 + 0.1) * this.canvasDisplay.height;
            }
            this.updateIntersections();

            if (this.points.some(point => point.overlapsAny)) {
                continue; // Some points are on top of each other, try again
            }
            if (this.lines.some(line => line.intersectsAny)) {
                break; // Some lines intersect, we can use this level
            }

            if (++attempts > 1000) {
                console.error('Failed to shuffle points after 1000 attempts');
                return false;
            }
        }

        this.shuffledPoints = this.points.map(point => point.clone());

        return true;
    }

    /**
     * Handles mouse down events on the canvas
     * @param {Vector} mousePos The position of the mouse when the button was pressed
     */
    onMouseDown(mousePos) {
        let closestPointIndex = null;
        let closestDistance = 2 * POINT_RADIUS;
        for (let i = 0; i < this.points.length; i++) {
            const distance = mousePos.distanceTo(this.points[i]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPointIndex = i;
            }
        }
        if (closestPointIndex !== null) {
            this.selectedPointIndex = closestPointIndex;
            this.mouseOffset = this.points[closestPointIndex].subtract(mousePos);
        } else {
            this.selectedPointIndex = null;
            this.mouseOffset = null;
        }
        this.draw();
    }

    /**
     * Handles mouse move events on the canvas
     * @param {Vector} mousePos The position of the mouse when it is moved
     */
    onMouseMove(mousePos) {
        if (this.selectedPointIndex === null || this.mouseOffset === null) {
            return;
        }

        this.points[this.selectedPointIndex] = mousePos.add(this.mouseOffset);

        this.updateIntersections();
        this.draw();
    }

    /**
     * Handles mouse up events on the canvas
     */
    onMouseUp() {
        if (this.selectedPointIndex === null) {
            return;
        }

        this.selectedPointIndex = null;
        this.mouseOffset = null;
        this.draw();

        if (this.isSolved && !this.choseToStay) {
            const shouldAdvance = confirm('Congratulations, you solved the puzzle! 🎉\n\nGo to the next level?');
            if (shouldAdvance) {
                this.nextLevel();
            } else {
                this.choseToStay = true;
                this.secondActionButton.textContent = 'Next Level';
            }
        }
    }

    /**
     * Advances to the next level
     */
    nextLevel() {
        goToLevel(this.level + 1);
    }
}

// ================================================================================
// Initialization
// ================================================================================

const CANVAS_WIDTH = Math.max(200, window.innerWidth);
const CANVAS_HEIGHT = Math.max(200, window.innerHeight);

const TARGET_SIZE = Math.sqrt(CANVAS_WIDTH * CANVAS_HEIGHT); // geometric mean of width and height to account for skewed aspect ratios
const LINE_WIDTH = TARGET_SIZE / 60;
const POINT_RADIUS = TARGET_SIZE / 30;

const canvas = document.getElementById('gameCanvas');
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element not found');
}

const resetButton = document.getElementById('ResetButton');
if (!(resetButton instanceof HTMLButtonElement)) {
    throw new Error('Reset button element not found');
}

const secondActionButton = document.getElementById('SecondActionButton');
if (!(secondActionButton instanceof HTMLButtonElement)) {
    throw new Error('Second action button element not found');
}

const canvasDisplay = new CanvasDisplay(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);

// get current level from URL ("...?level=1")
const urlParams = new URLSearchParams(window.location.search);
const rawLevel = urlParams.get('level') || '1';
const level = parseInt(rawLevel, 10);

if (level <= 0 || isNaN(level)) {
    alert('Invalid level number in URL, going to level 1');
    goToLevel(1);
} else {
    console.log(`Current level: ${level}`);

    const state = new State(level, canvasDisplay, resetButton, secondActionButton);
    state.generate();
}
