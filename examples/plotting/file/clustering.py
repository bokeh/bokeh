""" Example inspired by an example from the scikit-learn project:
http://scikit-learn.org/stable/auto_examples/cluster/plot_cluster_comparison.html
"""

import time

import numpy as np

try:
    import sklearn
except ImportError:
    raise ImportError('This example requires scikit-learn (conda install sklearn)')

from sklearn import cluster, datasets
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler

from bokeh.plotting import Figure, show, output_file
from bokeh.models import HBox, VBox

N = 50000
PLOT_SIZE = 400

# Generate datasets. 
np.random.seed(0)
noisy_circles = datasets.make_circles(n_samples=N, factor=.5, noise=.04)
noisy_moons = datasets.make_moons(n_samples=N, noise=.05)
centers = [(-2, 3), (2, 3), (-2, -3), (2, -3)]
blobs1 = datasets.make_blobs(centers=centers, n_samples=N, cluster_std=0.4, random_state=8)
blobs2 = datasets.make_blobs(centers=centers, n_samples=N, cluster_std=0.7, random_state=8)

colors = np.array([x for x in ('#00f', '#0f0', '#f00', '#0ff', '#f0f', '#ff0')])
colors = np.hstack([colors] * 20)

# Create clustering algorithms
dbscan   = cluster.DBSCAN(eps=.2)
birch    = cluster.Birch(n_clusters=2)
means    = cluster.MiniBatchKMeans(n_clusters=2)
spectral = cluster.SpectralClustering(n_clusters=2, eigen_solver='arpack', affinity="nearest_neighbors")
affinity = cluster.AffinityPropagation(damping=.9, preference=-200)

# Select clustering algorithm (note: spectral is slow)
algorithm = dbscan  # <- SELECT ALG
name = algorithm.__class__.__name__

plots =[]
for i_dataset, dataset in enumerate([noisy_circles, noisy_moons, blobs1, blobs2]):
    X, y = dataset
    X = StandardScaler().fit_transform(X)
    
    # Predict cluster memberships
    algorithm.fit(X)
    if hasattr(algorithm, 'labels_'):
        y_pred = algorithm.labels_.astype(np.int)
    else:
        y_pred = algorithm.predict(X)
    
    # Plot
    p = Figure(webgl=True, title=name, plot_width=PLOT_SIZE, plot_height=PLOT_SIZE)
    p.scatter(X[:, 0], X[:, 1], color=colors[y_pred].tolist(), alpha=0.1,)
    plots.append(p)

# Genearate and show the plot
box = VBox(HBox(plots[0], plots[1]), HBox(plots[2], plots[3]))
output_file("clustering.html", title="clustering with sklearn")
show(box)
