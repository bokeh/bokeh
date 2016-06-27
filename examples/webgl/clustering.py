""" Example inspired by an example from the scikit-learn project:
http://scikit-learn.org/stable/auto_examples/cluster/plot_cluster_comparison.html
"""

import numpy as np

try:
    from sklearn import cluster, datasets
    from sklearn.preprocessing import StandardScaler
except ImportError:
    raise ImportError('This example requires scikit-learn (conda install sklearn)')

from bokeh.layouts import row, column
from bokeh.plotting import figure, show, output_file

N = 50000
PLOT_SIZE = 400

# generate datasets.
np.random.seed(0)
noisy_circles = datasets.make_circles(n_samples=N, factor=.5, noise=.04)
noisy_moons = datasets.make_moons(n_samples=N, noise=.05)
centers = [(-2, 3), (2, 3), (-2, -3), (2, -3)]
blobs1 = datasets.make_blobs(centers=centers, n_samples=N, cluster_std=0.4, random_state=8)
blobs2 = datasets.make_blobs(centers=centers, n_samples=N, cluster_std=0.7, random_state=8)

colors = np.array([x for x in ('#00f', '#0f0', '#f00', '#0ff', '#f0f', '#ff0')])
colors = np.hstack([colors] * 20)

# create clustering algorithms
dbscan   = cluster.DBSCAN(eps=.2)
birch    = cluster.Birch(n_clusters=2)
means    = cluster.MiniBatchKMeans(n_clusters=2)
spectral = cluster.SpectralClustering(n_clusters=2, eigen_solver='arpack', affinity="nearest_neighbors")
affinity = cluster.AffinityPropagation(damping=.9, preference=-200)

# change here, to select clustering algorithm (note: spectral is slow)
algorithm = dbscan  # <- SELECT ALG

plots =[]
for dataset in (noisy_circles, noisy_moons, blobs1, blobs2):
    X, y = dataset
    X = StandardScaler().fit_transform(X)

    # predict cluster memberships
    algorithm.fit(X)
    if hasattr(algorithm, 'labels_'):
        y_pred = algorithm.labels_.astype(np.int)
    else:
        y_pred = algorithm.predict(X)

    p = figure(webgl=True, title=algorithm.__class__.__name__,
               plot_width=PLOT_SIZE, plot_height=PLOT_SIZE)

    p.scatter(X[:, 0], X[:, 1], color=colors[y_pred].tolist(), alpha=0.1,)

    plots.append(p)

# generate layout for the plots
layout = column(row(plots[:2]), row(plots[2:]))

output_file("clustering.html", title="clustering with sklearn")

show(layout)
