// @ts-check

// ================================================================================
// Types and functions
// ================================================================================

class Vector {
    /**
     * @param {number} x The x-coordinate of the point
     * @param {number} y The y-coordinate of the point
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
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
     * @param {CanvasRenderingContext2D} ctx The canvas context to draw on
     * @param {boolean} isSelected Whether the point is currently selected
     */
    draw(ctx, isSelected) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'lightblue' : 'white';
        ctx.fill();
    }
}

class Line {
    /**
     * @param {Vector[]} points The array of points in the game
     * @param {number} start The index of the starting point in the this.points array
     * @param {number} end The index of the ending point in the this.points array
     */
    constructor(points, start, end) {
        this.points = points;
        this.start = start;
        this.end = end;
        this.intersectsAny = false;
    }

    /**
     * @return {Vector} The vector representation of the line
     */
    toVector() {
        return this.points[this.end].subtract(this.points[this.start]);
    }

    /**
     * Draws the line on the canvas
     * @param {CanvasRenderingContext2D} ctx The canvas context to draw on
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.points[this.start].x, this.points[this.start].y);
        ctx.lineTo(this.points[this.end].x, this.points[this.end].y);
        ctx.strokeStyle = this.intersectsAny ? 'red' : 'green';
        ctx.lineWidth = LINE_WIDTH;
        ctx.stroke();
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
        const pa1 = this.points[this.start];
        const pa2 = this.points[this.end];
        const pb1 = this.points[other.start];
        const pb2 = this.points[other.end];
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

    clear() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}

class State {
    /**
     * Creates a new (empty) game state
     * @param {CanvasDisplay} canvasDisplay The screen to draw the game on
     */
    constructor(canvasDisplay) {
        /**
         * The screen to draw the game on
         * @type {CanvasDisplay}
         */
        this.canvasDisplay = canvasDisplay;

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
         * Flag indicating whether the current level is solved (i.e. no lines intersect)
         * @type {boolean}
         */
        this.isSolved = false;

        /**
         * Flag indicating whether the player chose to stay on the current level after solving it
         * @type {boolean}
         */
        this.choseToStay = false;
    }

    /**
     * Updates the intersectsAny property all lines
     */
    updateIntersections() {
        for (const line of this.lines) {
            line.intersectsAny = false;
        }
        this.isSolved = true;
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
            line.draw(this.canvasDisplay.ctx);
        }

        for (let i = 0; i < this.points.length; i++) {
            this.points[i].draw(this.canvasDisplay.ctx, i === this.selectedPointIndex);
        }
    }


    /**
     * Attempts to generate a level
     * @param {number} numPoints The number of points to generate for the level
     * @returns {boolean} True if the level was generated successfully, false otherwise
     */
    generate(numPoints) {
        let attempts = 0;
        while (this.points.length < numPoints) {
            const point = new Vector(Math.random() * width, Math.random() * height);
            let tooClose = false;
            for (const existingPoint of this.points) {
                if (point.distanceTo(existingPoint) < 3 * POINT_RADIUS) {
                    tooClose = true;
                    break; // Point is too close to an existing point, try again
                }
            }
            if (tooClose) {
                if (++attempts > 1000) {
                    console.error('Failed to generate points after 1000 attempts');
                    return false;
                }
            } else {
                this.points.push(point);
            }
        }

        const lineAttempts = numPoints * numPoints; // Maximum number of lines is n*(n-1)/2, but we want to allow some failed attempts
        for (let i = 0; i < lineAttempts; i++) {
            const start = Math.floor(Math.random() * this.points.length);
            let end = Math.floor(Math.random() * (this.points.length - 1));
            if (end >= start) {
                end += 1; // Ensure end is different from start
            }

            const line = new Line(this.points, start, end);
            let intersectsExisting = false;
            for (const existingLine of this.lines) {
                if (line.intersects(existingLine)) {
                    intersectsExisting = true;
                    break;
                }
            }
            if (!intersectsExisting) {
                this.lines.push(line);
            }
        }

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

        // shuffle points until the puzzle is not solved
        attempts = 0;
        while (true) {
            for (const point of this.points) {
                // place the points randomly, but not too close to the edges
                point.x = (Math.random() * 0.8 + 0.1) * width;
                point.y = (Math.random() * 0.8 + 0.1) * height;
            }
            this.updateIntersections();
            if (!this.isSolved) {
                break; // Puzzle is not solved, we can use this level
            }
            if (++attempts > 1000) {
                console.error('Failed to shuffle points after 1000 attempts');
                return false;
            }
        }

        return true;
    }

    /**
     * Handles mouse down events on the canvas
     * @param {Vector} mousePos The position of the mouse when the button was pressed
     */
    onMouseDown(mousePos) {
        let closestPointIndex = null;
        let closestDistance = Infinity;
        for (let i = 0; i < this.points.length; i++) {
            const distance = mousePos.distanceTo(this.points[i]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPointIndex = i;
            }
        }
        if (closestDistance < 2 * POINT_RADIUS) {
            this.selectedPointIndex = closestPointIndex;
        }
    }

    /**
     * Handles mouse move events on the canvas
     * @param {Vector} mousePos The position of the mouse when it is moved
     */
    onMouseMove(mousePos) {
        if (this.selectedPointIndex === null) {
            return;
        }
        this.points[this.selectedPointIndex].x = mousePos.x;
        this.points[this.selectedPointIndex].y = mousePos.y;
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
        this.draw();

        if (!this.isSolved || this.choseToStay) {
            return;
        }

        const shouldAdvance = confirm('Congratulations, you solved the puzzle! 🎉\n\nGo to the next level?');
        if (!shouldAdvance) {
            this.choseToStay = true;
            return;
        }

        // Go to the next level by incrementing the "level" parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const nextLevel = level + 1;
        urlParams.set('level', nextLevel.toString());
        window.location.search = urlParams.toString();
    }
}

// ================================================================================
// Initialization
// ================================================================================

const width = Math.max(200, window.innerWidth);
const height = Math.max(200, window.innerHeight);
const LINE_WIDTH = width / 100;
const POINT_RADIUS = width / 50;

const canvas = document.getElementById('gameCanvas');
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element not found');
}

const canvasDisplay = new CanvasDisplay(canvas, width, height);
const state = new State(canvasDisplay);

// get current level from URL ("...?level=1")
const urlParams = new URLSearchParams(window.location.search);
const rawLevel = urlParams.get('level') || '1';
const level = parseInt(rawLevel) || 1;

console.log(`Current level: ${level}`);

// Start with 4 points and increase at a rate that is slower than linear
const numPoints = 4 + Math.floor(Math.sqrt(level));

let attempts = 0;
while (!state.generate(numPoints)) {
    console.log(`Attempt ${attempts + 1} to generate level failed`);
    if (++attempts > 10) {
        alert('Failed to generate level, please refresh the page to try again');
        throw new Error('Failed to generate level after 10 attempts');
    }
}

state.draw();

canvas.addEventListener('mousedown', (event) => {
    const mousePos = new Vector(event.offsetX, event.offsetY);
    state.onMouseDown(mousePos);
});

canvas.addEventListener('mousemove', (event) => {
    const mousePos = new Vector(event.offsetX, event.offsetY);
    state.onMouseMove(mousePos);
});

canvas.addEventListener('mouseup', () => {
    state.onMouseUp();
});
