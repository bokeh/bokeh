"""Compare clustering algorithms on generated datasets."""

# Standard library imports
from pathlib import Path

# External imports
import numpy as np
from sklearn import cluster, datasets
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, Select, Slider
from bokeh.palettes import Spectral6
from bokeh.plotting import figure
# Bokeh imports
from bokeh.server.asgi import BokehASGI
from bokeh.themes import Theme


def modify_document(doc):
    rng = np.random.RandomState(0)
    doc.theme = Theme(filename=Path(__file__).with_name("theme.yaml"))

    def clustering(X, algorithm, n_clusters):
        # normalize dataset for easier parameter selection
        X = StandardScaler().fit_transform(X)

        # estimate bandwidth for mean shift
        bandwidth = cluster.estimate_bandwidth(X, quantile=0.3)

        # connectivity matrix for structured Ward
        connectivity = kneighbors_graph(X, n_neighbors=10, include_self=False)

        # make connectivity symmetric
        connectivity = 0.5 * (connectivity + connectivity.T)

        # Generate the new colors:
        match algorithm:
            case "MiniBatchKMeans":
                model = cluster.MiniBatchKMeans(n_clusters=n_clusters, n_init=3, random_state=rng)
            case "Birch":
                model = cluster.Birch(n_clusters=n_clusters)
            case "DBSCAN":
                model = cluster.DBSCAN(eps=.2)
            case "AffinityPropagation":
                model = cluster.AffinityPropagation(
                    damping=.9,
                    preference=-200,
                    random_state=rng,
                )
            case "MeanShift":
                model = cluster.MeanShift(
                    bandwidth=bandwidth,
                    bin_seeding=True,
                )
            case "SpectralClustering":
                model = cluster.SpectralClustering(
                    n_clusters=n_clusters,
                    eigen_solver="arpack",
                    random_state=rng,
                    affinity="nearest_neighbors",
                )
            case "Ward":
                model = cluster.AgglomerativeClustering(
                    n_clusters=n_clusters,
                    linkage="ward",
                    connectivity=connectivity,
                )
            case "AgglomerativeClustering":
                model = cluster.AgglomerativeClustering(
                    linkage="average",
                    metric="cityblock",
                    n_clusters=n_clusters,
                    connectivity=connectivity,
                )

        model.fit(X)

        if hasattr(model, 'labels_'):
            y_pred = model.labels_.astype(int)
        else:
            y_pred = model.predict(X)

        return X, y_pred

    def get_dataset(dataset: str, n_samples: int):
        match dataset:
            case "Noisy Circles":
                return datasets.make_circles(n_samples=n_samples, factor=0.5, noise=0.05, random_state=rng)
            case "Noisy Moons":
                return datasets.make_moons(n_samples=n_samples, noise=0.05, random_state=rng)
            case "Blobs":
                return datasets.make_blobs(n_samples=n_samples, random_state=8)
            case "No Structure":
                return rng.rand(n_samples, 2), None

    n_samples = 1500

    n_clusters = 2

    algorithm = 'MiniBatchKMeans'

    dataset = 'Noisy Circles'

    X, y = get_dataset(dataset, n_samples)

    X, _y_pred = clustering(X, algorithm, n_clusters)

    spectral = np.hstack([Spectral6] * 20)

    colors = [spectral[i] for i in y]

    plot = figure(toolbar_location=None, title=algorithm)

    source = ColumnDataSource(data=dict(x=X[:, 0], y=X[:, 1], colors=colors))

    plot.scatter('x', 'y', fill_color='colors', line_color=None, source=source)

    clustering_algorithms= [
        'MiniBatchKMeans',
        'AffinityPropagation',
        'MeanShift',
        'SpectralClustering',
        'Ward',
        'AgglomerativeClustering',
        'DBSCAN',
        'Birch',
    ]

    datasets_names = [
        'Noisy Circles',
        'Noisy Moons',
        'Blobs',
        'No Structure',
    ]

    algorithm_select = Select(value='MiniBatchKMeans',
                              title='Select algorithm:',
                              width=200,
                              options=clustering_algorithms)

    dataset_select = Select(value='Noisy Circles',
                            title='Select dataset:',
                            width=200,
                            options=datasets_names)

    samples_slider = Slider(title="Number of samples",
                            value=1500.0,
                            start=1000.0,
                            end=3000.0,
                            step=100,
                            width=400)

    clusters_slider = Slider(title="Number of clusters",
                             value=2.0,
                             start=2.0,
                             end=10.0,
                             step=1,
                             width=400)

    def update_algorithm_or_clusters(attrname, old, new):
        nonlocal X

        algorithm = algorithm_select.value
        n_clusters = int(clusters_slider.value)

        X, y_pred = clustering(X, algorithm, n_clusters)
        colors = [spectral[i] for i in y_pred]

        source.data = dict(colors=colors, x=X[:, 0], y=X[:, 1])

        plot.title.text = algorithm

    def update_samples_or_dataset(attrname, old, new):
        nonlocal X, y

        dataset = dataset_select.value
        algorithm = algorithm_select.value
        n_clusters = int(clusters_slider.value)
        n_samples = int(samples_slider.value)

        X, y = get_dataset(dataset, n_samples)
        X, y_pred = clustering(X, algorithm, n_clusters)
        colors = [spectral[i] for i in y_pred]

        source.data = dict(colors=colors, x=X[:, 0], y=X[:, 1])

    algorithm_select.on_change('value', update_algorithm_or_clusters)

    clusters_slider.on_change('value_throttled', update_algorithm_or_clusters)

    dataset_select.on_change('value', update_samples_or_dataset)

    samples_slider.on_change('value_throttled', update_samples_or_dataset)

    selects = row(dataset_select, algorithm_select, width=420)

    inputs = column(selects, samples_slider, clusters_slider)

    doc.add_root(row(inputs, plot))

    doc.title = "Clustering"


app = BokehASGI(modify_document)
