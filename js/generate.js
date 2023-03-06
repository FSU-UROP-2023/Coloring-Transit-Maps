// Output: one random rgb255 color
function randomColor()
{
    let c = [];
    c[0] = Math.random() * 1;
    c[1] = Math.random() * 1;
    c[2] = Math.random() * 1;
    return c;
}

// Check if the RGB255 color is within the given lightness bounds inside Oklab
function checkBrightness(color) 
{
    color = linToOk(color);
    if(color[0] > 0.22 && color[0] < 0.82)
    {
        return true;
    }
    return false;
}

// Input: positive integer n
// Output: n random colors in RGB255 that account for brightness
function randColors(n)
{
    let colors = [];
    for (let i = 0; i < n; i++) {
        let color = randomColor();
        while(!checkBrightness(color))
        {
            color = randomColor();
        }
        colors.push(color);
    }

    return colors;
}

//calculates distance between 2 colors in oklab
function calcDist(color1, color2) {
    let L = (color1[0] - color2[0]) ** 2;
    let a = (color1[1] - color2[1]) ** 2;
    let b = (color1[2] - color2[2]) ** 2;
    return Math.sqrt(L + a + b);
}

// calculates the minimum distance between any 2 points of a colorset
function minDist(colors) {
    let min = [];
    let mindist = calcDist([1, 0, 0], [0, 0, 0]); // distance between black and white
    for (let i = 0; i < colors.length - 1; i++) {
        for (let j = i + 1; j < colors.length; j++) {
            let dist = calcDist(colors[i], colors[j]);
            if (dist < mindist) {
                mindist = dist;
            }
        }
    }
    return mindist;

}


function genColors(n) { // generates n colors (cvd)
    let maxDist = 0;
    let colorSet = [[]];
    let newColors = [[]];

    for (let i = 0; i < 300; i++) {
        let colors = randColors(n)
        newColors = linToOkCvd(colors)
        let dist = minDist(newColors);
        if (dist > maxDist) {
            maxDist = dist;
            colorSet = colors;
        }
    }
    return colorSet;
}

// Reoptimize for normal vision after colorblind
function reOptimize(n) { 
    let colorSets = [genColors(n), genColors(n), genColors(n), genColors(n), genColors(n)]
    let bestSet = [[]];
    let maxDist = 0;

    for (let i = 0; i < colorSets.length; i++) {
        let newColors = [[]];
        for (let j = 0; j < n; j++) {
            newColors[j] = linToOk(colorSets[i][j]);
        }
        var dist = minDist(newColors);
        if (dist > maxDist) {
            maxDist = dist;
            bestSet = colorSets[i];
        }
    }
    // console.log(maxDist);
    // console.log(bestSet);

    return linToRgb255(bestSet);
}

// Inputs: a vector x in [0,1]^3 and a nonzero vector v in R^3
// Output: the pair [a,b] with a <= b
function intersectBox(x, v)
{
    let a = Number.NEGATIVE_INFINITY;
    let b = Number.POSITIVE_INFINITY;
    for (let i=0; i < 3; i++) {
        if (v[i] > 0) {
            a = Math.max(a,-x[i]/v[i]);
            b = Math.min(b,(1-x[i])/v[i]);
        } else if (v[i] < 0) {
            a = Math.max(a,1-x[i]/v[i]);
            b = Math.min(b,-x[i]/v[i]);
        } else {
            // do nothing
        }
        return [a,b]
    }

}

// Input: pair of numbers a, b with a <= b
// Output: random floating point number between a and b, inclusive
function getRandomArbitrary(a,b)
{
    return Math.random() * (b - a) + a;
}


function reOptimize2(n){
    v = [0.92205465, -0.38601957, 0.02835689];
    let colorSet = genColors(n);
    let newColorSet = []; 
    
    for (let i = 0; i < n; i++)
    {
        let shift = intersectBox(colorSet[i], v);
        console.log(shift.join(" "));
        rand = getRandomArbitrary(shift[0],shift[1]);
        console.log(rand);
        newColor = [colorSet[i][0] + (rand * v[0]), 
                    colorSet[i][1] + (rand * v[1]), 
                    colorSet[i][2] + (rand * v[2])];
        newColorSet.push(newColor);
    }
    console.log(newColorSet.join(" "));

    for(let i = 0; i < n; i++)
    {
        newColorSet[i] = linToRgb1(newColorSet[i]);
        newColorSet[i] = rgb1ToRgb255(newColorSet[i]);
    }

    return newColorSet; // linear color space
}

function grasp(m)
{
    // generate 100 random points
    let N = 100;
    let points = [];
    let pointsOk = [];
    for(let i = 0; i < N; i++)
    {
        color = randomColor();
        while(!checkBrightness(color))
        {
            color = randomColor();
        }
        points.push(color);
        pointsOk.push(linToOk(color));
    }
    
    // generate 2D array of all distances between points
    let distances = [];
    for(let i = 0; i < N; i++)
    {
        let d = [];
        for(let j = 0; j < N; j++)
        {
            d.push(calcDist(pointsOk[i], pointsOk[j]));
        }
        distances.push(d);
    }


    // randomly choose first point
    const point1_index = Math.floor(Math.random() * N);
    let subset = [];
    subset.push(points[point1_index]);

    // construction phase
    while(subset.length < m)
    {
        let bestScore = 0;
        let bestPoint = [];

        for(let i = 0; i < N; i++) // check all points not in subset
        {
            let currScore = 100;
            if(!subset.includes(points[i]))
            {
                for(let j = 0; j < subset.length; j++) // compare all subset poitns
                {
                    let ind = points.indexOf(subset[j]);
                    let dist = distances[ind][i];
                    if(dist < currScore)
                    {
                        currScore = dist; // get the smallest distance between any subset point and candidate point
                    }
                }
            }
            else
                currScore = 0; // if comparing the same point, then score := 0

            if(currScore > bestScore) // if the min distance of candidate point is the max
            {
                bestScore = currScore;
                bestPoint = points[i];
            }
        }
        subset.push(bestPoint);

    }
    console.log(subset);
    //pseudocode:
    //initialize a variable to remember the best score
    //variable to remember the point with the best score
    //loop through every remaining point in N
        //initialize a variable that contains the score
        //loop throught the subset
            //compare between the point in N with the point in subset
            //if the distance calculated is smaller than score, score = newDistance
        //if the score is bigger than the previous scores, remember it

}
graspInit(7);


//grasp(7);









//console.log(reOptimize2(7));