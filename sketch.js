// Settings:
const body_color = [132,222,2];     // Color of the snake in RGB
const apple_color = [255, 8, 0];    // Color of the apple in RGB
const background_color = [0, 0, 0]; // Color of the background in RGB
const game_cells = 17;      // Width and Height of the play grid
const start_speed = 7;      // Starting speed of the snake
const acceleration = 0.03;   // How much speed increases with each apple eaten


/** Object class of snake_cell
 *  +x : number
 *  +y : number
 *  +next : SnakeCell
 */
class SnakeCell {
    constructor(x, y, next) {
        this.x = x;         // x-pos of body cell
        this.y = y;         // y-pos of body cell
        this.next = next;   // reference to cell in front of this cell (like in Linked Lists)
    }
}

// Stores cells of the snake's body in dictionary (hash map)
// [x, y] -> SnakeCell
class SnakeBody {

    constructor() {
        this.body = {}
    }

    // Encodes x and y values to key
    encode(x, y) {
        return `${x}_${y}`
    }

    // Gets a SnakeCell at (x, y)
    // Returns undefined/null if not there
    get(x, y) {
        return this.body[this.encode(x, y)]
    }

    // Sets a SnakeCell (or technically anything) at (x, y)
    set(x, y, snake_cell) {
        this.body[this.encode(x, y)] = snake_cell;
    }

    // Removes a cell at (x, y)
    // Sets that value to undefined/null
    remove(x, y) {
        this.body[this.encode(x, y)] = undefined;
    }

    // Resets snake's body
    // Removes all elements from snake's body
    clear() {
        this.body = {}
    }
}

var canvas;
var holder;

// Current speed of the game
var speed = 7;

// snake_body stores all cells that belong to the cell body
// Initially it first two cells
var snake_body = new SnakeBody;

// Head and tail of the snake
var head;
var tail;

var apple_pos;  // Position of apple

var move_direction; // Current moving direction. Initially (0, 0) (not moving)

var size; // Size of the game screen (canvas) in pixels

// Places an apple randomly on the field
function placeApple() {
    var apple_x;
    var apple_y;

    while (true) {
        // Generates random spot for an apple
        apple_x = Math.floor(Math.random() * game_cells)
        apple_y = Math.floor(Math.random() * game_cells)
        
        // Prevents apple spawning on snake's body
        // If apple is to fall on snake's body, new location is generated
        if (snake_body.get(apple_x, apple_y)) {
            continue;
        }

        break;
    }

    apple_pos = [apple_x, apple_y]
}


// Sets game field to default values
function reset() {

    speed = start_speed;

    // Initial (x, y) coords where 2 initial cells will be placed
    // Located at the center
    const [x1, y1] = [Math.floor(game_cells / 2), Math.floor(game_cells / 2)]; // Center
    const [x2, y2] = [x1, y1 + 1];  // One below center

    // Constructs above coords into snake cell
    var init_cell_1 = new SnakeCell(x1, y1, null);
    var init_cell_2 = new SnakeCell(x2, y2, init_cell_1);

    // Removes all elements from snake_body after the last game
    snake_body.clear();

    // Puts newely constructed cells into snake's body
    snake_body.set(x1, y1, init_cell_1);
    snake_body.set(x2, y2, init_cell_2);

    // Initializes head and tail of the snake
    head = init_cell_1;
    tail = init_cell_2;

    // Prevents snake from moving until player starts playing
    // Initializes move direction as zero vector (moving nowhere)
    move_direction = [0, 0];

    placeApple();
}

// Resizes canvas so it fits perfectly on the screen
function updateCanvasSize() {
    size = holder.offsetHeight;
    resizeCanvas(size, size);
}

// Colors a cell at (x, y) in game coordinates (not pixel/canvas coordinates)
function color_cell(x, y, color) {
    cell_size = size / game_cells // Calculates size of the cell in pixels
    x *= cell_size;            // Calculates x-pos of the cell in pixels
    y *= cell_size;            // Calculates y-pos of the cell in pixels

    fill(...color)
    rect(x, y, cell_size)
}

// Draws snake's body and apples
function renderCells() {
    // Renders apples
    color_cell(...apple_pos, apple_color)

    // Renders snake's body
    var current_cell = tail;
    while(current_cell != null) {
        color_cell(current_cell.x, current_cell.y, body_color)
        current_cell = current_cell.next
    }
}

var last_successful_move = [0, 0]
function move_snake() {

    // Does not move if move direction is none
    if (move_direction[0] == 0 && move_direction[1] == 0) {
        return;
    }

    // Coordinate that snake is about to move to
    const new_x = head.x + move_direction[0];
    const new_y = head.y + move_direction[1];

    // Cell that the head will collide into
    // Undefined/null if none
    const colliding_cell = snake_body.get(new_x, new_y);

    if (colliding_cell) {

        // Prevents snake from turning back 180 degrees
        // Only allows left, right, forward movement
        if (colliding_cell.next == head) {
            move_direction = last_successful_move;
            move_snake();

        // Snake loses if it collides into itself and game resets
        } else {
            reset();
        }
        return;
    }

    // Snake loses if it got outside the playing grid
    if (new_x < 0 || new_x > game_cells - 1 || new_y < 0 || new_y > game_cells - 1) {
        reset();
        return;
    }


    // If snake moves eating an apple
    if (new_x == apple_pos[0] && new_y == apple_pos[1]) {
        const new_cell = new SnakeCell(new_x, new_y, null);
        snake_body.set(new_x, new_y, new_cell)
        head.next = new_cell;
        head = new_cell;
        placeApple();
        speed += acceleration;

    // If snake moves without eating an apple
    } else {
        snake_body.remove(tail.x, tail.y)

        var old_head = head;
        head = tail;
        head.x = new_x;
        head.y = new_y;
        tail = head.next
        head.next = null;
        old_head.next = head;
        
        snake_body.set(head.x, head.y, head)
    }

    last_successful_move = move_direction;
}


const key_direction = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
}

function keyPressed(event) {
    const key = event.key
    
    const new_direction = key_direction[key];

    if (new_direction == undefined) {
        return;
    }
    
    // Prevents snake from turning 180 degrees
    if (new_direction[0] == -move_direction[0] && new_direction[1] == -move_direction[1]) {
        return;
    }

    if (move_direction[0] == 0 && move_direction[1] == 0 && key == "ArrowDown") {
        return;
    }

    move_direction = key_direction[key];
}

function setup() {

    // Automatically resizes canvas to fit inside the sketch-holder
    holder = document.getElementById("sketch-holder")
    canvas = createCanvas(500, 500);
    canvas.parent("sketch-holder")
    updateCanvasSize();

    // Other setup here: ...
    frameRate(speed);
    reset();
    placeApple();
}

function draw() {
    background(...background_color);
    
    move_snake();
    renderCells();
    frameRate(speed);
}

// Automatically adjusts size of the canvas when window size changes
function windowResized() {
    updateCanvasSize()
}