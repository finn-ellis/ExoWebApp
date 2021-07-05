const framerate = 60
const seconds = 10
const trail_length = 20
const trail_radius = 10
let scale = 70
const days_per_second = 30
const earth_mass = 3.00273e-6
const gravitational_constant = 39.478

class v3 {
    x = 0;
    y = 0;
    z = 0;
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    add(b) {
        return new v3(this.x + b.x, this.y + b.y, this.z + b.z)
    }

    sub(b) {
        return new v3(this.x - b.x, this.y - b.y, this.z - b.z)
    }

    mul(b) {
        if (typeof (b) == "number") {
            return new v3(this.x * b, this.y * b, this.z * b)
        } else {
            return new v3(this.x * b.x, this.y * b.y, this.z * b.z)
        }
    }

    div(b) {
        if (typeof (b) == "number") {
            return new v3(this.x / b, this.y / b, this.z / b)
        } else {
            return new v3(this.x / b.x, this.y / b.y, this.z / b.z)
        }
    }

    magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
    }

    unit() {
        return this.div(this.magnitude())
    }
}

class mass {
    constructor(name, mass, init_pos, init_vel, size_multi) {
        this.name = name;
        this.mass = mass;
        this.position = init_pos;
        this.velocity = init_vel;
        this.acceleration = new v3(0, 0, 0);
        this.size_multi = size_multi;

        this.positions = []
    }

    logPosition() {
        this.positions.push(this.position)

        if (this.positions.length > trail_length) {
            this.positions.shift()
        }
    }

    draw(ctx, width, height) {
        const positionsLen = this.positions.length
        for (let i = 0; i < positionsLen; i++) {
            let transparency = 0
            let circleScaleFactor = 0

            const scaleFactor = i / positionsLen

            if (i == positionsLen - 1) {
                transparency = 1
                circleScaleFactor = 1
            } else {
                transparency = scaleFactor / 2
                circleScaleFactor = scaleFactor
            }

            let x = width / 2 + this.positions[i].x * scale
            let y = height / 2 + this.positions[i].y * scale

            ctx.beginPath()
            ctx.arc(
                x,
                y,
                circleScaleFactor * trail_radius * this.size_multi,
                0,
                2 * Math.PI
            )
            ctx.fillStyle = `rgb(25, 25, 25, ${transparency})`
            ctx.fill()
        }

        ctx.fillText(this.name, width / 2 + this.position.x * scale + trail_radius * 2, height / 2 + this.position.y * scale + trail_radius / 2)
    }
}

class nBodySimulation {
    constructor(g, dt, softeningConstraint, masses) {
        this.g = g
        this.dt = dt
        this.softeningConstraint = softeningConstraint

        this.masses = masses
    }

    updatePositionVectors() {
        for (let i = 0; i < this.masses.length; i++) {
            const mass = this.masses[i]

            mass.position = mass.position.add(mass.velocity.mul(this.dt))
            mass.logPosition()
        }

        return this;
    }

    updateVelocityVectors() {
        for (let i = 0; i < this.masses.length; i++) {
            const mass = this.masses[i]

            mass.velocity = mass.velocity.add(mass.acceleration.mul(this.dt))
        }

        return this;
    }

    updateAccelerationVectors() {
        const numOfMasses = this.masses.length;

        for (let a = 0; a < numOfMasses; a++) {
            const massA = this.masses[a]
            let accel = new v3(0, 0, 0)

            for (let b = 0; b < numOfMasses; b++) {
                if (a !== b) {
                    const massB = this.masses[b]
                    // below could be optimized if performance is an issue
                    let diff = massB.position.sub(massA.position)
                    let distance = diff.magnitude()
                    let d2 = distance ** 2

                    const force = (this.g * massB.mass) / (d2 * Math.sqrt(d2 + this.softeningConstraint))
                    accel = accel.add(diff.mul(force))
                }
            }

            massA.acceleration = accel
        }

        return this;
    }
}

function orbit_animation() {
    const container = document.getElementById("orbit-animation-container")
    // const planet = document.getElementById("planet")
    // const star = document.getElementById("star")

    const width = container.offsetWidth
    const height = container.offsetHeight

    const canvas = document.getElementById("orbit-canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    ctx.font = "15px ubuntu"

    const systemPlanets = JSON.parse(canvas.dataset.system_planets)
    console.log("System planets:", systemPlanets)

    // earth and the sun
    // new mass(
    //     canvas.dataset.hostname,
    //     1,
    //     new v3(0, 0, 0),
    //     new v3(0, 0, 0)
    // ),
    // new mass(
    //     canvas.dataset.p_name,
    //     earth_mass,
    //     new v3(0.648778995445634, 0.747796691108466, -3.22953591923124e-5),
    //     new v3(-4.85085525059392, 4.09601538682312, -0.000258553333317722)
    // )
    masses = [
        new mass(
            canvas.dataset.hostname,
            Number(systemPlanets[0]["st_mass"]),
            new v3(0, 0, 0),
            new v3(0, 0, 0),
            1.5
        )
    ]
    // create star
    let maxAxis = 0
    // create planets
    for (i = 0; i < systemPlanets.length; i++) {
        const planetData = systemPlanets[i]
        const plMajorAxis = Number(planetData["pl_orbsmax"])
        const plMass = Number(planetData["pl_bmasse"]) * earth_mass // conversion to solar mass
        const plEccen = Number(planetData["pl_orbeccen"])
        const plAverageOrbitRadius = (plMajorAxis + Math.sqrt(plMajorAxis ** 2 * (1 - (plEccen ** 2)))) / 2
        let plYearLength = Number(planetData["pl_orbper"]) / 365.25
        if (plYearLength == 0) {
            plYearLength = 1
        }
        // const plInitialVelocity = 2*Math.PI*plAverageOrbitRadius/plYearLength    // ... derived from kepler's law?
        // console.log(plAverageOrbitRadius, plYearLength, plEccen, plInitialVelocity)

        // vis-viva equation isn't working for me. is my gravitational constant wrong? or one of the paramteres?
        const gParam = gravitational_constant * plMass
        // const plInitialVelocity = Math.sqrt(gParam * ((2/plMajorAxis) - (1/plMajorAxis))) // vis-viva equation
        const some_multiplier = 15  // i cannot figure out what this should be, but something isn't working with the equation below.
        const plInitialVelocity = Math.sqrt(gParam / plMajorAxis) * some_multiplier // simplified
        console.log(plMajorAxis, gParam, plInitialVelocity)

        masses.push(
            new mass(
                planetData["pl_name"],
                plMass,
                new v3(0, plMajorAxis, 0),
                new v3(plInitialVelocity, 0, 0),    // need to figure this out still
                1
            )
        )
        maxAxis = Math.max(maxAxis, plMajorAxis)
    }
    scale = (height - trail_radius * 2) / maxAxis / 2
    console.log("Scale:", scale + "px/au")
    const simulation = new nBodySimulation(
        gravitational_constant,
        days_per_second / 365.25 / framerate,
        0.15,        // softeningConstant,
        masses
    )

    let id = null
    let current = 0
    let max_frames = framerate * seconds
    clearInterval(id)
    id = setInterval(frame, (1 / framerate) * 1000)

    // function positionElement(element, x, y) {
    //     absX = width/2 + x*scale
    //     absY = height/2 + y*scale
    //     element.style.left = Math.floor(absX) + 'px'
    //     element.style.top = Math.floor(absY) + 'px'
    // }

    function update() {
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        simulation.updatePositionVectors()
            .updateAccelerationVectors()
            .updateVelocityVectors()

        // positionElement(star, simulation.masses[0].position.x, simulation.masses[0].position.y)
        // positionElement(planet, simulation.masses[1].position.x, simulation.masses[1].position.y)

        if (ctx) {
            for (var i = 0; i < simulation.masses.length; i++) {
                simulation.masses[i].draw(ctx, canvas.width, canvas.height)
            }
        }
    }

    function frame() {
        if (current >= max_frames) {
            // clearInterval(id)
            current = 0
        }

        current++
        let a = current / max_frames
        update(a)
    }
}

orbit_animation()