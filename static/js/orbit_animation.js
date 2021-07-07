const framerate = 60
const trail_length = 200
const trail_radius = 10
const simulate_D_P_S = 30

let center = [0, 0]
let scale = 70

const EARTH_MASS = 3.00273e-6
const AU_TO_METER = 1.496e+11
const SOLARMASS_TO_KG = 1.989e+30
const EARTHMASS_TO_KG = 5.972e+24
const D_TO_S = 86400
const G_AU = 39.478
const G = 6.674e-11

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
    constructor(name, mass, init_pos, init_vel, plMajorAxis, plMinorAxis, focusOffset, isCenter, size_multi) {
        this.name = name;
        this.mass = mass;
        this.position = init_pos;
        this.velocity = init_vel;
        this.acceleration = new v3(0, 0, 0);
        this.size_multi = size_multi;
        this.plMajorAxis = plMajorAxis,
        this.plMinorAxis = plMinorAxis,
        this.focusOffset = focusOffset
        this.isCenter = isCenter

        this.positions = []
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

            let pos = this.positions[i]
            let x = width/2 + ((pos.x) * scale)
            let y = height/2 + ((pos.y) * scale)
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

        ctx.fillText(this.name,
            width/2 + (this.position.x - center[0]) * scale + trail_radius * 2,
            height/2 + (this.position.y - center[1]) * scale + trail_radius/2)
        ctx.beginPath()
        ctx.ellipse(width/2, height/2 + this.focusOffset * scale, this.plMinorAxis * scale, this.plMajorAxis * scale, 0, 0, 2*Math.PI)
        ctx.strokeStyle = 'rgb(255, 140, 140)'
        ctx.setLineDash([25, 25])
        ctx.stroke()
    }

    setPosition(newV3) {
        this.position = newV3

        if (this.isCenter) {
            center = [this.position.x, this.position.y]
        }

        this.positions.push(this.position.sub(new v3(center[0], center[1], 0)))

        // log position for trail
        if (this.positions.length > trail_length) {
            this.positions.shift()
        }
    }
}

class nBodySimulation {
    constructor(dt, softeningConstraint, masses) {
        this.dt = dt
        this.softeningConstraint = softeningConstraint

        this.masses = masses
    }

    updatePositionVectors() {
        for (let i = 0; i < this.masses.length; i++) {
            const mass = this.masses[i]

            mass.setPosition(mass.position.add(mass.velocity.mul(this.dt)))
            // mass.position = mass.position.add(mass.velocity.mul(this.dt))
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

                    const u = diff.mul(G * (massB.mass))
                    const force = u.div(d2 * Math.sqrt(d2 + this.softeningConstraint))
                    // const u = G*(massA.mass * massB.mass)
                    // const force = diff.mul(u).div(d2 * Math.sqrt(d2 + this.softeningConstraint))
                    accel = accel.add(force)
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

    const star_mass = Number(systemPlanets[0]["st_mass"]) * SOLARMASS_TO_KG
    masses = [
        new mass(
            canvas.dataset.hostname,
            star_mass,
            new v3(0, 0, 0),
            new v3(0, 0, 0),
            0,
            0,
            0,
            true,
            1.5
        )
    ]
    // create star
    let maxAxis = 0
    // create planets
    for (i = 0; i < systemPlanets.length; i++) {
        const planetData = systemPlanets[i]

        const plMajorAxis = Number(planetData["pl_orbsmax"]) * AU_TO_METER
        const plMass = Number(planetData["pl_bmasse"]) * EARTHMASS_TO_KG
        const plEccen = Number(planetData["pl_orbeccen"])
        
        const plCalculatedMinor = Math.sqrt(plMajorAxis ** 2 * (1 - (plEccen ** 2)))
        const focusDist = Math.sqrt(plMajorAxis**2 - plCalculatedMinor**2)
        const initialDistance = plMajorAxis + focusDist
        
        const u = G * (plMass + star_mass)
        const plInitialVelocity = Math.sqrt(u * ((2/initialDistance) - (1/plMajorAxis))) // vis-viva equation
        console.log(initialDistance, plMajorAxis, u, ":", plInitialVelocity)

        masses.push(
            new mass(
                planetData["pl_name"],
                plMass,
                new v3(0, initialDistance, 0),
                new v3(plInitialVelocity, 0, 0),    // need to figure this out still
                plMajorAxis,
                plCalculatedMinor,
                focusDist,
                false,
                1
            )
        )
        maxAxis = Math.max(maxAxis, initialDistance*1.1)
    }
    scale = (height - trail_radius * 2) / maxAxis / 2
    console.log("Scale:", scale + "px/m")
    const simulation = new nBodySimulation(
        (simulate_D_P_S*D_TO_S)/framerate,  //seconds to simulate per step (1/60th of a second)
        0.15,        // softeningConstant,
        masses
    )

    function update() {
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        simulation.updatePositionVectors()
            .updateAccelerationVectors()
            .updateVelocityVectors()

        if (ctx) {
            for (var i = 0; i < simulation.masses.length; i++) {
                simulation.masses[i].draw(ctx, canvas.width, canvas.height)
            }
        }
    }

    let id = null
    let current = 0
    clearInterval(id)
    id = setInterval(update, (1 / framerate) * 1000)

    return simulation, id
}

function main() {
    let simulation, id = orbit_animation()
}

main()