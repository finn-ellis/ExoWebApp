from flask import Flask, render_template, request, redirect
from exoplanetDataHandler import getSortedList, getSystemPlanets
from static.python.readables import readableLabels
import json

# need to find a way to gradually show planets. there are around 4,400 planets in the dataset
exoplanets = getSortedList()#[1:500]
systemPlanets = getSystemPlanets(exoplanets)

view_categories = ['pl_name',
    'hostname',
    'disc_year',
    'discoverymethod',
    'pl_orbper',
    'pl_orbsmax',
    'pl_orbeccen',
    'pl_rade',
    'pl_bmasse',
    'sy_dist',
    'st_metratio',
    'pl_refname',
    'st_refname']

search_categories = [
    ['pl_name'],
    ['hostname'],
    ['disc_year'],
    ['discoverymethod'],
    ['pl_bmasse']
]

for category in search_categories:
    category.append(readableLabels[category[0]])

def get_view_info(exoplanet):
    """Returns list of viewable info for exoplanet"""
    view_info = []
    for category in view_categories:
        name = readableLabels[category]
        data = exoplanet[category]
        if data=='':
            data = "No Data"
        view_info.append([name, data])
    return view_info

def create_app():
    """Returns created flask app"""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
    )

    @app.route('/')
    def home():
        return render_template('home.html')

    @app.route('/about')
    def about():
        return render_template('about.html')

    @app.route('/explore')
    def explore():
        if len(request.args) > 0:
            # search planets
            formData = request.args
            filtered_planets = []
            
            for planet in exoplanets:
                add = True
                for category in search_categories:
                    key = category[0]
                    expected = formData[key]
                    value = str(planet[key])
                    if expected != "" and value != "":
                        min_len = min(len(value), len(expected))
                        if (value != expected) and (value[:min_len].lower() != expected[:min_len].lower()):
                            add = False
                            break
                if add:
                    filtered_planets.append(planet)
            return render_template('explore.html', exoplanets=filtered_planets)
        else:
            return render_template('explore.html', exoplanets=exoplanets)
        
    @app.route('/explore/planet/<int:pl_id>')
    def explore_specific(pl_id):
        exoplanet = exoplanets[pl_id]
        view_info = get_view_info(exoplanet)
        return render_template('explore.html',
            exoplanets=exoplanets,
            exoplanet=exoplanet,
            view_info=view_info)

    @app.route('/search')
    def search_planets():
        return render_template('search_planets.html',
                exoplanets=exoplanets,
                search_categories=search_categories)
            

    @app.route('/viewplanet/<int:pl_id>')
    def viewplanet(pl_id):
        exoplanet = exoplanets[pl_id]
        view_info = get_view_info(exoplanet)
        planets_in_system = systemPlanets[exoplanet['hostname']]
        planet_list = []
        for planet_id in planets_in_system:
            planet_list.append(exoplanets[planet_id])
        planet_list = json.dumps(planet_list)
        return render_template('viewplanet.html',
            exoplanet=exoplanet,
            view_info=view_info,
            system_planets=planet_list)

    return app

app = create_app()
app.run()