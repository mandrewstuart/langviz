import nlp

from starlette.applications import Starlette
from starlette.routing import Route
from starlette.responses import PlainTextResponse
from starlette.responses import Response
from starlette.responses import HTMLResponse
import logging
logging.getLogger('uvicorn').addHandler(logging.FileHandler('log.log'))
logging.getLogger('uvicorn.access').propagate = True



script = open('static/script.js', 'r').read()
chart_html = open('static/chart.html', 'r').read()
style_css = open('static/styles.css', 'r').read()


async def script_route(req):
    return Response(script, media_type='application/javascript')


async def chart_route(req):
    return HTMLResponse(chart_html)


async def style_route(req):
    return Response(style_css, media_type='text/css')


async def body_of_text_to_dimension_reduced_data(req):
    json = await req.json()
    text = json.get('text')
    num_clusters = int(json.get('numClusters'))
    num_clusters = min(20, num_clusters)
    num_clusters = max(2, num_clusters)
    sentences = nlp.split_to_sentences(text)
    vectors = nlp.vectorize_sentences(sentences)
    clusters = nlp.cluster(vectors, num_clusters)
    coordinates = nlp.reduce_dimension(vectors)
    data = nlp.assemble(sentences, clusters, coordinates)
    return PlainTextResponse(data)


app = Starlette(debug=True, routes=[
    Route('/', chart_route),
    Route('/script.js', script_route),
    Route('/styles.css', style_route),
    Route('/transform', body_of_text_to_dimension_reduced_data,
          methods=["POST"]),
])
