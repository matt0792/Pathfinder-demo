let cols = 30;
let rows = 30;

let grid = []; // array of all grid points
let openSet = []; // array for unevaluated grid points
let closedSet = []; // array for completely evaluated grid points
let path = [];

let start;
let end;
let endX = 15;
let endY = 15;

let checkNumber = document.getElementById("checkNumber");
let pathNumber = document.getElementById("pathNumber");

// Manhattan Heuristic
function manhattan(position0, position1) {
  let d1 = Math.abs(position1.x - position0.x);
  let d2 = Math.abs(position1.y - position0.y);
  return d1 + d2;
}

// Euclidean Heuristic
function euclidean(position0, position1) {
  let dx = position1.x - position0.x;
  let dy = position1.y - position0.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Chebyshev Heuristic
function chebyshev(position0, position1) {
  let dx = Math.abs(position1.x - position0.x);
  let dy = Math.abs(position1.y - position0.y);
  return Math.max(dx, dy);
}

// sinusodial
function sinusoidal(position0, position1) {
  let dx = position1.x - position0.x;
  let dy = position1.y - position0.y;
  return Math.sin(dx + dy) * 100; 
}

// mandelbrot
function fractal(position0, position1) {
  const a = 3; // X-axis frequency
  const b = 2; // Y-axis frequency
  const delta = Math.PI / 2; // Phase shift

  let dx = Math.abs(position1.x - position0.x);
  let dy = Math.abs(position1.y - position0.y);

  // Lissajous equation on dx and dy
  let distance = Math.abs(Math.sin(a * dx + delta) + Math.cos(b * dy));
  return distance * 50; 
}

// random heuristic
function random(position0, position1) {
  return Math.random() * 100000;
}

// longest path
function longestPath(position0, position1) {
  const dx = position1.x - position0.x;
  const dy = position1.y - position0.y;

  let distance = Math.sqrt(dx * dx + dy * dy);

  // Invert the distance to penalize closer positions
  return -distance; 
}


let selectedHeuristic = manhattan; 

// Listen for changes in the heuristic selection dropdown
document
  .getElementById("heuristicSelect")
  .addEventListener("change", function (e) {
    switch (e.target.value) {
      case "manhattan":
        selectedHeuristic = manhattan;
        break;
      case "euclidean":
        selectedHeuristic = euclidean;
        break;
      case "chebyshev":
        selectedHeuristic = chebyshev;
        break;
      case "random":
        selectedHeuristic = random;
        break;
      case "sinusoidal":
        selectedHeuristic = sinusoidal;
        break;
      case "fractal":
        selectedHeuristic = fractal;
        break;
      case "longestPath":
        selectedHeuristic = longestPath;
        break;
    }
    // Re-run the pathfinding algorithm after changing the heuristic
    displayGrid(search());
  });

// Heuristic
function heuristic(position0, position1) {
  return selectedHeuristic(position0, position1);
}

// Constructor function for grid points
function GridPoint(x, y) {
  this.x = x;
  this.y = y;
  this.f = 0;
  this.g = 0;
  this.h = 0;
  this.isObstacle = false; // New property
  this.neighbors = [];
  this.parent = undefined;

  this.updateNeighbors = function (grid) {
    let i = this.x;
    let j = this.y;
    this.neighbors = []; // Reset neighbors each time to prevent duplication
    if (i < cols - 1 && !grid[i + 1][j].isObstacle)
      this.neighbors.push(grid[i + 1][j]);
    if (i > 0 && !grid[i - 1][j].isObstacle)
      this.neighbors.push(grid[i - 1][j]);
    if (j < rows - 1 && !grid[i][j + 1].isObstacle)
      this.neighbors.push(grid[i][j + 1]);
    if (j > 0 && !grid[i][j - 1].isObstacle)
      this.neighbors.push(grid[i][j - 1]);
  };
}

// Initialize the grid
function initGrid() {
  grid = Array.from({ length: cols }, () => Array(rows).fill(null));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new GridPoint(i, j);
    }
  }

  // Initialize neighbors based on the grid size
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].updateNeighbors(grid);
    }
  }

  start = grid[0][0];
  end = grid[endX][endY];
}

// A* search algorithm
function search() {
  // Reset global variables
  openSet = [];
  closedSet = [];
  path = [];

  openSet.push(start);

  while (openSet.length > 0) {
    let lowestIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i;
    }
    let current = openSet[lowestIndex];

    if (current === end) {
      let temp = current;
      path.push(temp);
      while (temp.parent) {
        path.push(temp.parent);
        temp = temp.parent;
      }
      checkNumber.textContent = closedSet.length;
      pathNumber.textContent = path.length;
      return path.reverse();
    }

    openSet.splice(lowestIndex, 1);
    closedSet.push(current);

    for (let neighbor of current.neighbors) {
      if (!closedSet.includes(neighbor) && !neighbor.isObstacle) {
        // Skip obstacles
        let tentativeG = current.g + 1;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, end);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
      }
    }
  }
  return []; // No solution found
}

// Display the grid
function displayGrid(searchPath) {
  gridContainer.innerHTML = "";

  const pointMap = new Map(searchPath.map((p) => [`${p.x},${p.y}`, p]));
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 20px)`;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dot = document.createElement("div");
      dot.classList.add("point");

      const key = `${x},${y}`;
      if (pointMap.has(key)) dot.classList.add("correct");
      if (grid[x][y].isObstacle) dot.classList.add("obstacle"); 

      dot.dataset.x = x; // coordinates for event handling
      dot.dataset.y = y;
      gridContainer.appendChild(dot);
    }
  }
}

// Slider inputs
let columnSlider = document.getElementById("columnRange");
let rowSlider = document.getElementById("rowRange");
let endXSlider = document.getElementById("endX");
let endYSlider = document.getElementById("endY");
let gridContainer = document.getElementById("grid");

// columnSlider.oninput = function () {
//   cols = parseInt(this.value, 10);
//   initGrid(); 
//   displayGrid(search());
// };
// rowSlider.oninput = function () {
//   rows = parseInt(this.value, 10);
//   initGrid(); 
//   displayGrid(search());
// };
endXSlider.oninput = function () {
  endX = parseInt(this.value, 10);
  end = grid[endX][endY];
  displayGrid(search());
};

endYSlider.oninput = function () {
  endY = parseInt(this.value, 10);
  end = grid[endX][endY];
  displayGrid(search());
};

// Initialize
initGrid();
displayGrid(search());

let isMouseDown = false; 

// mouse down event to start dragging obstacles
gridContainer.addEventListener("mousedown", (e) => {
  const dot = e.target;
  if (dot.classList.contains("point")) {
    const x = parseInt(dot.dataset.x, 10);
    const y = parseInt(dot.dataset.y, 10);
    const gridPoint = grid[x][y];

    if (gridPoint === start || gridPoint === end) return; 

    // Toggle obstacle state
    gridPoint.isObstacle = !gridPoint.isObstacle;
    isMouseDown = true; 

    const path = search();
    displayGrid(path);
  }
});

// mouse move event to add obstacles while dragging
gridContainer.addEventListener("mousemove", (e) => {
  if (isMouseDown) {
    const dot = e.target;
    if (dot.classList.contains("point")) {
      const x = parseInt(dot.dataset.x, 10);
      const y = parseInt(dot.dataset.y, 10);
      const gridPoint = grid[x][y];

      if (gridPoint === start || gridPoint === end) return; 

      // Add obstacle only if it doesn't already have one
      if (!gridPoint.isObstacle) {
        gridPoint.isObstacle = true;
        const path = search(); 
        displayGrid(path);
      }
    }
  }
});

// mouse up event
gridContainer.addEventListener("mouseup", () => {
  isMouseDown = false; 
});

// mouse leave event
gridContainer.addEventListener("mouseleave", () => {
  isMouseDown = false; 
});