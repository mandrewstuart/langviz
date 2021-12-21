from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import spacy


embedder = {'model': None}


def load_spacy(tries = 3):
    if tries == 0:
        raise Exception("Could load nor download en_core_web_lg model.")
    try:
        embedder['model'] = spacy.load("en_core_web_lg")
    except:
        spacy.cli.download("en_core_web_lg")
        load_spacy(tries - 1)


load_spacy()


def split_on_char(sentences, char):
    if type(sentences) is str:
        return sentences.split(char)
    elif type(sentences) is list:
        container = []
        for sentence in sentences:
            container += sentence.split(char)
        return container


def split_to_sentences(text):
    text = text.replace(',', '')
    text = text.replace('\n', '')
    chars = '.?!'
    for char in chars:
        text = split_on_char(text, char)
    while True:
        try:
            text.remove('')
        except:
            break
    return text


def get_embedding(text):
    return embedder['model'](text).vector


def vectorize_sentences(sentences):
    vectors = [get_embedding(sent) for sent in sentences]
    return vectors


def cluster(vectors, num_clusters=2):
    clusterer = KMeans(n_clusters=num_clusters)
    labels = clusterer.fit_predict(vectors)
    return labels


def reduce_dimension(vectors):
    reducer = PCA(n_components=2)
    coordinates = reducer.fit_transform(vectors)
    return coordinates


def assemble(sentences, clusters, coordinates):
    headers_in_data = ['X_coord', 'Y_coord', 'cluster_label', 'sentence']
    data = []
    for index in range(len(sentences)):
        data.append([
            float(coordinates[index][0]),
            float(coordinates[index][1]),
            int(clusters[index]),
            sentences[index]
        ])
    data = '\n'.join([str(line[0]) + "," + str(line[1]) + ',C' +
                     str(line[2]) + ',"' + line[3] + '"' for line in data])
    output = (','.join(headers_in_data) + '\n' + data)
    return output
